import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import {
  getAuthUser, hasRole, unauthorized, forbidden, badRequest, serverError, getIP,
} from "@/lib/api-auth";
import { audit } from "@/lib/audit";
import { sendStaffCredentials } from "@/lib/email";

function generateTempPassword(): string {
  const upper = "ABCDEFGHJKLMNPQRSTUVWXYZ";
  const lower = "abcdefghjkmnpqrstuvwxyz";
  const digits = "23456789";
  const special = "!@#$%";
  const all = upper + lower + digits + special;
  const bytes = crypto.randomBytes(16);
  const pw: string[] = [
    upper[bytes[0] % upper.length],
    lower[bytes[1] % lower.length],
    digits[bytes[2] % digits.length],
    special[bytes[3] % special.length],
    ...Array.from({ length: 8 }, (_, i) => all[bytes[i + 4] % all.length]),
  ];
  for (let i = pw.length - 1; i > 0; i--) {
    const j = bytes[i] % (i + 1);
    [pw[i], pw[j]] = [pw[j], pw[i]];
  }
  return pw.join("");
}

export async function POST(req: NextRequest) {
  const user = await getAuthUser();
  if (!user) return unauthorized();
  if (!hasRole(user, "DIRECTOR", "PRINCIPAL", "HEAD_TEACHER", "VP_ADMIN", "HR")) {
    return forbidden("Unauthorized for staff onboarding.");
  }

  try {
    const { name, email, role, campus } = await req.json();
    if (!name || !email || !role) return badRequest("Name, Email, and Role are required.");

    const existing = await prisma.user.findUnique({ where: { email: email.toLowerCase().trim() } });
    if (existing) return NextResponse.json({ error: "User already exists" }, { status: 409 });

    const tempPassword = generateTempPassword();
    const hashed = await bcrypt.hash(tempPassword, 12);
    const passwordExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    const newUser = await (prisma.user.create as any)({
      data: {
        name: name.trim(),
        email: email.toLowerCase().trim(),
        role: role as any,
        password: hashed,
        status: "ACTIVE",
        campus: (campus || user.campus) as any,
        mustChangePassword: true,
        passwordExpiresAt,
      },
      select: { id: true, name: true, role: true, campus: true, email: true },
    }) as { id: string; name: string; role: string; campus: string; email: string };

    sendStaffCredentials({
      name: newUser.name,
      email: newUser.email,
      role: newUser.role,
      campus: newUser.campus,
      tempPassword,
    }).catch(err => console.error("[hr/onboard] email failed:", err));

    audit(user.id, "STAFF_ONBOARDED", "User", newUser.id, `${newUser.name} as ${newUser.role}`, getIP(req));
    return NextResponse.json({ user: newUser, message: "Account created and credentials emailed." }, { status: 201 });
  } catch (err) {
    console.error("[hr/onboard POST]", err);
    return serverError();
  }
}
