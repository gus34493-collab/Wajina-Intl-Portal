import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthUser, unauthorized, forbidden, serverError } from "@/lib/api-auth";

export async function GET(_req: NextRequest) {
  const user = await getAuthUser();
  if (!user) return unauthorized();

  if (user.role !== "TEACHER" && user.role !== "FORM_TEACHER") return forbidden();

  try {
    const currentTerm = await prisma.term.findFirst({ where: { status: "CURRENT" } });
    if (!currentTerm) {
      return NextResponse.json({ upcomingGrades: 0, classesToday: 0, compliance: 0, recentGrading: [] });
    }

    const subjects = await prisma.subject.findMany({
      where: { teacherId: user.id },
      include: { class: true },
    });

    const subjectIds = subjects.map(s => s.id);

    const [gradesCount, recentGrades] = await Promise.all([
      prisma.grade.count({
        where: {
          subjectId: { in: subjectIds },
          termId: currentTerm.id,
        },
      }),
      prisma.grade.findMany({
        where: {
          subjectId: { in: subjectIds },
          termId: currentTerm.id,
        },
        orderBy: { updatedAt: "desc" },
        distinct: ['subjectId'],
        take: 5,
        select: {
          updatedAt: true,
          subject: { select: { name: true, class: { select: { name: true } } } },
        },
      }),
    ]);

    // Simple compliance logic: how many grades exist vs a rough estimate of students
    const compliance = subjectIds.length > 0 ? Math.min(Math.round((gradesCount / (subjectIds.length * 30)) * 100), 100) : 0;

    const recentGrading = recentGrades.map(g => ({
      subject: g.subject.name,
      className: g.subject.class.name,
      studentsGraded: "Term Batch",
      date: new Date(g.updatedAt).toLocaleDateString("en-GB", { day: "numeric", month: "short" }),
    }));

    return NextResponse.json({
      upcomingGrades: subjects.length,
      classesToday: subjects.length,
      compliance,
      recentGrading,
    });
  } catch (err) {
    console.error("[academic/teacher-stats GET]", err);
    return serverError();
  }
}
