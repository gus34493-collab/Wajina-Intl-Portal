import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthUser, unauthorized, forbidden, serverError } from "@/lib/api-auth";

export async function GET(_req: NextRequest) {
  const user = await getAuthUser();
  if (!user) return unauthorized();

  const role = user.role;
  if (role !== "HOD" && role !== "DIRECTOR" && role !== "PRINCIPAL" && role !== "VP_ACADEMICS") return forbidden();

  try {
    const currentTerm = await prisma.term.findFirst({ where: { status: "CURRENT" } });
    if (!currentTerm) {
      return NextResponse.json({ pendingCount: 0, eliteCount: 0, deptAverage: 0, achievers: [] });
    }

    const subjects = await prisma.subject.findMany({
      where: { class: { campus: user.campus as any } },
      select: { id: true, name: true }
    });
    const subjectIds = subjects.map(s => s.id);

    const [pendingCount, allGrades, stats] = await Promise.all([
      prisma.grade.count({
        where: { subjectId: { in: subjectIds }, termId: currentTerm.id, status: "SUBMITTED" }
      }),
      prisma.grade.findMany({
        where: { subjectId: { in: subjectIds }, termId: currentTerm.id },
        select: {
          total: true,
          studentId: true,
          student: { select: { name: true } },
          subject: { select: { name: true } }
        }
      }),
      prisma.grade.aggregate({
        where: { subjectId: { in: subjectIds }, termId: currentTerm.id },
        _avg: { total: true }
      })
    ]);

    // Group grades by student and compute per-student averages
    const byStudent = new Map<string, { name: string; subject: string; totals: number[] }>();
    for (const g of allGrades) {
      if (!byStudent.has(g.studentId)) {
        byStudent.set(g.studentId, { name: g.student.name, subject: g.subject.name, totals: [g.total] });
      } else {
        const entry = byStudent.get(g.studentId)!;
        entry.totals.push(g.total);
      }
    }
    const studentAverages = Array.from(byStudent.values()).map(s => ({
      name: s.name,
      subject: s.subject,
      score: Math.round(s.totals.reduce((a, b) => a + b, 0) / s.totals.length),
      avg: s.totals.reduce((a, b) => a + b, 0) / s.totals.length,
    })).sort((a, b) => b.avg - a.avg);

    const formattedAchievers = studentAverages.slice(0, 10).map(({ name, subject, score }) => ({ name, subject, score }));
    const eliteCount = studentAverages.filter(s => s.avg >= 80).length;

    return NextResponse.json({
      pendingCount,
      eliteCount,
      deptAverage: Math.round(stats._avg.total || 0),
      achievers: formattedAchievers
    });
  } catch (err) {
    console.error("[academic/department-stats GET]", err);
    return serverError();
  }
}
