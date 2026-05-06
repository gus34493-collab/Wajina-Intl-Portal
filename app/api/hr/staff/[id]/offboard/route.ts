import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import {
  getAuthUser, hasRole, unauthorized, forbidden, badRequest, notFound, serverError, getIP,
} from "@/lib/api-auth";
import { audit } from "@/lib/audit";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthUser();
  if (!user) return unauthorized();
  if (!hasRole(user, "DIRECTOR", "PRINCIPAL", "HEAD_TEACHER", "VP_ADMIN")) return forbidden("HR permissions required.");

  const { id } = await params;

  try {
    const target = await prisma.user.findUnique({ where: { id } });
    if (!target) return notFound("Staff member not found.");

    if (user.role !== "DIRECTOR" && (target.campus as string) !== user.campus) {
      return forbidden("Staff is in a different campus.");
    }

    if (id === user.id) return badRequest("You cannot offboard yourself.");

    await prisma.$transaction([
      prisma.class.updateMany({ where: { formMasterId: id }, data: { formMasterId: null } }),
      prisma.classArm.updateMany({ where: { teacherId: id }, data: { teacherId: null } }),
      prisma.department.updateMany({ where: { hodId: id }, data: { hodId: null } }),
      prisma.user.update({ where: { id }, data: { status: "DISABLED" } }),
    ]);

    audit(user.id, "STAFF_OFFBOARDED", "User", id, `Staff offboarded: ${target.name}`, getIP(req));
    return NextResponse.json({ message: "Staff successfully offboarded and login revoked. Historical data preserved." });
  } catch (err) {
    console.error("[hr/staff/:id/offboard POST]", err);
    return serverError();
  }
}
