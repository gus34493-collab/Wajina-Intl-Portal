import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthUser, unauthorized, forbidden, serverError } from "@/lib/api-auth";

const ALLOWED = ["DIRECTOR", "PRINCIPAL", "HEAD_TEACHER", "ASST_HEAD_TEACHER", "VP_ACADEMICS", "VP_ADMIN", "FORM_TEACHER"];

export async function GET(req: NextRequest) {
  const user = await getAuthUser();
  if (!user) return unauthorized();
  if (!ALLOWED.includes(user.role as string)) return forbidden();

  try {
    const role = user.role as string;
    const campus = role === "DIRECTOR" ? new URL(req.url).searchParams.get("campus") : (user.campus as string);

    const campusFilter = campus && campus !== "ALL" ? { student: { campus: campus as any } } : {};

    const [submitted, formApproved] = await Promise.all([
      prisma.grade.count({ where: { status: "SUBMITTED", ...campusFilter } }),
      prisma.grade.count({ where: { status: "FORM_APPROVED", ...campusFilter } }),
    ]);

    return NextResponse.json({ submitted, formApproved, total: submitted + formApproved });
  } catch (err) {
    console.error("[grades/pending GET]", err);
    return serverError();
  }
}
