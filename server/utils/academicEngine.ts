import prisma from '../prisma';

/**
 * Academic Engine
 * Handles specialized campus-aware calculations, grading, and debt-blocking.
 */

export const DEFAULT_GRADING_SCALE = [
  { min: 75, grade: 'A', remark: 'Excellent' },
  { min: 65, grade: 'B', remark: 'Very Good' },
  { min: 55, grade: 'C', remark: 'Good' },
  { min: 45, grade: 'D', remark: 'Pass' },
  { min: 40, grade: 'E', remark: 'Fair' },
  { min: 0,  grade: 'F', remark: 'Fail' },
];

export const SSS_GRADING_SCALE = [
  { min: 75, grade: 'A1', remark: 'Excellent' },
  { min: 70, grade: 'B2', remark: 'Very Good' },
  { min: 65, grade: 'B3', remark: 'Good' },
  { min: 60, grade: 'C4', remark: 'Credit' },
  { min: 55, grade: 'C5', remark: 'Credit' },
  { min: 50, grade: 'C6', remark: 'Credit' },
  { min: 45, grade: 'D7', remark: 'Pass' },
  { min: 40, grade: 'E8', remark: 'Pass' },
  { min: 0,  grade: 'F9', remark: 'Fail' },
];

/**
 * Identify assessment configuration based on student/class context.
 * Now supports "Basic 1-6" (Primary) and "Early Years" (Nursery/Creche).
 */
export function getAssessmentConfig(campus: string, category: string, className = '') {
  const name = (className || '').toUpperCase();
  const cat = (category || '').toLowerCase();
  
  const isSenior = cat.includes('senior') || cat.includes('sss') || name.startsWith('SSS') || name.startsWith('SS');
  const isPrimary = campus === 'PRIMARY' || name.startsWith('BASIC') || name.startsWith('PRY');
  const isEarlyYears = cat.includes('nursery') || cat.includes('creche') || name.startsWith('NUR') || name.startsWith('CRE');

  if (isEarlyYears) {
    return {
      type: 'EARLY_YEARS' as const,
      labels: ['Physiological', 'Cognitive', 'Social', 'Creative'],
      maxScores: [25, 25, 25, 25],
      total: 100,
      scale: DEFAULT_GRADING_SCALE
    };
  }

  if (isPrimary) {
    return {
      type: 'PRIMARY' as const,
      labels: ['CA 1', 'CA 2', 'CA 3', 'CA 4', 'CA 5', 'Exams'],
      maxScores: [10, 10, 10, 10, 10, 50],
      total: 100,
      scale: DEFAULT_GRADING_SCALE
    };
  }

  if (isSenior) {
    return {
      type: 'SENIOR_SECONDARY' as const,
      labels: ['CA 1', 'CA 2', 'CA 3', 'Exams'],
      maxScores: [10, 10, 10, 70],
      total: 100,
      scale: SSS_GRADING_SCALE
    };
  } else {
    // Default to Junior Secondary
    return {
      type: 'JUNIOR_SECONDARY' as const,
      labels: ['CA 1', 'CA 2', 'CA 3', 'Exams'],
      maxScores: [15, 15, 10, 60],
      total: 100,
      scale: DEFAULT_GRADING_SCALE
    };
  }
}

/**
 * Calculate total and grade for a single subject entry.
 */
export function calculateScore(data: any, config: any) {
  const { firstCA = 0, secondCA = 0, thirdCA = 0, fourthCA = 0, fifthCA = 0, exam = 0 } = data;
  
  let total = 0;
  if (config.type === 'PRIMARY') {
    total = firstCA + secondCA + thirdCA + fourthCA + fifthCA + exam;
  } else {
    total = firstCA + secondCA + thirdCA + exam;
  }

  // Round to 2 decimal places (as seen in PDF)
  total = Math.round(total * 100) / 100;

  const grading = config.scale.find((g: any) => total >= g.min) || config.scale[config.scale.length - 1];

  return {
    total,
    grade: grading.grade,
    remark: grading.remark
  };
}

/**
 * Generate automatic reports (remarks) based on score.
 */
export function generateReports(average: number) {
  if (average >= 75) return { 
    teacher: "An excellent result. Keep up the high standard.", 
    principal: "Excellent performance." 
  };
  if (average >= 65) return { 
    teacher: "A very good performance. You can do even better.", 
    principal: "Very good result." 
  };
  if (average >= 55) return { 
    teacher: "Good result. Maintain this momentum.", 
    principal: "Good performance." 
  };
  if (average >= 50) return { 
    teacher: "Average performance. More effort is needed.", 
    principal: "Average result." 
  };
  if (average >= 40) return { 
    teacher: "Fair result. Focus more on your weak areas.", 
    principal: "Fair performance." 
  };
  return { 
    teacher: "Poor result. You need to focus more on your studies.", 
    principal: "Poor performance." 
  };
}

/**
 * Check if a student can view results for a specific term based on payment status.
 */
