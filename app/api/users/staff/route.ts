import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthUser, unauthorized, forbidden, serverError } from "@/lib/api-auth";

const ALLOWED = ["DIRECTOR", "HR", "PRINCIPAL", "VP_ADMIN"];
const STAFF_ROLES = [
  "DIRECTOR", "PRINCIPAL", "VP_ACADEMICS", "VP_ADMIN", "HOD",
  "HEAD_TEACHER", "ASST_HEAD_TEACHER", "DEAN",
  "BURSAR", "ACCOUNTS_OFFICER", "HR", "FORM_TEACHER", "TEACHER",
];

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
  if (!ALLOWED.includes(user.role as string)) return forbidden();

  try {
    const { searchParams } = new URL(req.url);
    const departmentId = searchParams.get("departmentId");
    const role = user.role as string;
    const campus = role === "DIRECTOR" ? searchParams.get("campus") : (user.campus as string);

    const users = await prisma.user.findMany({
      where: {
        role: { in: STAFF_ROLES as any },
        ...(campus && { campus: campus as any }),
        ...(departmentId && { departmentId }),
      },
      select: USER_SELECT as any,
      orderBy: { name: "asc" },
    });

    return NextResponse.json(users);
  } catch (err) {
    console.error("[users/staff GET]", err);
    return serverError();
  }
}
