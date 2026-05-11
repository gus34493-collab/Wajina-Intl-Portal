import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import prisma from "@/lib/prisma";
import { getAuthUser, unauthorized, forbidden, badRequest, serverError, getIP } from "@/lib/api-auth";
import { audit } from "@/lib/audit";

const VALID_ROLES = [
  "DIRECTOR", "PRINCIPAL", "VP_ACADEMICS", "VP_ADMIN", "HOD",
  "HEAD_TEACHER", "ASST_HEAD_TEACHER", "DEAN",
  "BURSAR", "ACCOUNTS_OFFICER", "HR",
  "FORM_TEACHER", "TEACHER", "PARENT", "STUDENT",
];

const ACADEMIC_WORKSPACE = ["DIRECTOR", "PRINCIPAL", "VP_ACADEMICS", "HOD", "HEAD_TEACHER", "ASST_HEAD_TEACHER", "TEACHER", "FORM_TEACHER"];
const ADMIN_ROLES = ["DIRECTOR", "PRINCIPAL", "HEAD_TEACHER", "VP_ADMIN", "HR"];

const USER_SELECT = {
  id: true, email: true, name: true, role: true, status: true, phone: true,
  profilePhoto: true, salary: true, joinedAt: true, departmentId: true, campus: true,
  createdAt: true, updatedAt: true,
  enrolledArm: { select: { id: true, fullName: true, class: { select: { name: true, campus: true } } } },
  managedArms: { select: { id: true, fullName: true } },
} as const;

export async function GET(req: NextRequest) {
  const user = await getAuthUser();
  if (!user) return unauthorized();

  const role = user.role as string;
  const isAcademic = ACADEMIC_WORKSPACE.includes(role);
  if (!isAcademic && !ADMIN_ROLES.includes(role)) return forbidden();

  try {
    const { searchParams } = new URL(req.url);
    const roleFilter = searchParams.get("role");
    const status = searchParams.get("status");
    const search = searchParams.get("search");
    const campus = searchParams.get("campus");
    const email = searchParams.get("email");
    const classId = searchParams.get("classId");
    const armId = searchParams.get("armId");
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
    const limit = Math.min(parseInt(searchParams.get("limit") ?? "50"), 200);
    const skip = (page - 1) * limit;

    const isStaffOrTeacher = ["TEACHER", "FORM_TEACHER"].includes(role);
    const forcedRole = isStaffOrTeacher ? "STUDENT" : roleFilter;
    const campusFilter = role !== "DIRECTOR" ? (user.campus as string) : campus;

    const isPowerful = ["DIRECTOR", "HR", "BURSAR"].includes(role);
    const select = isPowerful ? USER_SELECT : { ...USER_SELECT, salary: false };

    const where: any = {
      ...(forcedRole && { role: forcedRole }),
      ...(status && { status }),
      ...(campusFilter && { campus: campusFilter as any }),
      ...(email && { email: { equals: email, mode: "insensitive" } }),
      ...(classId && { classId }),
      ...(armId && { armId }),
      ...(search && {
        OR: [
          { name: { contains: search, mode: "insensitive" } },
          { email: { contains: search, mode: "insensitive" } },
        ],
      }),
    };

    const [users, total] = await Promise.all([
      prisma.user.findMany({ where, select: select as any, orderBy: { name: "asc" }, skip, take: limit }),
      prisma.user.count({ where }),
    ]);

    return NextResponse.json({ users, total, page, limit });
  } catch (err) {
    console.error("[users GET]", err);
    return serverError();
  }
}

export async function POST(req: NextRequest) {
  const user = await getAuthUser();
  if (!user) return unauthorized();
  if (!ADMIN_ROLES.includes(user.role as string)) return forbidden();

  try {
    const { email, name, role: newRole, password, phone, armId, campus } = await req.json();
    if (!email || !name || !newRole || !password) return badRequest("email, name, role, and password are required.");
    if (!VALID_ROLES.includes(newRole)) return badRequest(`Invalid role. Must be one of: ${VALID_ROLES.join(", ")}`);
    if (password.length < 8) return badRequest("Password must be at least 8 characters.");

    const actorRole = user.role as string;
    if (actorRole === "PRINCIPAL" && ["DIRECTOR", "PRINCIPAL"].includes(newRole)) {
      return forbidden();
    }

    const existing = await prisma.user.findUnique({ where: { email: email.toLowerCase().trim() } });
    if (existing) return NextResponse.json({ error: "A user with this email already exists." }, { status: 409 });

    const hashed = await bcrypt.hash(password, 12);
    const created: any = await prisma.user.create({
      data: {
        email: email.toLowerCase().trim(),
        name: name.trim(),
        role: newRole,
        password: hashed,
        phone: phone ?? null,
        ...(armId && { armId }),
        campus: (campus ?? user.campus) as any,
        status: "ACTIVE",
        failedLoginAttempts: 0,
      },
      select: USER_SELECT as any,
    });

    audit(user.id, "CREATE_USER", "User", created.id, `${name} (${newRole})`, getIP(req));
    return NextResponse.json(created, { status: 201 });
  } catch (err) {
    console.error("[users POST]", err);
    return serverError();
  }
}
