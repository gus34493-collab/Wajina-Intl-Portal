import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthUser, unauthorized, forbidden, badRequest, serverError } from "@/lib/api-auth";

export async function POST(req: NextRequest) {
  const user = await getAuthUser();
  if (!user) return unauthorized();

  const role = user.role as string;
  if (!["TEACHER", "FORM_TEACHER", "DIRECTOR", "PRINCIPAL", "HEAD_TEACHER", "ASST_HEAD_TEACHER", "VP_ACADEMICS", "VP_ADMIN"].includes(role)) {
    return forbidden();
  }

  try {
    const { subjectId, termId } = await req.json();
    if (!subjectId || !termId) return badRequest("subjectId and termId are required.");

    // TEACHER/FORM_TEACHER must own the subject
    if (role === "TEACHER" || role === "FORM_TEACHER") {
      const subject = await prisma.subject.findUnique({ where: { id: subjectId }, select: { teacherId: true } });
      if (!subject || subject.teacherId !== user.id) return forbidden();
    }

    const result = await prisma.grade.updateMany({
      where: { subjectId, termId, status: "DRAFT" },
      data: { status: "SUBMITTED" },
    });

    return NextResponse.json({ submitted: result.count });
  } catch (err) {
    console.error("[grades/submit-batch POST]", err);
    return serverError();
  }
}
