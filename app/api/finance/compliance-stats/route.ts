import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";
import prisma from "@/lib/prisma";
import { cookies } from "next/headers";

if (!process.env.JWT_SECRET) throw new Error("JWT_SECRET environment variable is not set");
const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET);

export async function GET(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("wajina_access")?.value || cookieStore.get("wajina_token")?.value;

    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { payload } = await jwtVerify(token, JWT_SECRET);
    const userRole = payload.role as string;
    const userCampus = payload.campus as string;

    const allowedRoles = ["DIRECTOR", "PRINCIPAL", "HEAD_TEACHER", "BURSAR", "ACCOUNTS_OFFICER"];
    if (!allowedRoles.includes(userRole)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const campus = userRole === 'DIRECTOR' ? searchParams.get("campus") : userCampus;

    // 1. Get Active Session
    let session = await prisma.academicSession.findFirst({ where: { status: 'ACTIVE' } });
    if (!session) session = await prisma.academicSession.findFirst({ orderBy: { year: 'desc' } });
    
    if (!session) {
      return NextResponse.json({ summary: { paid: 0, unpaid: 0, partPaid: 0, total: 0 } });
    }

    // 2. Fetch Students for the campus
    const students = await prisma.user.findMany({
      where: { 
        role: 'STUDENT',
        status: 'ACTIVE',
        ...(campus && campus !== "ALL" && { campus: campus as any })
      },
      select: {
        id: true,
        classId: true,
        campus: true,
        payments: {
          where: { sessionId: session.id, status: 'APPROVED', category: 'TUITION' },
          select: { amount: true }
        }
      }
    });

    // 3. Fetch FeeConfigs for calculation
    const feeConfigs = await prisma.feeConfig.findMany({
      where: { sessionId: session.id, category: 'TUITION' }
    });

    let paidCount = 0;
    let unpaidCount = 0;
    let partPaidCount = 0;

    students.forEach(student => {
      const totalPaid = student.payments.reduce((sum, p) => sum + p.amount, 0);
      
      // Resolve expected fee
      const config = 
        feeConfigs.find(c => c.classId === student.classId) ||
        feeConfigs.find(c => c.campus === student.campus && !c.classId) ||
        feeConfigs.find(c => !c.campus && !c.classId);

      const expected = config ? config.amount : 0;

      if (totalPaid <= 0) {
        unpaidCount++;
      } else if (totalPaid >= expected && expected > 0) {
        paidCount++;
      } else {
        partPaidCount++;
      }
    });

    return NextResponse.json({ 
      summary: {
        paid: paidCount,
        unpaid: unpaidCount,
        partPaid: partPaidCount,
        total: students.length
      },
      campus: campus || 'ALL',
      sessionName: session.name
    });
    
  } catch (err: any) {
    console.error("[API Compliance Stats] Failure:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
