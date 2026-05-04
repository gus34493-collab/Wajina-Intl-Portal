import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";
import prisma from "@/lib/prisma";
import { cookies } from "next/headers";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "fallback-secret-for-development-only"
);

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
    const query = searchParams.get("query") || "";
    const campus = userRole === 'DIRECTOR' ? searchParams.get("campus") : userCampus;

    // 1. Get Active Session
    let session = await prisma.academicSession.findFirst({ where: { status: 'ACTIVE' } });
    if (!session) session = await prisma.academicSession.findFirst({ orderBy: { year: 'desc' } });
    
    if (!session) {
      return NextResponse.json({ students: [] });
    }

    // 2. Fetch Students with relations
    const students = await prisma.user.findMany({
      where: { 
        role: 'STUDENT',
        status: 'ACTIVE',
        ...(campus && campus !== "ALL" && { campus: campus as any }),
        ...(query && {
          OR: [
            { name: { contains: query, mode: 'insensitive' } },
          ]
        })
      },
      select: {
        id: true,
        name: true,
        classId: true,
        armId: true,
        campus: true,
        enrolledClass: { select: { name: true } },
        enrolledArm: { select: { fullName: true } },
        payments: {
          where: { sessionId: session.id, status: 'APPROVED', category: 'TUITION' },
          select: { amount: true }
        }
      },
      orderBy: { name: 'asc' },
      take: 100 // Reasonable limit for compliance list
    });

    // 3. Fetch FeeConfigs for calculation
    const feeConfigs = await prisma.feeConfig.findMany({
      where: { sessionId: session.id, category: 'TUITION' }
    });

    // 4. Map students to their compliance status
    const complianceListData = students.map(student => {
      const totalPaid = student.payments.reduce((sum, p) => sum + p.amount, 0);
      
      const config = 
        feeConfigs.find(c => c.classId === student.classId) ||
        feeConfigs.find(c => c.campus === student.campus && !c.classId) ||
        feeConfigs.find(c => !c.campus && !c.classId);

      const expected = config ? config.amount : 0;

      let status = "UNPAID";
      if (totalPaid > 0) {
        status = totalPaid >= expected && expected > 0 ? "PAID" : "PART-PAID";
      }

      return {
        id: student.id,
        name: student.name,
        className: student.enrolledClass?.name || "N/A",
        armName: student.enrolledArm?.fullName || "N/A",
        status,
        paid: totalPaid,
        expected
      };
    });

    return NextResponse.json({ 
      students: complianceListData,
      campus: campus || 'ALL',
      sessionName: session.name
    });
    
  } catch (err: any) {
    console.error("[API Student Compliance List] Failure:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
