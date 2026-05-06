import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import prisma from "@/lib/prisma";
import { getAuthUser, unauthorized, forbidden, badRequest, serverError } from "@/lib/api-auth";

const READ_ROLES = ["DIRECTOR", "PRINCIPAL", "HEAD_TEACHER", "VP_ADMIN", "HR"];
const WRITE_ROLES = ["DIRECTOR", "PRINCIPAL", "HR", "VP_ADMIN"];

export async function GET(req: NextRequest) {
  const user = await getAuthUser();
  if (!user) return unauthorized();
  if (!READ_ROLES.includes(user.role as string)) return forbidden();

  try {
    const role = user.role as string;
    const campus = role === "DIRECTOR"
      ? new URL(req.url).searchParams.get("campus")
      : (user.campus as string);

    const campusWhere = campus && campus !== "ALL" ? { campus: campus as any } : {};

    const [activeStaff, pendingOnboarding, staffList] = await Promise.all([
      prisma.user.count({ where: { role: { notIn: ["STUDENT", "PARENT"] }, status: "ACTIVE", ...campusWhere } }),
      prisma.user.count({ where: { role: { notIn: ["STUDENT", "PARENT"] }, status: "PENDING", ...campusWhere } }),
      prisma.user.findMany({
        where: { role: { in: ["TEACHER", "FORM_TEACHER", "HOD", "PRINCIPAL", "HR", "VP_ADMIN", "BURSAR", "ACCOUNTS_OFFICER", "DEAN_STUDENTS"] as any }, ...campusWhere },
        select: {
          id: true, name: true, email: true, role: true, campus: true, status: true,
          appraisalsReceived: { orderBy: { createdAt: "desc" as const }, take: 1 },
        },
        orderBy: { name: "asc" },
      }),
    ]);

    return NextResponse.json({ summary: { activeStaff, pendingOnboarding }, staff: staffList, campus: campus ?? "ALL" });
  } catch (err) {
    console.error("[hr GET]", err);
    return serverError();
  }
}

export async function POST(req: NextRequest) {
  const user = await getAuthUser();
  if (!user) return unauthorized();
  if (!WRITE_ROLES.includes(user.role as string)) return forbidden();

  try {
    const { name, email, role: newRole, campus } = await req.json();
    if (!name || !email || !newRole) return badRequest("name, email, and role are required.");

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) return NextResponse.json({ error: "User already exists." }, { status: 409 });

    const tempPassword = Math.random().toString(36).slice(-12) + "!";
    const hashed = await bcrypt.hash(tempPassword, 12);

    const newUser = await prisma.user.create({
      data: { name, email, role: newRole as any, campus: (campus ?? user.campus) as any, password: hashed, status: "PENDING" },
    });

    return NextResponse.json({ user: { id: newUser.id, name: newUser.name, email: newUser.email }, temporaryPassword: tempPassword }, { status: 201 });
  } catch (err) {
    console.error("[hr POST]", err);
    return serverError();
  }
}
