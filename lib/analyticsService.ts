import prisma from "@/lib/prisma";

export const getFinancialSnapshot = async (campus?: string): Promise<{
  totalCollected: number; totalExpected: number; deficit: number;
  collectionRate: number; velocity: number; sessionName: string;
}> => {
  let session = await prisma.academicSession.findFirst({ where: { status: "ACTIVE" } });
  if (!session) session = await prisma.academicSession.findFirst({ orderBy: { year: "desc" } });
  if (!session) return { totalCollected: 0, totalExpected: 0, deficit: 0, collectionRate: 0, velocity: 0, sessionName: "None" };

  const collections = await prisma.payment.aggregate({
    where: { sessionId: session.id, status: "CONFIRMED", category: "TUITION", ...(campus && { student: { campus: campus as any } }) },
    _sum: { amount: true },
  });

  const studentGroups = await prisma.user.groupBy({
    by: ["classId", "campus"],
    where: { role: "STUDENT", ...(campus && { campus: campus as any }) },
    _count: { _all: true },
  });

  const feeConfigs = await prisma.feeConfig.findMany({ where: { sessionId: session.id, category: "TUITION" } });

  let totalExpected = 0;
  for (const group of studentGroups) {
    const config =
      feeConfigs.find((c) => c.classId === group.classId) ||
      feeConfigs.find((c) => c.campus === group.campus && !c.classId) ||
      feeConfigs.find((c) => !c.campus && !c.classId);
    if (config) totalExpected += Number(config.amount) * group._count._all;
  }

  const collected = (collections._sum as any).amount || 0;
  const deficit = totalExpected - collected;

  const now = new Date();
  const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
  const twentyEightDaysAgo = new Date(now.getTime() - 28 * 24 * 60 * 60 * 1000);

  const [currentPeriod, previousPeriod] = await Promise.all([
    prisma.payment.aggregate({ where: { sessionId: session.id, status: "CONFIRMED", category: "TUITION", createdAt: { gte: fourteenDaysAgo }, ...(campus && { student: { campus: campus as any } }) }, _sum: { amount: true } }),
    prisma.payment.aggregate({ where: { sessionId: session.id, status: "CONFIRMED", category: "TUITION", createdAt: { gte: twentyEightDaysAgo, lt: fourteenDaysAgo }, ...(campus && { student: { campus: campus as any } }) }, _sum: { amount: true } }),
  ]);

  const currentSum = (currentPeriod._sum as any).amount || 0;
  const previousSum = (previousPeriod._sum as any).amount || 0;
  const velocity = previousSum > 0 ? (currentSum - previousSum) / previousSum : 0;

  return {
    totalCollected: collected,
    totalExpected,
    deficit,
    collectionRate: totalExpected > 0 ? Math.round((collected / totalExpected) * 100) : 0,
    velocity: Math.round(velocity * 100),
    sessionName: session.name,
  };
};

export const getAcademicPulse = async (campus?: string) => {
  const latestTerm = await prisma.term.findFirst({ where: { status: "CURRENT" }, orderBy: { startDate: "desc" } });
  if (!latestTerm) return { mean: 0, passRate: 0, atRisk: 0 };

  const approvedGrades = await prisma.grade.findMany({
    where: { termId: latestTerm.id, status: "PRINCIPAL_APPROVED", ...(campus && { student: { campus: campus as any } }) },
    select: { total: true, studentId: true },
  });

  if (approvedGrades.length === 0) return { mean: 0, passRate: 0, atRisk: 0 };

  const mean = approvedGrades.reduce((s, g) => s + g.total, 0) / approvedGrades.length;
  const passRate = (approvedGrades.filter((g) => g.total >= 50).length / approvedGrades.length) * 100;

  const studentMap: Record<string, number[]> = {};
  approvedGrades.forEach((g) => { (studentMap[g.studentId] ??= []).push(g.total); });
  const atRisk = Object.values(studentMap).filter((s) => s.reduce((a, b) => a + b, 0) / s.length < 45).length;

  return { mean: Math.round(mean * 10) / 10, passRate: Math.round(passRate), atRisk };
};

