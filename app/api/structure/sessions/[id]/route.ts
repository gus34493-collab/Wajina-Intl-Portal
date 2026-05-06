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
    const { name, year, startDate, endDate, status, isDefault } = await req.json();

    if (isDefault) {
      await prisma.academicSession.updateMany({
        where: { isDefault: true },
        data: { isDefault: false },
      });
    }

    const session = await prisma.academicSession.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(year && { year: String(year) }),
        ...(startDate !== undefined && { startDate: startDate ? new Date(startDate) : null }),
        ...(endDate !== undefined && { endDate: endDate ? new Date(endDate) : null }),
        ...(status && { status }),
        ...(isDefault !== undefined && { isDefault: !!isDefault }),
      },
    });

    audit(user.id, "UPDATE", "AcademicSession", id, name || session.name, getIP(req));
    return NextResponse.json(session);
  } catch (err) {
    console.error("[structure/sessions/:id PATCH]", err);
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
    const existing = await prisma.academicSession.findUnique({ where: { id } });
    if (!existing) return notFound("Session not found");

    await prisma.academicSession.delete({ where: { id } });
    audit(user.id, "DELETE", "AcademicSession", id, existing.name, getIP(req));
    return NextResponse.json({ message: "Session deleted" });
  } catch (err) {
    console.error("[structure/sessions/:id DELETE]", err);
    return serverError();
  }
}
