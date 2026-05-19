import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthUser, unauthorized, forbidden, serverError } from "@/lib/api-auth";

export async function GET(req: NextRequest) {
  const user = await getAuthUser();
  if (!user) return unauthorized();
  if (user.role !== "DIRECTOR") return forbidden();

  try {
    const campus = new URL(req.url).searchParams.get("campus");
    const campusFilter = campus && campus !== "ALL" ? { campus: campus as any } : {};

    let session = await prisma.academicSession.findFirst({ where: { status: "ACTIVE" } });
    if (!session) session = await prisma.academicSession.findFirst({ orderBy: { year: "desc" } });

    const studentFilter = { role: "STUDENT" as any, ...campusFilter };
    const staffFilter = { role: { notIn: ["STUDENT", "PARENT"] as any[] }, ...campusFilter };

    // Parallel KPI fetches
    const [
      studentCount,
      staffCount,
      pendingAdmissions,
      confirmedPayments,
    ] = await Promise.all([
      prisma.user.count({ where: studentFilter }),
      prisma.user.count({ where: staffFilter }),
      prisma.admission.count({ where: { status: { in: ["APPLIED", "QUALIFIED", "OFFERED"] } } }),
      session
        ? prisma.payment.aggregate({
            where: { status: "CONFIRMED", category: "TUITION", sessionId: session.id, student: campusFilter },
            _sum: { amount: true },
          })
        : null,
    ]);

    // Expected revenue for collection rate
    let totalExpected = 0;
    if (session) {
      const [studentGroups, feeConfigs] = await Promise.all([
        prisma.user.groupBy({ by: ["classId", "campus"], where: studentFilter, _count: { _all: true } }),
        prisma.feeConfig.findMany({ where: { sessionId: session.id, category: "TUITION" } }),
      ]);
      for (const g of studentGroups) {
        const config =
          feeConfigs.find((c) => c.classId === g.classId) ||
          feeConfigs.find((c) => c.campus === (g.campus as any) && !c.classId) ||
          feeConfigs.find((c) => !c.campus && !c.classId);
        if (config) totalExpected += Number(config.amount) * g._count._all;
      }
    }

    const totalCollected = Number((confirmedPayments?._sum as any)?.amount) || 0;
    const collectionRate = totalExpected > 0 ? Math.round((totalCollected / totalExpected) * 100) : 0;

    // 6-week revenue trend (weekly buckets)
    const sixWeeksAgo = new Date();
    sixWeeksAgo.setDate(sixWeeksAgo.getDate() - 42);

    const recentPayments = session
      ? await prisma.payment.findMany({
          where: {
            status: "CONFIRMED", category: "TUITION", sessionId: session.id,
            createdAt: { gte: sixWeeksAgo },
            ...(campus && campus !== "ALL" && { student: { campus: campus as any } }),
          },
          select: { amount: true, createdAt: true },
        })
      : [];

    const weeks = [0, 0, 0, 0, 0, 0];
    const now = new Date();
    for (const p of recentPayments) {
      const diff = Math.floor((now.getTime() - new Date(p.createdAt).getTime()) / 86400000);
      const wi = Math.floor(diff / 7);
      if (wi >= 0 && wi < 6) weeks[5 - wi] += Number(p.amount) / 1e6;
    }

    // Recent activity: last 8 audit log entries visible to director
    const recentActivity = await prisma.auditLog.findMany({
      where: {
        action: { in: ["CREATE_PAYMENT", "ATTENDANCE_BULK_MARK", "TIMETABLE_UPDATE", "ENROLL_STUDENT", "ADMISSION_OFFER_SENT", "GRADE_SUBMITTED"] },
        ...(campus && campus !== "ALL" && { actor: { campus: campus as any } }),
      },
      include: { actor: { select: { name: true, role: true, campus: true } } },
      orderBy: { createdAt: "desc" },
      take: 6,
    });

    // Recent admissions (fallback for activity if audit log is sparse)
    const recentAdmissions = await prisma.admission.findMany({
      where: campus && campus !== "ALL" ? { campus: campus as any } : {},
      select: { applicantName: true, status: true, createdAt: true, campus: true },
      orderBy: { createdAt: "desc" },
      take: 4,
    });

    return NextResponse.json({
      studentCount,
      staffCount,
      pendingAdmissions,
      totalCollected,
      collectionRate,
      totalExpected,
      sessionName: session?.name ?? null,
      weeklyRevenue: { labels: ["Wk 1", "Wk 2", "Wk 3", "Wk 4", "Wk 5", "Wk 6"], data: weeks },
      recentActivity: recentActivity.map((a) => ({
        id: a.id,
        action: a.action,
        detail: a.detail,
        actor: a.actor?.name ?? "System",
        createdAt: a.createdAt,
      })),
      recentAdmissions,
    });
  } catch (err) {
    console.error("[director/overview GET]", err);
    return serverError();
  }
}
