import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
import {
  getAuthUser, hasRole, unauthorized, forbidden, badRequest, serverError, getIP,
} from "@/lib/api-auth";
import { audit } from "@/lib/audit";

export async function POST(req: NextRequest) {
  const user = await getAuthUser();
  if (!user) return unauthorized();
  if (!hasRole(user, "DIRECTOR", "PRINCIPAL", "HEAD_TEACHER", "VP_ADMIN")) return forbidden("Unauthorized for staff onboarding.");

  try {
    const { name, email, role, campus } = await req.json();

    if (!name || !email || !role) return badRequest("Name, Email, and Role are required.");

    const existing = await prisma.user.findUnique({ where: { email: email.toLowerCase().trim() } });
    if (existing) return NextResponse.json({ error: "User already exists" }, { status: 409 });

    const password = "Wajina2026!";
    const hashed = await bcrypt.hash(password, 12);

    const newUser = await prisma.user.create({
      data: {
        name: name.trim(),
        email: email.toLowerCase().trim(),
        role: role as any,
        password: hashed,
        status: "ACTIVE",
        campus: (campus || user.campus) as any,
      },
      select: { id: true, name: true, role: true, campus: true },
    });

    audit(user.id, "STAFF_ONBOARDED", "User", newUser.id, `New staff: ${newUser.name} as ${newUser.role}`, getIP(req));
    return NextResponse.json({ user: newUser, temporaryPassword: password }, { status: 201 });
  } catch (err) {
    console.error("[hr/onboard POST]", err);
    return serverError();
  }
}
