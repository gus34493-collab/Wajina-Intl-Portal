import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import {
  getAuthUser, unauthorized, badRequest, serverError, getIP,
} from "@/lib/api-auth";
import { audit } from "@/lib/audit";

export async function POST(req: NextRequest) {
  const user = await getAuthUser();
  if (!user) return unauthorized();

  try {
    const { teacherId, punctuality, lessonPlanning, studentEngagement, professionalism, comments } = await req.json();
    if (!teacherId) return badRequest("Teacher ID is required.");

    const appraisal = await prisma.teacherAppraisal.create({
      data: {
        teacherId,
        evaluatorId: user.id,
        punctuality: parseInt(punctuality) || 0,
        lessonPlanning: parseInt(lessonPlanning) || 0,
        studentEngagement: parseInt(studentEngagement) || 0,
        professionalism: parseInt(professionalism) || 0,
        comments: (comments || "").trim(),
        status: "SUBMITTED",
      },
      include: { teacher: { select: { name: true } } },
    });

    audit(user.id, "STAFF_APPRAISAL_SUBMITTED", "User", teacherId, `Appraisal for ${appraisal.teacher.name} submitted.`, getIP(req));
    return NextResponse.json({ appraisal }, { status: 201 });
  } catch (err) {
    console.error("[hr/appraisals POST]", err);
    return serverError();
  }
}
