import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import prisma from "@/lib/prisma";
import { getAuthUser, unauthorized, forbidden, badRequest, notFound, serverError, getIP } from "@/lib/api-auth";
import { audit } from "@/lib/audit";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthUser();
  if (!user) return unauthorized();
  if ((user.role as string) !== "DIRECTOR") return forbidden();
  const { id } = await params;

  try {
    const { newPassword } = await req.json();
    if (!newPassword || newPassword.length < 8) return badRequest("New password must be at least 8 characters.");

    const target = await prisma.user.findUnique({ where: { id: id }, select: { name: true } });
    if (!target) return notFound("User not found.");

    const hashed = await bcrypt.hash(newPassword, 12);
    await prisma.user.update({
      where: { id: id },
      data: { password: hashed, tokenVersion: { increment: 1 } },
    });

    audit(user.id, "RESET_PASSWORD", "User", id, target.name, getIP(req));
    return NextResponse.json({ message: "Password reset successfully." });
  } catch (err) {
    console.error("[users/[id]/reset-password POST]", err);
    return serverError();
  }
}