export async function canViewResults(studentId: string, termId?: string) {
  let targetTermId = termId;

  if (!targetTermId) {
    const currentTerm = await prisma.term.findFirst({
      where: { isCurrent: true },
      select: { id: true }
    });
    
    // CRITICAL: If no term context is found, block by default. Do not allow bypass.
    if (!currentTerm) {
      console.warn(`[AcademicEngine] Access blocked for student ${studentId}: No term context found.`);
      return false;
    }
    targetTermId = currentTerm.id;
  }

  // 1. Get student context — support both arm-enrolled and directly-classed students
  const student: any = await prisma.user.findUnique({
    where: { id: studentId },
    select: {
      campus: true,
      classId: true,
      enrolledArm: { select: { classId: true, class: { select: { campus: true } } } },
      enrolledClass: { select: { campus: true } }
    }
  });
  if (!student) return false;

  // Resolve the student's effective classId and campus (arm takes priority)
  const effectiveClassId = student.enrolledArm?.classId ?? student.classId ?? null;
  const effectiveCampus  = student.enrolledArm?.class?.campus ?? student.enrolledClass?.campus ?? student.campus ?? null;

  console.log(`[DEBUG] canViewResults: student=${studentId}, term=${targetTermId}, class=${effectiveClassId}, campus=${effectiveCampus}`);

  // 2. Resolve target tuition amount
  // Hierarchy: Class-specific > Campus-specific > Global (campus null, classId null)
  const configs = await prisma.feeConfig.findMany({
    where: {
      termId: targetTermId,
      category: 'TUITION',
      OR: [
        ...(effectiveClassId ? [{ classId: effectiveClassId }] : []),
        ...(effectiveCampus  ? [{ campus: effectiveCampus, classId: null }] : []),
        { campus: null, classId: null }
      ]
    }
  });

  // If no fee config exists for this term, we assume no debt-blocking is required for this specific cycle.
  if (configs.length === 0) {
    console.log(`[DEBUG] canViewResults: No fee configs found for term ${targetTermId}`);
    return true;
  }

  // Priority: CLASS > CAMPUS > GLOBAL
  const feeConfig =
    (effectiveClassId ? configs.find((c: any) => c.classId === effectiveClassId) : null) ||
    (effectiveCampus  ? configs.find((c: any) => c.campus === effectiveCampus && !c.classId) : null) ||
    configs.find((c: any) => !c.campus && !c.classId);

  console.log(`[DEBUG] canViewResults: Matched feeConfig=${JSON.stringify(feeConfig)}`);

  if (!feeConfig || Number(feeConfig.amount) <= 0) return true;

  // 3. Sum all approved tuition payments for this term
  const payments = await prisma.payment.findMany({
    where: {
      studentId,
      termId: targetTermId,
      category: 'TUITION',
      status: { in: ['SUCCESS', 'APPROVED'] }
    },
    select: { amount: true }
  });

  const totalPaid = payments.reduce((sum: number, p: any) => sum + p.amount, 0);

  // 4. Allow only if fully paid
  const isAllowed = totalPaid >= Number(feeConfig.amount);
  
  if (!isAllowed) {
    console.log(`[AcademicEngine] Student ${studentId} blocked: Paid ${totalPaid}/${feeConfig.amount} for term ${targetTermId}`);
  }

  return isAllowed;
}

/**
 * Calculate Annual Mean across terms (always divide by 3).
 * Precision: 2 decimal places.
 */
export function calculateAnnualMean(termResults: number[]) {
  const sum = (termResults || []).reduce((acc, val) => acc + (val || 0), 0);
  return Math.round((sum / 3) * 100) / 100;
}

/**
 * Positioning Engine: Assigns ordinal ranks to students based on averages.
 * Optional: includes a toggle parameter for external state control.
 */
export function calculatePositions(students: any[], enabled = true) {
  if (!enabled) return students.map(s => ({ ...s, position: null }));

  const sorted = [...students].sort((a, b) => (b.average || 0) - (a.average || 0));
  return sorted.map((s, index) => {
    let position = `${index + 1}`;
    const rank = index + 1;
    
    // Nigerian English Ordinals (1st, 2nd, 3rd...)
    if (rank === 1) position += 'st';
    else if (rank === 2) position += 'nd';
    else if (rank === 3) position += 'rd';
    else position += 'th';

    return { ...s, position };
  });
}

/**
 * Standard Nigerian Affective/Psychomotor Keys.
 */
export const AFFECTIVE_KEYS = [
  { id: 'punctuality', label: 'Punctuality' },
  { id: 'neatness', label: 'Neatness' },
  { id: 'honesty', label: 'Honesty' },
  { id: 'reliability', label: 'Reliability' },
  { id: 'relationshipWithOthers', label: 'Relationship with Others' }
];

export const PSYCHOMOTOR_KEYS = [
  { id: 'handwriting', label: 'Handwriting' },
  { id: 'sports', label: 'Sports & Games' },
  { id: 'manualSkill', label: 'Manual Skill (Craft)' },
  { id: 'fluency', label: 'Fluency' }
];
