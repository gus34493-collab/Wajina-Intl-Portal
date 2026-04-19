import prisma from '../prisma';

/**
 * Institutional Intelligence Service
 * Centralized logic for complex SQL aggregations and predictive analytics.
 */

export const getFinancialSnapshot = async (campus?: string) => {
  // 1. Session Discovery
  let session = await prisma.academicSession.findFirst({ where: { status: 'ACTIVE' } });
  if (!session) session = await prisma.academicSession.findFirst({ orderBy: { year: 'desc' } });
  if (!session) return {
    totalCollected: 0,
    totalExpected: 0,
    deficit: 0,
    collectionRate: 0,
    velocity: 0,
    sessionName: 'None'
  };

  // 2. Collections (Approved Tuition)
  const collections = await prisma.payment.aggregate({
    where: {
      sessionId: session.id,
      status: 'APPROVED',
      category: 'TUITION',
      ...(campus && { student: { campus: campus as any } })
    },
    _sum: { amount: true }
  });

  // 3. Expected Revenue (Smart Target)
  const studentGroups = await prisma.user.groupBy({
    by: ['classId', 'campus'],
    where: {
      role: 'STUDENT',
      ...(campus && { campus: campus as any })
    },
    _count: { _all: true }
  });

  const feeConfigs = await prisma.feeConfig.findMany({
    where: { sessionId: session.id, category: 'TUITION' }
  });

  let totalExpected = 0;
  for (const group of studentGroups) {
    const config =
      feeConfigs.find(c => c.classId === group.classId) ||
      feeConfigs.find(c => c.campus === group.campus && !c.classId) ||
      feeConfigs.find(c => !c.campus && !c.classId);

    if (config) {
      totalExpected += (Number(config.amount) * group._count._all);
    }
  }

  const collected = (collections._sum as any).amount || 0;
  const deficit = totalExpected - collected;

  // 4. Campus Breakdown (For Director/Global View)
  let breakdown = null;
  if (!campus) {
    const primary = await getFinancialSnapshot('PRIMARY');
    const secondary = await getFinancialSnapshot('SECONDARY');
    breakdown = [
      { name: 'Primary Campus', ...primary },
      { name: 'Secondary Campus', ...secondary }
    ];
  }

  // 5. Recovery Velocity (Last 14 Days vs Previous 14 Days)
  const now = new Date();
  const fourteenDaysAgo = new Date(now.getTime() - (14 * 24 * 60 * 60 * 1000));
  const twentyEightDaysAgo = new Date(now.getTime() - (28 * 24 * 60 * 60 * 1000));

  const currentPeriod = await prisma.payment.aggregate({
    where: {
      sessionId: session.id, status: 'APPROVED', category: 'TUITION',
      createdAt: { gte: fourteenDaysAgo },
      ...(campus && { student: { campus: campus as any } })
    },
    _sum: { amount: true }
  });

  const previousPeriod = await prisma.payment.aggregate({
    where: {
      sessionId: session.id, status: 'APPROVED', category: 'TUITION',
      createdAt: { gte: twentyEightDaysAgo, lt: fourteenDaysAgo },
      ...(campus && { student: { campus: campus as any } })
    },
    _sum: { amount: true }
  });

  const currentSum = (currentPeriod._sum as any).amount || 0;
  const previousSum = (previousPeriod._sum as any).amount || 0;
  const velocity = previousSum > 0 ? (currentSum - previousSum) / previousSum : 0;

  return {
    totalCollected: collected,
    totalExpected,
    deficit,
    collectionRate: totalExpected > 0 ? Math.round((collected / totalExpected) * 100) : 0,
    velocity: Math.round(velocity * 100), // Percentage trend
    sessionName: session.name
  };
};

