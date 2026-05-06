import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthUser, unauthorized, forbidden, notFound, serverError } from "@/lib/api-auth";

const ALLOWED = ["DIRECTOR", "PRINCIPAL", "HEAD_TEACHER", "ASST_HEAD_TEACHER", "VP_ACADEMICS", "VP_ADMIN", "FORM_TEACHER"];

export async function GET(req: NextRequest, { params }: { params: Promise<{ armId: string }> }) {
  const user = await getAuthUser();
  if (!user) return unauthorized();
  if (!ALLOWED.includes(user.role as string)) return forbidden();

  try {
    const { armId } = await params;
    const { searchParams } = new URL(req.url);
    const termId = searchParams.get("termId") ?? undefined;

    const arm = await prisma.classArm.findUnique({ where: { id: armId }, select: { id: true, fullName: true, teacherId: true } });
    if (!arm) return notFound("Arm not found.");

    if ((user.role as string) === "FORM_TEACHER" && arm.teacherId !== user.id) return forbidden();

    const grades = await prisma.grade.findMany({
      where: {
        student: { armId },
        status: { in: ["SUBMITTED", "FORM_APPROVED", "PRINCIPAL_APPROVED", "ISSUED"] },
        ...(termId && { termId }),
      },
      select: {
        studentId: true, total: true,
        subject: { select: { id: true, name: true } },
        student: { select: { id: true, name: true } },
      },
    });

    // Group by subject → average + per-student totals
    const subjectMap: Record<string, { name: string; totals: number[] }> = {};
    const studentTotals: Record<string, { name: string; scores: number[] }> = {};

    for (const g of grades) {
      const sid = g.subject.id;
      if (!subjectMap[sid]) subjectMap[sid] = { name: g.subject.name, totals: [] };
      subjectMap[sid].totals.push(g.total);

      const stid = g.studentId;
      if (!studentTotals[stid]) studentTotals[stid] = { name: g.student.name, scores: [] };
      studentTotals[stid].scores.push(g.total);
    }

    const subjectSummary = Object.entries(subjectMap).map(([id, s]) => ({
      subjectId: id,
      subjectName: s.name,
      average: Math.round((s.totals.reduce((a, b) => a + b, 0) / s.totals.length) * 100) / 100,
      count: s.totals.length,
    }));

    const studentRanking = Object.entries(studentTotals)
      .map(([id, s]) => ({
        studentId: id,
        studentName: s.name,
        average: Math.round((s.scores.reduce((a, b) => a + b, 0) / s.scores.length) * 100) / 100,
      }))
      .sort((a, b) => b.average - a.average)
      .map((s, i) => ({ ...s, position: i + 1 }));

    return NextResponse.json({ arm, subjectSummary, studentRanking });
  } catch (err) {
    console.error("[grades/summary/arm GET]", err);
    return serverError();
  }
}
