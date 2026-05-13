import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthUser, hasRole, unauthorized, forbidden, serverError } from "@/lib/api-auth";

const CORE_ADMIN = ["DIRECTOR", "PRINCIPAL", "HEAD_TEACHER"] as const;

export async function PATCH(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthUser();
  if (!user) return unauthorized();
  if (!hasRole(user, ...CORE_ADMIN)) return forbidden();

  const { id } = await params;

  try {
    // Atomically move all sessions to UPCOMING, then promote this one to ACTIVE
    await prisma.$transaction([
      prisma.academicSession.updateMany({ where: {}, data: { status: "UPCOMING" } }),
      prisma.academicSession.update({ where: { id }, data: { status: "ACTIVE" } }),
    ]);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[sessions/:id/activate PATCH]", err);
    return serverError();
  }
}
