import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import { badRequest, serverError, getIP } from "@/lib/api-auth";
import { audit } from "@/lib/audit";

const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{8,}$/;

export async function POST(req: NextRequest) {
  try {
    const { token, newPassword } = await req.json();
    if (!token || !newPassword) return badRequest("Token and new password are required.");

    if (newPassword.length < 8 || !PASSWORD_REGEX.test(newPassword)) {
      return badRequest("Password must be at least 8 characters and contain uppercase, lowercase, number, and special character.");
    }

    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
    const record = await prisma.passwordResetToken.findUnique({ where: { tokenHash } });

    if (!record || record.usedAt || record.expiresAt < new Date()) {
      return NextResponse.json({ error: "This reset link is invalid or has expired. Please request a new one." }, { status: 400 });
    }

    const hashed = await bcrypt.hash(newPassword, 12);

    await prisma.$transaction([
      prisma.user.update({
        where: { id: record.userId },
        data: { password: hashed, tokenVersion: { increment: 1 }, failedLoginAttempts: 0, lockedUntil: null },
      }),
      prisma.passwordResetToken.update({ where: { tokenHash }, data: { usedAt: new Date() } }),
    ]);

    audit(record.userId, "PASSWORD_RESET", "User", record.userId, null, getIP(req));
    return NextResponse.json({ message: "Password reset successfully. You can now log in with your new password." });
  } catch (err) {
    console.error("[auth/reset/confirm POST]", err);
    return serverError();
  }
}