export const getOperationalStats = async (campus?: string) => {
  const monday = new Date();
  monday.setDate(monday.getDate() - (monday.getDay() - 1));
  monday.setHours(0, 0, 0, 0);
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const [totalTeachers, totalStudents, submittedNotes, present, total] = await Promise.all([
    prisma.user.count({ where: { role: "TEACHER", status: "ACTIVE", ...(campus && { campus: campus as any }) } }),
    prisma.user.count({ where: { role: "STUDENT", status: "ACTIVE", ...(campus && { campus: campus as any }) } }),
    prisma.request.groupBy({ by: ["senderId"], where: { category: "LESSON_PLAN", createdAt: { gte: monday }, ...(campus && { sender: { campus: campus as any } }) } }),
    prisma.attendance.count({ where: { status: "PRESENT", date: { gte: sevenDaysAgo }, ...(campus && { student: { campus: campus as any } }) } }),
    prisma.attendance.count({ where: { date: { gte: sevenDaysAgo }, ...(campus && { student: { campus: campus as any } }) } }),
  ]);

  return {
    lessonNoteCompliance: totalTeachers > 0 ? Math.round((submittedNotes.length / totalTeachers) * 100) : 0,
    attendanceRate: total > 0 ? Math.round((present / total) * 100) : 0,
    teacherCount: totalTeachers,
    studentCount: totalStudents,
  };
};

const getMondayOf = (d: Date) => {
  const date = new Date(d);
  const day = date.getDay();
  const diff = date.getDate() - day + (day === 0 ? -6 : 1);
  const m = new Date(date.setDate(diff));
  m.setHours(0, 0, 0, 0);
  return m;
};

export const getWeeklyFeeCompliance = async (campus?: string) => {
  const session = await prisma.academicSession.findFirst({ where: { status: "ACTIVE" }, include: { terms: true } });
  if (!session) return null;

  const currentTerm = session.terms.find((t) => t.status === "CURRENT") || session.terms[0];
  const empty = { weeklyTarget: 0, weeklyActual: 0, totalTargetToDate: 0, termActual: 0, advancePayments: 0, complianceRate: 0, termCompliance: 0, status: "DELAYED" };
  if (!currentTerm) return empty;

  const termWeights: any[] = (session.termWeights as any) || [];
  const activeWeight = termWeights.find((w: any) => w.term === currentTerm.name) || { profile: "ACCELERATED" };
  const snapshot = await getFinancialSnapshot(campus);
  const termTotalTarget = snapshot.totalExpected / Math.max(1, session.terms.length);
  const termLengthWeeks = Math.max(1, activeWeight.weeks || Math.ceil((currentTerm.endDate.getTime() - currentTerm.startDate.getTime()) / (7 * 24 * 60 * 60 * 1000)));

  let weights: number[] = activeWeight.profile === "FRONT_LOADED" ? [0.6, 0.1, 0.05] : [0.4, 0.2, 0.1, 0.05];
  const currentSum = weights.reduce((a, b) => a + b, 0);
  const distribution = Array.from({ length: termLengthWeeks }, (_, i) => {
    if (weights[i] !== undefined) return Math.min(weights[i], 1.0);
    const rem = Math.max(0, 1 - currentSum);
    const remW = Math.max(0, termLengthWeeks - weights.length);
    return remW > 0 ? rem / remW : 0;
  });

  const finalSum = distribution.reduce((a, b) => a + b, 0);
  if (finalSum > 0 && Math.abs(finalSum - 1) > 0.0001) distribution[0] += 1 - finalSum;

  const monday = getMondayOf(new Date());
  const weeksSinceStart = Math.max(0, Math.floor((monday.getTime() - currentTerm.startDate.getTime()) / (7 * 24 * 60 * 60 * 1000)));
  const weekIndex = Math.min(weeksSinceStart, termLengthWeeks - 1);
  const accumulatedWeight = Math.min(1, distribution.slice(0, weekIndex + 1).reduce((a, b) => a + b, 0));
  const weeklyTarget = termTotalTarget * (distribution[weekIndex] || 0);
  const totalTargetToDate = termTotalTarget * accumulatedWeight;

  const [collections, totalTermCollections, futurePayments] = await Promise.all([
    prisma.payment.aggregate({ where: { termId: currentTerm.id, status: "CONFIRMED", createdAt: { gte: monday }, ...(campus && { student: { campus: campus as any } }) }, _sum: { amount: true } }),
    prisma.payment.aggregate({ where: { termId: currentTerm.id, status: "CONFIRMED", ...(campus && { student: { campus: campus as any } }) }, _sum: { amount: true } }),
    prisma.payment.aggregate({ where: { sessionId: session.id, status: "CONFIRMED", NOT: { termId: currentTerm.id }, ...(campus && { student: { campus: campus as any } }) }, _sum: { amount: true } }),
  ]);

  const weeklyActual = (collections._sum as any).amount || 0;
  const termActual = (totalTermCollections._sum as any).amount || 0;

  return {
    weeklyTarget, weeklyActual, totalTargetToDate, termActual,
    advancePayments: (futurePayments._sum as any).amount || 0,
    complianceRate: weeklyTarget > 0 ? Math.round((weeklyActual / weeklyTarget) * 100) : 0,
    termCompliance: termTotalTarget > 0 ? Math.round((termActual / termTotalTarget) * 100) : 0,
    status: weeklyActual >= weeklyTarget ? "ON_TRACK" : "DELAYED",
  };
};

