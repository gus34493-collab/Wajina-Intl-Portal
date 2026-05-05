import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";
import prisma from "@/lib/prisma";
import { cookies } from "next/headers";
import { withTenantContext } from "@/lib/prisma-extension";

if (!process.env.JWT_SECRET) throw new Error("JWT_SECRET environment variable is not set");
const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET);

export async function GET(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("wajina_token")?.value;

    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { payload } = await jwtVerify(token, JWT_SECRET);
    const userRole = payload.role as string;
    const userCampus = payload.campus as string;

    const allowedRoles = ["DIRECTOR", "PRINCIPAL", "HEAD_TEACHER", "VP_ADMIN", "HR", "BURSAR", "ACCOUNTS_OFFICER"];
    if (!allowedRoles.includes(userRole)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const campusFilter = userRole === 'DIRECTOR' ? searchParams.get("campus") : userCampus;
    const sessionId = searchParams.get("sessionId");

    let targetSessionId = sessionId;
    if (!targetSessionId) {
      const currentSession = await prisma.academicSession.findFirst({
        where: { status: 'ACTIVE' },
        select: { id: true },
      });
      targetSessionId = currentSession?.id;
    }

    const where: any = {};
    if (targetSessionId) where.sessionId = targetSessionId;

    return await withTenantContext(prisma, { campus: campusFilter, role: userRole }, async () => {
      const [total, qualified, offered, feeConfirmed, enrolled, scholarshipReview] = await Promise.all([
        prisma.admission.count({ where }),
        prisma.admission.count({ where: { ...where, status: { in: ['QUALIFIED', 'OFFERED', 'SCHOLARSHIP_REVIEW', 'FEE_CONFIRMED', 'ENROLLED'] } } }),
        prisma.admission.count({ where: { ...where, status: { in: ['OFFERED', 'SCHOLARSHIP_REVIEW', 'FEE_CONFIRMED', 'ENROLLED'] } } }),
        prisma.admission.count({ where: { ...where, status: { in: ['FEE_CONFIRMED', 'ENROLLED'] } } }),
        prisma.admission.count({ where: { ...where, status: 'ENROLLED' } }),
        prisma.admission.count({ where: { ...where, status: 'SCHOLARSHIP_REVIEW' } }),
      ]);

      const yieldPct = total > 0 ? ((enrolled / total) * 100).toFixed(1) : '0.0';

      return NextResponse.json({
        total,
        qualified,
        offered,
        feeConfirmed,
        enrolled,
        scholarshipReview,
        yieldPct,
        campus: campusFilter || 'ALL'
      });
    });

  } catch (err: any) {
    console.error("[API Admissions Stats] Failure:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
