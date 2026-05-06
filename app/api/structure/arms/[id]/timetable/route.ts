import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import {
  getAuthUser,
  unauthorized,
  forbidden,
  notFound,
  serverError,
  getIP,
} from "@/lib/api-auth";
import { audit } from "@/lib/audit";

const ADMIN_ROLES = ["DIRECTOR", "PRINCIPAL", "HEAD_TEACHER", "VP_ADMIN"];

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthUser();
  if (!user) return unauthorized();

  const { id } = await params;

  try {
    const arm = await prisma.classArm.findUnique({ where: { id } });
    if (!arm) return notFound("Class arm not found");

    const isOwner = arm.teacherId === user.id;
    const isAdmin = ADMIN_ROLES.includes(user.role);

    if (!isOwner && !isAdmin) {
      return forbidden("Only the assigned Form Teacher or Management can update this timetable.");
    }

    const { timetableUrl } = await req.json();

    const updated = await prisma.classArm.update({
      where: { id },
      data: { timetableUrl },
    });

    audit(user.id, "TIMETABLE_UPDATE", "ClassArm", id, `Timetable updated for ${arm.fullName}`, getIP(req));
    return NextResponse.json({ message: "Timetable updated successfully", timetableUrl: updated.timetableUrl });
  } catch (err) {
    console.error("[structure/arms/:id/timetable PATCH]", err);
    return serverError();
  }
}
