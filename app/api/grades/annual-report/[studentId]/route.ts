import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthUser, unauthorized, forbidden, notFound, serverError } from "@/lib/api-auth";
import { canViewResults, calculateAnnualMean } from "@/lib/academic-engine";

export async function GET(req: NextRequest, { params }: { params: Promise<{ studentId: string }> }) {
  const user = await getAuthUser();
  if (!user) return unauthorized();

  const role = user.role as string;
  const { studentId } = await params;
  const { searchParams } = new URL(req.url);
  const sessionId = searchParams.get("sessionId") ?? undefined;

  if (role === "STUDENT" && user.id !== studentId) return forbidden();
  if (role === "PARENT") {
    const link = await prisma.studentParent.findFirst({ where: { studentId, parentId: user.id } });
    if (!link) return forbidden();
  }

  const MANAGEMENT = ["DIRECTOR", "PRINCIPAL", "HEAD_TEACHER", "ASST_HEAD_TEACHER", "VP_ACADEMICS", "VP_ADMIN", "FORM_TEACHER"];
  if (!MANAGEMENT.includes(role) && role !== "STUDENT" && role !== "PARENT") return forbidden();

  try {
    const student = await prisma.user.findUnique({ where: { id: studentId }, select: { id: true, name: true } });
    if (!student) return notFound("Student not found.");

    if (role === "STUDENT") {
      const canView = await canViewResults(studentId);
      if (!canView) return NextResponse.json({ error: "Results locked until fees are cleared." }, { status: 403 });
    }

    const grades = await prisma.grade.findMany({
      where: {
        studentId,
        status: "PRINCIPAL_APPROVED",
        ...(sessionId && { sessionId }),
      },
      select: {
        total: true,
        subject: { select: { id: true, name: true } },
        term: { select: { id: true, name: true } },
        session: { select: { id: true, name: true, year: true } },
      },
      orderBy: [{ term: { startDate: "asc" } }, { subject: { name: "asc" } }],
    });

    // Group by subject → terms → totals
    const subjectMap: Record<string, { name: string; terms: Record<string, number> }> = {};
    for (const g of grades) {
      const sid = g.subject.id;
      if (!subjectMap[sid]) subjectMap[sid] = { name: g.subject.name, terms: {} };
      subjectMap[sid].terms[g.term.name] = g.total;
    }

    const report = Object.entries(subjectMap).map(([id, s]) => {
      const termScores = Object.values(s.terms);
      return {
        subjectId: id,
        subjectName: s.name,
        terms: s.terms,
        annualMean: calculateAnnualMean(termScores),
      };
    });

    return NextResponse.json({ student, report });
  } catch (err) {
    console.error("[grades/annual-report GET]", err);
    return serverError();
  }
}
