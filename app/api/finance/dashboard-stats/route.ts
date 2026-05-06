import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthUser, unauthorized, forbidden, serverError } from "@/lib/api-auth";

const ALLOWED = ["DIRECTOR", "PRINCIPAL", "HEAD_TEACHER", "ASST_HEAD_TEACHER"];

export async function GET(req: NextRequest) {
  const user = await getAuthUser();
  if (!user) return unauthorized();
  if (!ALLOWED.includes(user.role as string)) return forbidden();

  try {
    const role = user.role as string;
    const campus = role === "DIRECTOR"
      ? new URL(req.url).searchParams.get("campus")
      : (user.campus as string);

    let session = await prisma.academicSession.findFirst({ where: { status: "ACTIVE" } });
    if (!session) session = await prisma.academicSession.findFirst({ orderBy: { year: "desc" } });
    if (!session) {
      return NextResponse.json({ totalStudents: 0, activeStudents: 0, totalCollected: 0, totalExpected: 0, sessionName: "None" });
    }

    const thresholdDate = new Date();
    thresholdDate.setDate(thresholdDate.getDate() - 21);
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const studentFilter: any = { role: "STUDENT" };
    if (campus && campus !== "ALL") studentFilter.campus = campus as any;

    const students = await prisma.user.findMany({
      where: studentFilter,
      select: {
        id: true, createdAt: true, classId: true, campus: true,
        payments: { where: { sessionId: session.id, status: "CONFIRMED", category: "TUITION" }, take: 1 },
        attendance: { where: { date: { gte: thresholdDate }, status: "PRESENT" }, take: 1 },
      },
    });

    const activeCount = students.filter((s) => {
      return s.createdAt >= thirtyDaysAgo || s.payments.length > 0 || s.attendance.length > 0;
    }).length;

    const targetIds = students.map((s) => s.id);
    const collections = await prisma.payment.aggregate({
      where: { sessionId: session.id, status: "CONFIRMED", category: "TUITION", studentId: { in: targetIds } },
      _sum: { amount: true },
    });

    const studentGroups = await prisma.user.groupBy({
      by: ["classId", "campus"],
      where: studentFilter,
      _count: { _all: true },
    });
    const feeConfigs = await prisma.feeConfig.findMany({ where: { sessionId: session.id, category: "TUITION" } });

    let totalExpected = 0;
    for (const group of studentGroups) {
      const config =
        feeConfigs.find((c) => c.classId === group.classId) ||
        feeConfigs.find((c) => c.campus === (group.campus as any) && !c.classId) ||
        feeConfigs.find((c) => !c.campus && !c.classId);
      if (config) totalExpected += Number(config.amount) * group._count._all;
    }

    const totalCollected = Number((collections._sum as any).amount) || 0;
    return NextResponse.json({
      totalStudents: students.length,
      activeStudents: activeCount,
      totalCollected,
      totalExpected,
      collectionRate: totalExpected > 0 ? Math.round((totalCollected / totalExpected) * 100) : 0,
      sessionName: session.name,
    });
  } catch (err) {
    console.error("[finance/dashboard-stats GET]", err);
    return serverError();
  }
}
