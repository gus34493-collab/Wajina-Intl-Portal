import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthUser, unauthorized, forbidden, badRequest, notFound, serverError, getIP } from "@/lib/api-auth";
import { audit } from "@/lib/audit";

const ADMIN_ROLES = ["DIRECTOR", "PRINCIPAL", "HEAD_TEACHER", "VP_ADMIN", "HR"];
const DIRECTOR_ONLY_TARGETS = ["DIRECTOR", "PRINCIPAL", "HEAD_TEACHER"];

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthUser();
  if (!user) return unauthorized();
  if (!ADMIN_ROLES.includes(user.role as string)) return forbidden();
  const { id } = await params;
  if (user.id === id) return badRequest("You cannot disable your own account.");

  try {
    const target = await prisma.user.findUnique({ where: { id: id }, select: { role: true, name: true } });
    if (!target) return notFound("User not found.");

    const actorRole = user.role as string;
    if (!["DIRECTOR"].includes(actorRole) && DIRECTOR_ONLY_TARGETS.includes(target.role)) {
      return forbidden();
    }

    await prisma.$transaction([
      prisma.class.updateMany({ where: { formMasterId: id }, data: { formMasterId: null } }),
      prisma.classArm.updateMany({ where: { teacherId: id }, data: { teacherId: null } }),
      prisma.department.updateMany({ where: { hodId: id }, data: { hodId: null } }),
      prisma.subject.updateMany({ where: { teacherId: id }, data: { teacherId: null } }),
      prisma.user.update({ where: { id: id }, data: { status: "DISABLED" } })
    ]);
    audit(user.id, "DISABLE_USER", "User", id, target.name, getIP(req));
    return NextResponse.json({ message: "User account disabled." });
  } catch (err) {
    console.error("[users/[id]/disable POST]", err);
    return serverError();
  }
}
