import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import {
  getAuthUser,
  hasRole,
  unauthorized,
  forbidden,
  notFound,
  serverError,
  getIP,
} from "@/lib/api-auth";
import { audit } from "@/lib/audit";

const ADMIN = ["DIRECTOR", "PRINCIPAL", "HEAD_TEACHER", "VP_ADMIN"] as const;

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthUser();
  if (!user) return unauthorized();
  if (!hasRole(user, ...ADMIN)) return forbidden();

  const { id } = await params;

  try {
    const { teacherId, capacity } = await req.json();

    const arm = await prisma.classArm.update({
      where: { id },
      data: {
        ...(teacherId !== undefined && { teacherId: teacherId || null }),
        ...(capacity !== undefined && { capacity: capacity ? parseInt(capacity) : null }),
      },
    });

    audit(user.id, "UPDATE", "ClassArm", id, arm.fullName, getIP(req));
    return NextResponse.json(arm);
  } catch (err) {
    console.error("[structure/arms/:id PATCH]", err);
    return serverError();
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthUser();
  if (!user) return unauthorized();
  if (!hasRole(user, ...ADMIN)) return forbidden();

  const { id } = await params;

  try {
    const existing = await prisma.classArm.findUnique({ where: { id } });
    if (!existing) return notFound("Class arm not found");

    await prisma.classArm.delete({ where: { id } });
    audit(user.id, "DELETE", "ClassArm", id, existing.fullName, getIP(req));
    return NextResponse.json({ message: "Class arm deleted" });
  } catch (err) {
    console.error("[structure/arms/:id DELETE]", err);
    return serverError();
  }
}
