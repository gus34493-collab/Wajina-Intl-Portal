import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthUser, unauthorized, forbidden, badRequest, notFound, serverError, getIP } from "@/lib/api-auth";
import { audit } from "@/lib/audit";

const ADMIN_ROLES = ["DIRECTOR", "PRINCIPAL", "HEAD_TEACHER", "VP_ADMIN", "HR"];

const USER_SELECT = {
  id: true, email: true, name: true, role: true, status: true, phone: true,
  profilePhoto: true, campus: true,
  enrolledArm: { select: { id: true, fullName: true, class: { select: { name: true, campus: true } } } },
  managedArms: { select: { id: true, fullName: true } },
} as const;

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthUser();
  if (!user) return unauthorized();
  if (!ADMIN_ROLES.includes(user.role as string)) return forbidden();
  const { id } = await params;

  try {
    const { armId, asTeacher } = await req.json();
    if (!armId) return badRequest("armId is required.");

    const target = await prisma.user.findUnique({ where: { id: id }, select: { role: true, name: true } });
    if (!target) return notFound("User not found.");

    let updated;
    if (asTeacher || target.role === "TEACHER" || target.role === "FORM_TEACHER") {
      updated = await prisma.user.update({
        where: { id: id },
        data: { managedArms: { connect: { id: armId } } },
        select: USER_SELECT as any,
      });
    } else {
      updated = await prisma.user.update({
        where: { id: id },
        data: { armId },
        select: USER_SELECT as any,
      });
    }

    audit(user.id, "ASSIGN_ARM", "User", id, `${target.name} → arm ${armId}`, getIP(req));
    return NextResponse.json(updated);
  } catch (err) {
    console.error("[users/[id]/assign-arm POST]", err);
    return serverError();
  }
}
