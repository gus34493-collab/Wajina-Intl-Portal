import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import prisma from "@/lib/prisma";
import { destroySession } from "@/lib/auth";
import { getAuthUser, unauthorized, badRequest, serverError, getIP } from "@/lib/api-auth";
import { audit } from "@/lib/audit";

const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{8,}$/;

export async function POST(req: NextRequest) {
  const user = await getAuthUser();
  if (!user) return unauthorized();

  try {
    const { currentPassword, newPassword } = await req.json();
    if (!currentPassword || !newPassword) return badRequest("Both current and new password are required.");

    if (newPassword.length < 8 || !PASSWORD_REGEX.test(newPassword)) {
      return badRequest("Password must be at least 8 characters and contain uppercase, lowercase, number, and special character.");
    }

    const record = await prisma.user.findUnique({
      where: { id: user.id },
      select: { password: true },
    });

    const valid = await bcrypt.compare(currentPassword, record!.password);
    if (!valid) return NextResponse.json({ error: "Current password is incorrect." }, { status: 401 });

    const hashed = await bcrypt.hash(newPassword, 12);
    await (prisma.user.update as any)({
      where: { id: user.id },
      data: {
        password: hashed,
        tokenVersion: { increment: 1 },
        mustChangePassword: false,
        passwordExpiresAt: null,
      },
    });

    await destroySession();
    audit(user.id, "PASSWORD_CHANGED", "User", user.id, null, getIP(req));
    return NextResponse.json({ message: "Password changed. Please log in again." });
  } catch (err) {
    console.error("[auth/change-password POST]", err);
    return serverError();
  }
}