export const getSubjectAnalytics = async (campus?: string) => {
  const latestTerm = await prisma.term.findFirst({ where: { status: "CURRENT" }, orderBy: { startDate: "desc" } });
  if (!latestTerm) return [];

  const subjects = await prisma.subject.findMany({
    where: { ...(campus && { class: { campus: campus as any } }) },
    include: { class: { select: { name: true } }, grades: { where: { termId: latestTerm.id, status: "PRINCIPAL_APPROVED" }, select: { total: true } } },
  });

  return subjects.map((s) => {
    const avg = s.grades.length > 0 ? s.grades.reduce((sum, g) => sum + g.total, 0) / s.grades.length : 0;
    return { id: s.id, name: s.name, className: s.class.name, average: Math.round(avg * 10) / 10, studentCount: s.grades.length };
  }).sort((a, b) => b.average - a.average);
};

export const getRetentionAnalysis = async (campus?: string) => {
  const latestTerm = await prisma.term.findFirst({ where: { status: "CURRENT" }, orderBy: { startDate: "desc" } });
  if (!latestTerm) return [];

  const classes = await prisma.class.findMany({
    where: { ...(campus && { campus: campus as any }) },
    include: {
      students: {
        where: { role: "STUDENT", status: "ACTIVE" },
        select: {
          id: true,
          attendance: { where: { termId: latestTerm.id } },
          payments: { where: { termId: latestTerm.id, category: "TUITION", status: "CONFIRMED" } },
        },
      },
    },
  });

  return classes.map((c) => {
    const stats = c.students.map((s) => ({ hasGoodAttendance: s.attendance.length > 5, hasPaidFees: s.payments.length > 0 }));
    const att = stats.length > 0 ? (stats.filter((s) => s.hasGoodAttendance).length / stats.length) * 100 : 0;
    const fee = stats.length > 0 ? (stats.filter((s) => s.hasPaidFees).length / stats.length) * 100 : 0;
    return { className: c.name, campus: c.campus, studentCount: c.students.length, attendanceCompliance: Math.round(att), feeCompliance: Math.round(fee), retentionScore: Math.round((att + fee) / 2) };
  }).sort((a, b) => b.retentionScore - a.retentionScore);
};

export const getDetailedAcademicStats = async (campus?: string) => {
  const latestTerm = await prisma.term.findFirst({ where: { status: "CURRENT" }, orderBy: { startDate: "desc" } });
  if (!latestTerm) return { submissionRate: 0, overdueCount: 0 };

  const subjects = await prisma.subject.findMany({
    where: { ...(campus && { class: { campus: campus as any } }) },
    include: { grades: { where: { termId: latestTerm.id } } },
  });

  if (subjects.length === 0) return { submissionRate: 0, overdueCount: 0 };
  const submitted = subjects.filter((s) => s.grades.length > 0 && s.grades.every((g) => g.status !== "DRAFT")).length;
  return { submissionRate: Math.round((submitted / subjects.length) * 100), overdueCount: subjects.length - submitted };
};

export const getAcademicAlerts = async (campus?: string) => {
  const latestTerm = await prisma.term.findFirst({ where: { status: "CURRENT" }, orderBy: { startDate: "desc" } });
  if (!latestTerm) return [];

  const subjects = await prisma.subject.findMany({
    where: { ...(campus && { class: { campus: campus as any } }) },
    include: { class: { select: { campus: true } }, teacher: { select: { name: true } }, grades: { where: { termId: latestTerm.id } } },
  });

  return subjects
    .filter((s) => s.grades.length === 0 || s.grades.some((g) => g.status === "DRAFT" || g.status === "RETURNED"))
    .slice(0, 10)
    .map((s) => ({
      id: s.id,
      subjectName: s.name,
      campus: s.class.campus,
      teacherName: s.teacher?.name || "Unassigned",
      status: s.grades.length === 0 ? "PENDING" : s.grades.some((g) => g.status === "RETURNED") ? "RETURNED" : "DRAFT",
    }));
};
