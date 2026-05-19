import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import prisma from "@/lib/prisma";
import { createSession } from "@/lib/auth";
import { badRequest, serverError, getIP } from "@/lib/api-auth";
import { audit } from "@/lib/audit";

const MAX_ATTEMPTS = 5;
const LOCKOUT_MS = 30 * 60 * 1000;

const ipAttempts = new Map<string, { count: number; resetAt: number }>();
const IP_LIMIT = 20;
const IP_WINDOW_MS = 15 * 60 * 1000;

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
    const now = Date.now();
    const ipEntry = ipAttempts.get(ip);
    if (ipEntry && ipEntry.resetAt > now && ipEntry.count >= IP_LIMIT) {
      return NextResponse.json({ error: "Too many requests. Try again later." }, { status: 429 });
    }
    ipAttempts.set(ip, {
      count: (ipEntry && ipEntry.resetAt > now ? ipEntry.count : 0) + 1,
      resetAt: ipEntry && ipEntry.resetAt > now ? ipEntry.resetAt : now + IP_WINDOW_MS,
    });

    const { email, password } = await req.json();
    if (!email || !password) return badRequest("Email and password are required.");

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
      select: {
        id: true, email: true, name: true, role: true, status: true,
        campus: true, password: true, profilePhoto: true,
        failedLoginAttempts: true, lockedUntil: true, tokenVersion: true,
        mustChangePassword: true, passwordExpiresAt: true,
      },
    });

    if (!user) {
      audit(null, "LOGIN_FAILED", "User", null, `Unknown email: ${email.toLowerCase().trim()}`, getIP(req));
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
    }

    if (user.lockedUntil && user.lockedUntil > new Date()) {
      const remaining = Math.ceil((user.lockedUntil.getTime() - Date.now()) / 60000);
      return NextResponse.json({ error: `Account locked. Try again in ${remaining} minute(s).`, locked: true }, { status: 429 });
    }

    if (user.status === "DISABLED") {
      audit(user.id, "LOGIN_BLOCKED", "User", user.id, "Account disabled", getIP(req));
      return NextResponse.json({ error: "Your account has been disabled. Contact the administrator." }, { status: 403 });
    }

    if (user.status === "PENDING") {
      audit(user.id, "LOGIN_BLOCKED", "User", user.id, "Account pending", getIP(req));
      return NextResponse.json({ error: "Your account is pending activation." }, { status: 403 });
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      // Atomic increment — concurrent login attempts cannot race past MAX_ATTEMPTS
      const updated = await prisma.user.update({
        where: { id: user.id },
        data: { failedLoginAttempts: { increment: 1 } },
        select: { failedLoginAttempts: true },
      });
      const newAttempts = updated.failedLoginAttempts;
      if (newAttempts >= MAX_ATTEMPTS) {
        const lockedUntil = new Date(Date.now() + LOCKOUT_MS);
        await prisma.user.update({ where: { id: user.id }, data: { lockedUntil } });
        audit(user.id, "ACCOUNT_LOCKED", "User", user.id, `Locked after ${newAttempts} attempts`, getIP(req));
        return NextResponse.json({ error: "Account locked after too many failed attempts. Try again in 30 minutes.", locked: true }, { status: 429 });
      }
      audit(user.id, "LOGIN_FAILED", "User", user.id, `Wrong password (attempt ${newAttempts}/${MAX_ATTEMPTS})`, getIP(req));
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
    }

    // Temp password expired — lock the account and redirect to school office
    const passwordExpiresAt = (user as any).passwordExpiresAt as Date | null;
    if (passwordExpiresAt && passwordExpiresAt < new Date()) {
      await prisma.user.update({ where: { id: user.id }, data: { status: "DISABLED" } });
      audit(user.id, "PASSWORD_EXPIRED", "User", user.id, "Account disabled — temp password expired", getIP(req));
      return NextResponse.json(
        { error: "Your temporary password has expired. Please contact the school office to regain access." },
        { status: 403 }
      );
    }

    await prisma.user.update({ where: { id: user.id }, data: { failedLoginAttempts: 0, lockedUntil: null } });
    await createSession(user);
    audit(user.id, "LOGIN", "User", user.id, null, getIP(req));

    return NextResponse.json({
      id: user.id, email: user.email, name: user.name,
      role: user.role, campus: user.campus, profilePhoto: user.profilePhoto,
      mustChangePassword: (user as any).mustChangePassword ?? false,
    });
  } catch (err) {
    console.error("[auth/login POST]", err);
    return serverError();
  }
}
