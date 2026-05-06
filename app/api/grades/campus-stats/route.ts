import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthUser, unauthorized, forbidden, serverError } from "@/lib/api-auth";

const MANAGEMENT = ["DIRECTOR", "PRINCIPAL", "HEAD_TEACHER", "ASST_HEAD_TEACHER", "VP_ACADEMICS", "VP_ADMIN"];

export async function GET(req: NextRequest) {
  const user = await getAuthUser();
  if (!user) return unauthorized();
  if (!MANAGEMENT.includes(user.role as string)) return forbidden();

  try {
    const role = user.role as string;
    const campus = role === "DIRECTOR" ? new URL(req.url).searchParams.get("campus") : (user.campus as string);
    const campusFilter = campus && campus !== "ALL" ? { student: { campus: campus as any } } : {};

    const [draft, submitted, formApproved, principalApproved, returned, issued] = await Promise.all([
      prisma.grade.count({ where: { status: "DRAFT", ...campusFilter } }),
      prisma.grade.count({ where: { status: "SUBMITTED", ...campusFilter } }),
      prisma.grade.count({ where: { status: "FORM_APPROVED", ...campusFilter } }),
      prisma.grade.count({ where: { status: "PRINCIPAL_APPROVED", ...campusFilter } }),
      prisma.grade.count({ where: { status: "RETURNED", ...campusFilter } }),
      prisma.grade.count({ where: { status: "ISSUED", ...campusFilter } }),
    ]);

    return NextResponse.json({ draft, submitted, formApproved, principalApproved, returned, issued });
  } catch (err) {
    console.error("[grades/campus-stats GET]", err);
    return serverError();
  }
}
