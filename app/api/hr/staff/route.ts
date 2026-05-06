import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthUser, hasRole, unauthorized, forbidden, serverError } from "@/lib/api-auth";

export async function GET(req: NextRequest) {
  const user = await getAuthUser();
  if (!user) return unauthorized();
  if (!hasRole(user, "HEAD_TEACHER", "PRINCIPAL", "DIRECTOR", "VP_ADMIN")) return forbidden("HR access required.");

  try {
    const { searchParams } = new URL(req.url);
    const campusParam = searchParams.get("campus");
    const campusFilter = user.role === "DIRECTOR" ? campusParam : user.campus;

    const staff = await prisma.user.findMany({
      where: {
        role: { in: ["TEACHER", "FORM_TEACHER", "HR", "HOD", "PRINCIPAL"] },
        ...(campusFilter && { campus: campusFilter as any }),
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        campus: true,
        status: true,
        appraisalsReceived: { orderBy: { createdAt: "desc" }, take: 1 },
      },
    });

    return NextResponse.json({ staff });
  } catch (err) {
    console.error("[hr/staff GET]", err);
    return serverError();
  }
}