export const getAcademicPulse = async (campus?: string) => {
  const latestTerm = await prisma.term.findFirst({
    where: { status: 'CURRENT' },
    orderBy: { startDate: 'desc' }
  });
  if (!latestTerm) return { mean: 0, passRate: 0, atRisk: 0 };

  const approvedGrades = await prisma.grade.findMany({
    where: {
      termId: latestTerm.id,
      status: 'PRINCIPAL_APPROVED',
      ...(campus && { student: { campus: campus as any } })
    },
    select: { total: true, studentId: true }
  });

  if (approvedGrades.length === 0) return { mean: 0, passRate: 0, atRisk: 0 };

  const totalScore = approvedGrades.reduce((sum, g) => sum + g.total, 0);
  const mean = totalScore / approvedGrades.length;

  const passCount = approvedGrades.filter(g => g.total >= 50).length;
  const passRate = (passCount / approvedGrades.length) * 100;

  // At-Risk: Students with mean < 45 across their subjects
  const studentMap: any = {};
  approvedGrades.forEach(g => {
    if (!studentMap[g.studentId]) studentMap[g.studentId] = [];
    studentMap[g.studentId].push(g.total);
  });

  const atRiskCount = Object.values(studentMap).filter((scores: any) => {
    const avg = scores.reduce((a: number, b: number) => a + b, 0) / scores.length;
    return avg < 45;
  }).length;

  return {
    mean: Math.round(mean * 10) / 10,
    passRate: Math.round(passRate),
    atRisk: atRiskCount
  };
};

export const getOperationalStats = async (campus?: string) => {
  // 1. Lesson Note Compliance (Current Week)
  const monday = new Date();
  monday.setDate(monday.getDate() - (monday.getDay() - 1));
  monday.setHours(0, 0, 0, 0);

  const [totalTeachers, totalStudents, submittedNotes] = await Promise.all([
    prisma.user.count({ where: { role: 'TEACHER', status: 'ACTIVE', ...(campus && { campus: campus as any }) } }),
    prisma.user.count({ where: { role: 'STUDENT', status: 'ACTIVE', ...(campus && { campus: campus as any }) } }),
    prisma.request.groupBy({
      by: ['senderId'],
      where: {
        category: 'LESSON_PLAN',
        createdAt: { gte: monday },
        ...(campus && { sender: { campus: campus as any } })
      }
    })
  ]);

  const complianceRate = totalTeachers > 0 ? (submittedNotes.length / totalTeachers) * 100 : 0;

  // 2. Attendance (Last 7 Days)
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const [present, total] = await Promise.all([
    prisma.attendance.count({ where: { status: 'PRESENT', date: { gte: sevenDaysAgo }, ...(campus && { student: { campus: campus as any } }) } }),
    prisma.attendance.count({ where: { date: { gte: sevenDaysAgo }, ...(campus && { student: { campus: campus as any } }) } }),
  ]);

  const attendanceRate = total > 0 ? (present / total) * 100 : 0;

  return {
    lessonNoteCompliance: Math.round(complianceRate),
    attendanceRate: Math.round(attendanceRate),
    teacherCount: totalTeachers,
    studentCount: totalStudents
  };
};

/**
 * Robust Monday-anchor without external dependencies.
 * Handles Sunday wrap-around and normalizes time to 00:00:00.
 */
const getMondayOf = (d: Date) => {
  const date = new Date(d);
  const day = date.getDay();
  // If Sunday (0), we need to go back 6 days. Otherwise, back (day - 1) days.
  const diff = date.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(date.setDate(diff));
  monday.setHours(0, 0, 0, 0);
  return monday;
};

/**
 * Financial Intelligence: Weekly Fee Compliance
 * Uses a Normalized Weight Vector to calculate realistic weekly targets.
 */
