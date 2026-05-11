import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthUser, unauthorized, forbidden, badRequest, notFound, serverError } from "@/lib/api-auth";
import { getAssessmentConfig, calculateScore, generateReports } from "@/lib/academic-engine";

const ALLOWED_ROLES = ["DIRECTOR", "PRINCIPAL", "HEAD_TEACHER", "ASST_HEAD_TEACHER", "VP_ACADEMICS", "VP_ADMIN", "TEACHER", "FORM_TEACHER"];

export async function POST(req: NextRequest) {
  const user = await getAuthUser();
  if (!user) return unauthorized();
  if (!ALLOWED_ROLES.includes(user.role as string)) return forbidden();

  try {
    const { subjectId, termId, sessionId, grades } = await req.json();
    if (!subjectId || !termId || !Array.isArray(grades) || grades.length === 0) {
      return badRequest("subjectId, termId, and a non-empty grades array are required.");
    }

    const subject = await prisma.subject.findUnique({
      where: { id: subjectId },
      include: { class: true },
    });
    if (!subject) return notFound("Subject not found.");

    const role = user.role as string;
    if (role === "TEACHER" || role === "FORM_TEACHER") {
      if (subject.teacherId !== user.id) return forbidden();
      const studentIds = [...new Set(grades.map((r: any) => r.studentId))];
      const enrolled = await prisma.user.findMany({
        where: { id: { in: studentIds as string[] }, classId: subject.classId },
        select: { id: true },
      });
      if (enrolled.length !== studentIds.length) {
        return forbidden("One or more students are not enrolled in this subject's class.");
      }
    }

    const config = getAssessmentConfig(subject.class.campus as string, subject.class.category ?? "", subject.class.name);

    const ops = grades.map((g: any) => {
      const { studentId, firstCA = 0, secondCA = 0, thirdCA = 0, fourthCA = 0, fifthCA = 0, exam = 0 } = g;
      if (!studentId) throw new Error("Each grade entry must include a studentId.");

      const result = calculateScore({ firstCA, secondCA, thirdCA, fourthCA, fifthCA, exam }, config);
      const remarks = generateReports(result.total);

      const data = {
        studentId,
        subjectId,
        termId,
        sessionId: sessionId ?? null,
        campus: subject.class.campus,
        firstCA: parseFloat(firstCA) || 0,
        secondCA: parseFloat(secondCA) || 0,
        thirdCA: parseFloat(thirdCA) || 0,
        fourthCA: parseFloat(fourthCA) || 0,
        fifthCA: parseFloat(fifthCA) || 0,
        exam: parseFloat(exam) || 0,
        total: result.total,
        grade: result.grade,
        teacherComment: remarks.teacher,
        principalRemark: remarks.principal,
        status: "DRAFT",
      };

      return prisma.grade.upsert({
        where: { studentId_subjectId_termId: { studentId, subjectId, termId } },
        update: data as any,
        create: data as any,
      });
    });

    const results = await prisma.$transaction(ops);
    return NextResponse.json({ success: true, count: results.length });
  } catch (err: any) {
    if (err?.message?.includes("studentId")) return badRequest(err.message);
    console.error("[grades/bulk POST]", err);
    return serverError();
  }
}
