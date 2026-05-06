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
    const { name, campus, category, displayOrder, active } = await req.json();

    const cls = await prisma.class.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(campus && { campus }),
        ...(category !== undefined && { category }),
        ...(displayOrder !== undefined && { displayOrder: parseInt(displayOrder) }),
        ...(active !== undefined && { active: !!active }),
      },
    });

    audit(user.id, "UPDATE", "Class", id, cls.name, getIP(req));
    return NextResponse.json(cls);
  } catch (err) {
    console.error("[structure/classes/:id PATCH]", err);
    return serverError();
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthUser();
  if (!user) return unauthorized();
  if (!hasRole(user, "DIRECTOR")) return forbidden();

  const { id } = await params;

  try {
    const existing = await prisma.class.findUnique({ where: { id } });
    if (!existing) return notFound("Class not found");

    await prisma.class.delete({ where: { id } });
    audit(user.id, "DELETE", "Class", id, existing.name, getIP(req));
    return NextResponse.json({ message: "Class deleted" });
  } catch (err) {
    console.error("[structure/classes/:id DELETE]", err);
    return serverError();
  }
}
