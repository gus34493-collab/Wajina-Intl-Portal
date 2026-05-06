import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthUser, unauthorized, forbidden, badRequest, notFound, serverError } from "@/lib/api-auth";

const ALLOWED = ["DIRECTOR", "PRINCIPAL", "HEAD_TEACHER", "HR"];

export async function PATCH(req: NextRequest) {
  const user = await getAuthUser();
  if (!user) return unauthorized();
  if (!ALLOWED.includes(user.role as string)) return forbidden();

  try {
    const { userId, status, role } = await req.json();
    if (!userId) return badRequest("Target userId is required.");

    const target = await prisma.user.findUnique({ where: { id: userId }, select: { campus: true, role: true, name: true } });
    if (!target) return notFound("Target user not found.");

    const actorRole = user.role as string;
    if (actorRole !== "DIRECTOR" && target.campus !== (user.campus as any)) return forbidden();

    const updated = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(status && { status: status as any }),
        ...(role && { role: role as any }),
      },
      select: { id: true, name: true, role: true, status: true },
    });

    return NextResponse.json({ success: true, message: `${updated.name} updated successfully.`, user: updated });
  } catch (err) {
    console.error("[hr/admin-actions PATCH]", err);
    return serverError();
  }
}
