import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthUser, unauthorized, forbidden, badRequest, notFound, serverError } from "@/lib/api-auth";
import { getAssessmentConfig, calculateScore, generateReports } from "@/lib/academic-engine";

const ALLOWED_ROLES = ["DIRECTOR", "PRINCIPAL", "HEAD_TEACHER", "ASST_HEAD_TEACHER", "VP_ACADEMICS", "VP_ADMIN", "TEACHER", "FORM_TEACHER"];

export async function PUT(req: NextRequest) {
  const user = await getAuthUser();
  if (!user) return unauthorized();
  if (!ALLOWED_ROLES.includes(user.role as string)) return forbidden();

  try {
    const body = await req.json();
    const { studentId, subjectId, termId, sessionId, firstCA = 0, secondCA = 0, thirdCA = 0, fourthCA = 0, fifthCA = 0, exam = 0 } = body;
    if (!studentId || !subjectId || !termId) return badRequest("studentId, subjectId, and termId are required.");

    const subject = await prisma.subject.findUnique({
      where: { id: subjectId },
      include: { class: true },
    });
    if (!subject) return notFound("Subject not found.");

    const role = user.role as string;
    if (role === "TEACHER" || role === "FORM_TEACHER") {
      if (subject.teacherId !== user.id) return forbidden();
      const enrollment = await prisma.user.findFirst({
        where: { id: studentId, classId: subject.classId },
      });
      if (!enrollment) return forbidden("Student is not enrolled in this subject's class.");
    }

    const config = getAssessmentConfig(subject.class.campus as string, subject.class.category ?? "", subject.class.name);
    const result = calculateScore({ firstCA, secondCA, thirdCA, fourthCA, fifthCA, exam }, config);
    const remarks = generateReports(result.total);

    const data = {
      studentId, subjectId, termId, sessionId: sessionId ?? null,
      campus: subject.class.campus,
      firstCA: parseFloat(firstCA) || 0,
      secondCA: parseFloat(secondCA) || 0,
      thirdCA: parseFloat(thirdCA) || 0,
      fourthCA: parseFloat(fourthCA) || 0,
      fifthCA: parseFloat(fifthCA) || 0,
      exam: parseFloat(exam) || 0,
      total: result.total,
      grade: result.grade,
      teacherComment: body.teacherComment ?? remarks.teacher,
      principalRemark: body.principalRemark ?? remarks.principal,
      status: "DRAFT",
    };

    const grade = await prisma.grade.upsert({
      where: { studentId_subjectId_termId: { studentId, subjectId, termId } },
      update: data as any,
      create: data as any,
    });

    return NextResponse.json(grade);
  } catch (err) {
    console.error("[grades/upsert PUT]", err);
    return serverError();
  }
}
