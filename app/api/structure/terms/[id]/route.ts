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
    const { startDate, endDate, status, isCurrent } = await req.json();

    if (isCurrent) {
      await prisma.term.updateMany({ where: { isCurrent: true }, data: { isCurrent: false } });
    }

    const term = await prisma.term.update({
      where: { id },
      data: {
        ...(startDate !== undefined && { startDate: startDate ? new Date(startDate) : null }),
        ...(endDate !== undefined && { endDate: endDate ? new Date(endDate) : null }),
        ...(status && { status }),
        ...(isCurrent !== undefined && { isCurrent: !!isCurrent }),
      },
    });

    audit(user.id, "UPDATE", "Term", id, term.name, getIP(req));
    return NextResponse.json(term);
  } catch (err) {
    console.error("[structure/terms/:id PATCH]", err);
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
    const existing = await prisma.term.findUnique({ where: { id } });
    if (!existing) return notFound("Term not found");

    await prisma.term.delete({ where: { id } });
    audit(user.id, "DELETE", "Term", id, existing.name, getIP(req));
    return NextResponse.json({ message: "Term deleted" });
  } catch (err) {
    console.error("[structure/terms/:id DELETE]", err);
    return serverError();
  }
}