export const getWeeklyFeeCompliance = async (campus?: string) => {
  // 1. Context Discovery
  let session = await prisma.academicSession.findFirst({ where: { status: 'ACTIVE' }, include: { terms: true } });
  if (!session) return null;

  const currentTerm = session.terms.find(t => t.status === 'CURRENT') || session.terms[0];
  if (!currentTerm) return {
    weeklyTarget: 0,
    weeklyActual: 0,
    totalTargetToDate: 0,
    termActual: 0,
    advancePayments: 0,
    complianceRate: 0,
    termCompliance: 0,
    status: 'DELAYED'
  };

  // 2. Weight Profile Discovery
  const termWeights: any = session.termWeights || [];
  const activeWeight = termWeights.find((w: any) => w.term === currentTerm.name) || { profile: 'ACCELERATED' };

  // 3. Expected Revenue (Total for Term)
  const snapshot = await getFinancialSnapshot(campus);
  if (!snapshot) return {
    weeklyTarget: 0,
    weeklyActual: 0,
    totalTargetToDate: 0,
    termActual: 0,
    advancePayments: 0,
    complianceRate: 0,
    termCompliance: 0,
    status: 'DELAYED'
  };
  const termTotalTarget = snapshot.totalExpected / session.terms.length; // Approximate proration per term

  // 4. Distribution Curve (Normalized)
  const termLengthWeeks = Math.max(1, activeWeight.weeks || Math.ceil((currentTerm.endDate.getTime() - currentTerm.startDate.getTime()) / (7 * 24 * 60 * 60 * 1000)));

  let weights: number[] = [];
  if (activeWeight.profile === 'ACCELERATED') {
    weights = [0.4, 0.2, 0.1, 0.05]; // Decay curve
  } else if (activeWeight.profile === 'FRONT_LOADED') {
    weights = [0.6, 0.1, 0.05];
  } else {
    weights = [1 / termLengthWeeks]; // Linear
  }

  // Normalize weights to 1.0 total across termLengthWeeks
  const currentSum = weights.reduce((a, b) => a + b, 0);
  const distribution = new Array(termLengthWeeks).fill(0).map((_, i) => {
    if (weights[i] !== undefined) {
      // If weights exceed 1.0 already (unlikely with presets), cap them
      return Math.min(weights[i], 1.0);
    }
    const remainingWeight = Math.max(0, 1 - currentSum);
    const remainingWeeks = Math.max(0, termLengthWeeks - weights.length);
    return remainingWeeks > 0 ? remainingWeight / remainingWeeks : 0;
  });

  // Final drift correction: ensure sum is exactly 1.0
  const finalSum = distribution.reduce((a, b) => a + b, 0);
  if (finalSum > 0 && Math.abs(finalSum - 1.0) > 0.0001) {
    distribution[0] += (1.0 - finalSum);
  }

  // 5. Current Week Progress
  const monday = getMondayOf(new Date());
  const weeksSinceStart = Math.max(0, Math.floor((monday.getTime() - currentTerm.startDate.getTime()) / (7 * 24 * 60 * 60 * 1000)));

  // Accumulated target up to current week
  const weekIndex = Math.min(weeksSinceStart, termLengthWeeks - 1);
  const accumulatedWeight = Math.min(1.0, distribution.slice(0, weekIndex + 1).reduce((a, b) => a + b, 0));
  const weeklyTarget = termTotalTarget * (distribution[weekIndex] || 0);
  const totalTargetToDate = termTotalTarget * accumulatedWeight;

  // 6. Actual Collections (Segregated)
  const collections = await prisma.payment.aggregate({
    where: {
      termId: currentTerm.id,
      status: 'APPROVED',
      createdAt: { gte: monday },
      ...(campus && { student: { campus: campus as any } })
    },
    _sum: { amount: true }
  });

  const totalTermCollections = await prisma.payment.aggregate({
    where: {
      termId: currentTerm.id,
      status: 'APPROVED',
      ...(campus && { student: { campus: campus as any } })
    },
    _sum: { amount: true }
  });

  const weeklyActual = (collections._sum as any).amount || 0;
  const termActual = (totalTermCollections._sum as any).amount || 0;

  // 7. Advance Payments (Future Analysis)
  const futurePayments = await prisma.payment.aggregate({
    where: {
      sessionId: session.id,
      status: 'APPROVED',
      NOT: { termId: currentTerm.id },
      ...(campus && { student: { campus: campus as any } })
    },
    _sum: { amount: true }
  });

  return {
    weeklyTarget,
    weeklyActual,
    totalTargetToDate,
    termActual,
    advancePayments: (futurePayments._sum as any).amount || 0,
    complianceRate: weeklyTarget > 0 ? Math.round((weeklyActual / weeklyTarget) * 100) : 0,
    termCompliance: termTotalTarget > 0 ? Math.round((termActual / termTotalTarget) * 100) : 0,
    status: weeklyActual >= weeklyTarget ? 'ON_TRACK' : 'DELAYED'
  };
};

/**
 * Subject Intelligence: Analytics by Subject
 * Aggregates performance metrics for every academic subject.
 */
export const getSubjectAnalytics = async (campus?: string) => {
  const latestTerm = await prisma.term.findFirst({
    where: { status: 'CURRENT' },
    orderBy: { startDate: 'desc' }
  });
  if (!latestTerm) return [];

  const subjects = await prisma.subject.findMany({
    where: { ...(campus && { class: { campus: campus as any } }) },
    include: {
      class: { select: { name: true } },
      grades: {
        where: { termId: latestTerm.id, status: 'PRINCIPAL_APPROVED' },
        select: { total: true }
      }
    }
  });

  return subjects.map(s => {
    const avg = s.grades.length > 0
      ? s.grades.reduce((sum, g) => sum + g.total, 0) / s.grades.length
      : 0;
    return {
      id: s.id,
      name: s.name,
      className: s.class.name,
      average: Math.round(avg * 10) / 10,
      studentCount: s.grades.length
    };
  }).sort((a, b) => b.average - a.average);
};

