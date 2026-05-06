import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthUser, unauthorized, forbidden, badRequest, notFound, serverError, getIP } from "@/lib/api-auth";
import { audit } from "@/lib/audit";

const RETURNERS = ["DIRECTOR", "PRINCIPAL", "VP_ACADEMICS", "HEAD_TEACHER", "ASST_HEAD_TEACHER", "FORM_TEACHER"];

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthUser();
  if (!user) return unauthorized();
  if (!RETURNERS.includes(user.role as string)) return forbidden();
  const { id } = await params;

  try {
    const { reason } = await req.json();
    if (!reason?.trim()) return badRequest("A return reason is required.");

    const grade = await prisma.grade.findUnique({ where: { id: id }, select: { status: true } });
    if (!grade) return notFound("Grade not found.");

    if (!["SUBMITTED", "FORM_APPROVED"].includes(grade.status)) {
      return NextResponse.json({ error: "Only SUBMITTED or FORM_APPROVED grades can be returned." }, { status: 409 });
    }

    const updated = await prisma.grade.update({
      where: { id: id },
      data: { status: "RETURNED", returnReason: reason.trim() },
    });

    audit(user.id, "GRADE_RETURNED", "Grade", id, reason.trim(), getIP(req));
    return NextResponse.json(updated);
  } catch (err) {
    console.error("[grades/[id]/return POST]", err);
    return serverError();
  }
}
