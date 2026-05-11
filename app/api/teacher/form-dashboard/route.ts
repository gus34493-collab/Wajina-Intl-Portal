import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthUser, unauthorized, forbidden, serverError } from "@/lib/api-auth";

const ALLOWED = ["FORM_TEACHER", "DIRECTOR", "PRINCIPAL"];

export async function GET(_req: NextRequest) {
  const user = await getAuthUser();
  if (!user) return unauthorized();
  if (!ALLOWED.includes(user.role as string)) return forbidden();

  try {
    const arm = await prisma.classArm.findFirst({
      where: { teacherId: user.id },
      include: {
        class: { select: { name: true, campus: true } },
        _count: { select: { students: { where: { status: "ACTIVE" } } } },
      },
    });

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Per-session attendance for today
    const morningAttendance = { present: 0, absent: 0, late: 0, total: 0, rate: null as number | null, isMarked: false };
    const closingAttendance = { present: 0, absent: 0, late: 0, total: 0, rate: null as number | null, isMarked: false };

    if (arm) {
      const [mPresent, mAbsent, mLate, mTotal, cPresent, cAbsent, cLate, cTotal] = await Promise.all([
        (prisma.attendance as any).count({ where: { armId: arm.id, date: today, session: "MORNING", status: "PRESENT" } }),
        (prisma.attendance as any).count({ where: { armId: arm.id, date: today, session: "MORNING", status: "ABSENT" } }),
        (prisma.attendance as any).count({ where: { armId: arm.id, date: today, session: "MORNING", status: "LATE" } }),
        (prisma.attendance as any).count({ where: { armId: arm.id, date: today, session: "MORNING" } }),
        (prisma.attendance as any).count({ where: { armId: arm.id, date: today, session: "CLOSING", status: "PRESENT" } }),
        (prisma.attendance as any).count({ where: { armId: arm.id, date: today, session: "CLOSING", status: "ABSENT" } }),
        (prisma.attendance as any).count({ where: { armId: arm.id, date: today, session: "CLOSING", status: "LATE" } }),
        (prisma.attendance as any).count({ where: { armId: arm.id, date: today, session: "CLOSING" } }),
      ]);

      Object.assign(morningAttendance, {
        present: mPresent, absent: mAbsent, late: mLate, total: mTotal,
        rate: mTotal > 0 ? Math.round((mPresent / mTotal) * 100) : null,
        isMarked: mTotal > 0,
      });
      Object.assign(closingAttendance, {
        present: cPresent, absent: cAbsent, late: cLate, total: cTotal,
        rate: cTotal > 0 ? Math.round((cPresent / cTotal) * 100) : null,
        isMarked: cTotal > 0,
      });
    }

    const subjects = await prisma.subject.findMany({
      where: { teacherId: user.id },
      select: { id: true, name: true, class: { select: { name: true } } },
      orderBy: { name: "asc" },
    });

    const term = await prisma.term.findFirst({
      where: { isCurrent: true },
      select: { id: true, name: true },
    });

    let gradeCompliance = 0;
    let pendingSubjectsCount = 0;
    let subjectStatus: Array<{ subjectId: string; name: string; className: string; hasGrades: boolean; gradeCount: number }> = [];

    if (subjects.length > 0 && term) {
      const subjectIds = subjects.map((s) => s.id);
      const gradeCounts = await prisma.grade.groupBy({
        by: ["subjectId"],
        where: { subjectId: { in: subjectIds }, termId: term.id },
        _count: { _all: true },
      });
      const gradeMap: Record<string, number> = {};
      for (const g of gradeCounts) gradeMap[g.subjectId] = g._count._all;

      subjectStatus = subjects.map((s) => ({
        subjectId: s.id,
        name: s.name,
        className: s.class.name,
        hasGrades: (gradeMap[s.id] || 0) > 0,
        gradeCount: gradeMap[s.id] || 0,
      }));

      const withGrades = subjectStatus.filter((s) => s.hasGrades).length;
      gradeCompliance = subjects.length > 0 ? Math.round((withGrades / subjects.length) * 100) : 0;
      pendingSubjectsCount = subjects.length - withGrades;
    }

    const formApprovalPending = arm
      ? await prisma.grade.count({ where: { student: { armId: arm.id }, status: "SUBMITTED" } })
      : 0;

    // 7-day attendance trend (morning session only for the trend)
    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    let weeklyTrend: Array<{ date: string; rate: number }> = [];
    if (arm) {
      const weekRows = await (prisma.attendance as any).groupBy({
        by: ["date", "status"],
        where: { armId: arm.id, session: "MORNING", date: { gte: sevenDaysAgo, lte: today } },
        _count: { _all: true },
        orderBy: { date: "asc" },
      });

      const dayMap: Record<string, { present: number; total: number }> = {};
      for (const row of weekRows) {
        const d = (row.date as Date).toISOString().split("T")[0];
        if (!dayMap[d]) dayMap[d] = { present: 0, total: 0 };
        dayMap[d].total += row._count._all;
        if (row.status === "PRESENT") dayMap[d].present += row._count._all;
      }

      weeklyTrend = Object.entries(dayMap).map(([date, v]) => ({
        date,
        rate: v.total > 0 ? Math.round((v.present / v.total) * 100) : 0,
      }));
    }

    // Recent lesson plan submissions
    const recentLessonPlans = await prisma.request.findMany({
      where: { senderId: user.id, category: "LESSON_PLAN" },
      select: { id: true, title: true, status: true, createdAt: true },
      orderBy: { createdAt: "desc" },
      take: 3,
    });

    return NextResponse.json({
      arm: arm
        ? { id: arm.id, fullName: arm.fullName, className: arm.class.name, studentCount: arm._count.students }
        : null,
      morningAttendance,
      closingAttendance,
      subjects: subjectStatus,
      gradeCompliance,
      pendingSubjectsCount,
      formApprovalPending,
      weeklyTrend,
      termName: term?.name ?? null,
      recentLessonPlans,
    });
  } catch (err) {
    console.error("[teacher/form-dashboard GET]", err);
    return serverError();
  }
}