/**
 * Retention Analysis: Class-level stability metrics
 * Retention = Avg(Attendance Compliance, Fee Compliance)
 */
export const getRetentionAnalysis = async (campus?: string) => {
  const latestTerm = await prisma.term.findFirst({
    where: { status: 'CURRENT' },
    orderBy: { startDate: 'desc' }
  });
  if (!latestTerm) return [];

  const classes = await prisma.class.findMany({
    where: { ...(campus && { campus: campus as any }) },
    include: {
      students: {
        where: { role: 'STUDENT', status: 'ACTIVE' },
        select: {
          id: true,
          attendance: { where: { termId: latestTerm.id } },
          payments: {
            where: { termId: latestTerm.id, category: 'TUITION', status: { in: ['SUCCESS', 'APPROVED'] } }
          }
        }
      }
    }
  });

  return classes.map(c => {
    const studentStats = c.students.map(s => {
      const hasGoodAttendance = s.attendance.length > 5; // Placeholder for stability logic
      const hasPaidFees = s.payments.length > 0;
      return { hasGoodAttendance, hasPaidFees };
    });

    const attendanceCompliance = studentStats.length > 0
      ? (studentStats.filter(s => s.hasGoodAttendance).length / studentStats.length) * 100
      : 0;
    const feeCompliance = studentStats.length > 0
      ? (studentStats.filter(s => s.hasPaidFees).length / studentStats.length) * 100
      : 0;

    return {
      className: c.name,
      campus: c.campus,
      studentCount: c.students.length,
      attendanceCompliance: Math.round(attendanceCompliance),
      feeCompliance: Math.round(feeCompliance),
      retentionScore: Math.round((attendanceCompliance + feeCompliance) / 2)
    };
  }).sort((a, b) => b.retentionScore - a.retentionScore);
};

/**
 * Detailed Academic Stats for Director oversight.
 */
export const getDetailedAcademicStats = async (campus?: string) => {
  const latestTerm = await prisma.term.findFirst({
    where: { status: 'CURRENT' },
    orderBy: { startDate: 'desc' }
  });
  if (!latestTerm) return { submissionRate: 0, overdueCount: 0 };

  const subjects = await prisma.subject.findMany({
    where: { ...(campus && { class: { campus: campus as any } }) },
    include: {
      grades: {
        where: { termId: latestTerm.id }
      }
    }
  });

  if (subjects.length === 0) return { submissionRate: 0, overdueCount: 0 };

  const submittedSubjects = subjects.filter(s =>
    s.grades.length > 0 && s.grades.every(g => g.status !== 'DRAFT')
  ).length;

  const submissionRate = Math.round((submittedSubjects / subjects.length) * 100);
  const overdueCount = subjects.length - submittedSubjects;

  return { submissionRate, overdueCount };
};

/**
 * Critical Academic Alerts: Subjects that have not yet submitted grades.
 */
export const getAcademicAlerts = async (campus?: string) => {
  const latestTerm = await prisma.term.findFirst({
    where: { status: 'CURRENT' },
    orderBy: { startDate: 'desc' }
  });
  if (!latestTerm) return [];

  const subjects = await prisma.subject.findMany({
    where: { ...(campus && { class: { campus: campus as any } }) },
    include: {
      class: { select: { campus: true } },
      teacher: { select: { name: true } },
      grades: {
        where: { termId: latestTerm.id }
      }
    }
  });

  // An alert is a subject where grades exist but are in DRAFT, or no grades exist yet.
  const alerts = subjects.filter(s => {
    if (s.grades.length === 0) return true;
    return s.grades.some(g => g.status === 'DRAFT' || g.status === 'RETURNED');
  });

  return alerts.map(s => ({
    id: s.id,
    subjectName: s.name,
    campus: s.class.campus,
    teacherName: s.teacher?.name || 'Unassigned',
    status: s.grades.length === 0 ? 'PENDING' : s.grades.some(g => g.status === 'RETURNED') ? 'RETURNED' : 'DRAFT'
  })).slice(0, 10); // Limit to top 10 for dashboard
};
