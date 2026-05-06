import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthUser, hasRole, unauthorized, forbidden, serverError } from "@/lib/api-auth";

const HR_ROLES = ["HEAD_TEACHER", "PRINCIPAL", "DIRECTOR", "VP_ADMIN", "HR"] as const;

export async function GET(req: NextRequest) {
  const user = await getAuthUser();
  if (!user) return unauthorized();
  if (!hasRole(user, ...HR_ROLES)) return forbidden("HR access required.");

  try {
    const { searchParams } = new URL(req.url);
    const campusParam = searchParams.get("campus");
    const campusFilter = user.role === "DIRECTOR" ? campusParam : user.campus;

    const [activeStaff, pendingOnboarding] = await Promise.all([
      prisma.user.count({
        where: { role: { notIn: ["STUDENT", "PARENT"] }, status: "ACTIVE", ...(campusFilter && { campus: campusFilter as any }) },
      }),
      prisma.user.count({
        where: { role: { notIn: ["STUDENT", "PARENT"] }, status: "PENDING", ...(campusFilter && { campus: campusFilter as any }) },
      }),
    ]);

    return NextResponse.json({ activeStaff, pendingOnboarding });
  } catch (err) {
    console.error("[hr/counts GET]", err);
    return serverError();
  }
}
