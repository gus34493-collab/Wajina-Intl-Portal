import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthUser, unauthorized, forbidden, notFound, serverError, getIP } from "@/lib/api-auth";
import { audit } from "@/lib/audit";

const FORM_APPROVERS = ["FORM_TEACHER", "HEAD_TEACHER", "ASST_HEAD_TEACHER"];
const PRINCIPAL_APPROVERS = ["DIRECTOR", "PRINCIPAL", "VP_ACADEMICS"];

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthUser();
  if (!user) return unauthorized();

  const role = user.role as string;
  const canFormApprove = FORM_APPROVERS.includes(role);
  const canPrincipalApprove = PRINCIPAL_APPROVERS.includes(role);

  if (!canFormApprove && !canPrincipalApprove) return forbidden();
  const { id } = await params;

  try {
    const grade = await prisma.grade.findUnique({
      where: { id: id },
      include: { subject: { include: { class: true } } },
    });
    if (!grade) return notFound("Grade not found.");

    let nextStatus: string;

    if (grade.status === "SUBMITTED" && canFormApprove) {
      if (role === "FORM_TEACHER") {
        const arms = await prisma.classArm.findMany({ where: { teacherId: user.id }, select: { id: true } });
        const student = await prisma.user.findUnique({ where: { id: grade.studentId }, select: { armId: true } });
        if (!arms.length || !student || !arms.some((a) => a.id === student.armId)) return forbidden();
      }
      nextStatus = "FORM_APPROVED";
    } else if (grade.status === "FORM_APPROVED" && canPrincipalApprove) {
      nextStatus = "PRINCIPAL_APPROVED";
    } else {
      return NextResponse.json({ error: "Grade is not in an approvable state for your role." }, { status: 409 });
    }

    const updated = await prisma.grade.update({
      where: { id: id },
      data: { status: nextStatus as any },
    });

    audit(user.id, "GRADE_APPROVED", "Grade", id, `${grade.status} → ${nextStatus}`, getIP(req));
    return NextResponse.json(updated);
  } catch (err) {
    console.error("[grades/[id]/approve POST]", err);
    return serverError();
  }
}
