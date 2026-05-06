import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthUser, unauthorized, forbidden, serverError } from "@/lib/api-auth";

const MANAGEMENT = [
  "DIRECTOR", "PRINCIPAL", "ADMIN_STAFF", "HEAD_TEACHER", "ASST_HEAD_TEACHER",
  "VP_ADMIN", "VP_ACADEMICS", "BURSAR", "HR",
];

export async function GET(req: NextRequest) {
  const user = await getAuthUser();
  if (!user) return unauthorized();
  if (!MANAGEMENT.includes(user.role as string)) return forbidden();

  try {
    const { searchParams } = new URL(req.url);
    const role = user.role as string;
    const campusFilter = role === "DIRECTOR" ? searchParams.get("campus") : (user.campus as string);
    const sessionId = searchParams.get("sessionId");

    let targetSessionId = sessionId ?? null;
    if (!targetSessionId) {
      const current = await prisma.academicSession.findFirst({ where: { status: "ACTIVE" }, select: { id: true } });
      targetSessionId = current?.id ?? null;
    }

    const base: any = {};
    if (targetSessionId) base.sessionId = targetSessionId;
    if (campusFilter && campusFilter !== "ALL") base.campus = campusFilter as any;

    const [total, qualified, offered, feeConfirmed, enrolled, scholarshipReview] = await Promise.all([
      prisma.admission.count({ where: base }),
      prisma.admission.count({ where: { ...base, status: { in: ["QUALIFIED", "OFFERED", "SCHOLARSHIP_REVIEW", "FEE_CONFIRMED", "ENROLLED"] } } }),
      prisma.admission.count({ where: { ...base, status: { in: ["OFFERED", "SCHOLARSHIP_REVIEW", "FEE_CONFIRMED", "ENROLLED"] } } }),
      prisma.admission.count({ where: { ...base, status: { in: ["FEE_CONFIRMED", "ENROLLED"] } } }),
      prisma.admission.count({ where: { ...base, status: "ENROLLED" } }),
      prisma.admission.count({ where: { ...base, status: "SCHOLARSHIP_REVIEW" } }),
    ]);

    return NextResponse.json({
      total, qualified, offered, feeConfirmed, enrolled, scholarshipReview,
      yieldPct: total > 0 ? ((enrolled / total) * 100).toFixed(1) : "0.0",
      campus: campusFilter ?? "ALL",
    });
  } catch (err) {
    console.error("[admissions/stats GET]", err);
    return serverError();
  }
}
