import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthUser, unauthorized, forbidden, serverError } from "@/lib/api-auth";
import { canViewResults } from "@/lib/academic-engine";

export async function GET() {
  const user = await getAuthUser();
  if (!user) return unauthorized();
  if (user.role !== "STUDENT") return forbidden();

  try {
    const term = await prisma.term.findFirst({
      where: { isCurrent: true },
      select: { id: true, name: true },
    });

    let resultsVisible = false;
    let grades: Array<{ subject: string; total: number; grade: string | null }> = [];
    let avgScore: number | null = null;

    if (term) {
      resultsVisible = await canViewResults(user.id, term.id);

      if (resultsVisible) {
        const raw = await prisma.grade.findMany({
          where: { studentId: user.id, termId: term.id, status: "PRINCIPAL_APPROVED" },
          select: {
            total: true,
            grade: true,
            subject: { select: { name: true } },
          },
          orderBy: { subject: { name: "asc" } },
        });

        grades = raw.map((g) => ({
          subject: g.subject.name,
          total: Number(g.total ?? 0),
          grade: g.grade,
        }));

        if (grades.length > 0) {
          const totals = grades.map((g) => g.total).filter((t) => t > 0);
          avgScore = totals.length > 0
            ? Math.round(totals.reduce((a, b) => a + b, 0) / totals.length)
            : null;
        }
      }
    }

    // Attendance: count for current term
    let attendance = { present: 0, total: 0, rate: 0 };
    if (term) {
      const [present, total] = await Promise.all([
        (prisma.attendance as any).count({
          where: { studentId: user.id, termId: term.id, status: "PRESENT" },
        }),
        (prisma.attendance as any).count({
          where: { studentId: user.id, termId: term.id },
        }),
      ]);
      attendance = {
        present,
        total,
        rate: total > 0 ? Math.round((present / total) * 100) : 0,
      };
    }

    return NextResponse.json({
      termName: term?.name ?? null,
      resultsVisible,
      gradeCount: grades.length,
      avgScore,
      grades,
      attendance,
    });
  } catch (err) {
    console.error("[student/dashboard GET]", err);
    return serverError();
  }
}
