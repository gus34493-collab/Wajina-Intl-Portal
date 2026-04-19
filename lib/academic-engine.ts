import prisma from "./prisma";

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

export function getAssessmentConfig(campus: string, category: string, className = '') {
  const name = (className || '').toUpperCase();
  const cat = (category || '').toLowerCase();
  
  const isSenior = cat.includes('senior') || cat.includes('sss') || name.startsWith('SSS') || name.startsWith('SS');
  const isPrimary = campus === 'PRIMARY' || name.startsWith('BASIC') || name.startsWith('PRY');
  const isEarlyYears = cat.includes('nursery') || cat.includes('creche') || name.startsWith('NUR') || name.startsWith('CRE');

  if (isEarlyYears) {
    return {
      type: 'EARLY_YEARS',
      labels: ['Physiological', 'Cognitive', 'Social', 'Creative'],
      maxScores: [25, 25, 25, 25],
      total: 100,
      scale: DEFAULT_GRADING_SCALE
    };
  }

  if (isPrimary) {
    return {
      type: 'PRIMARY',
      labels: ['CA 1', 'CA 2', 'CA 3', 'CA 4', 'CA 5', 'Exams'],
      maxScores: [10, 10, 10, 10, 10, 50],
      total: 100,
      scale: DEFAULT_GRADING_SCALE
    };
  }

  if (isSenior) {
    return {
      type: 'SENIOR_SECONDARY',
      labels: ['CA 1', 'CA 2', 'CA 3', 'Exams'],
      maxScores: [10, 10, 10, 70],
      total: 100,
      scale: SSS_GRADING_SCALE
    };
  } else {
    return {
      type: 'JUNIOR_SECONDARY',
      labels: ['CA 1', 'CA 2', 'CA 3', 'Exams'],
      maxScores: [15, 15, 10, 60],
      total: 100,
      scale: DEFAULT_GRADING_SCALE
    };
  }
}

export function calculateScore(data: any, config: any) {
  const { firstCA = 0, secondCA = 0, thirdCA = 0, fourthCA = 0, fifthCA = 0, exam = 0 } = data;
  
  let total = 0;
  if (config.type === 'PRIMARY') {
    total = firstCA + secondCA + thirdCA + fourthCA + fifthCA + exam;
  } else {
    total = firstCA + secondCA + thirdCA + exam;
  }

  total = Math.round(total * 100) / 100;
  const grading = config.scale.find((g: any) => total >= g.min) || config.scale[config.scale.length - 1];

  return {
    total,
    grade: grading.grade,
    remark: grading.remark
  };
}

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
