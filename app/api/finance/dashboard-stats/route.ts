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
    const token = cookieStore.get("wajina_token")?.value;

    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { payload } = await jwtVerify(token, JWT_SECRET);
    const userRole = payload.role as string;

    if (!["DIRECTOR", "PRINCIPAL", "HEAD_TEACHER"].includes(userRole)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // 1. Session Discovery
    let session = await prisma.academicSession.findFirst({ where: { status: 'ACTIVE' } });
    if (!session) session = await prisma.academicSession.findFirst({ orderBy: { year: 'desc' } });
    
    if (!session) {
      return NextResponse.json({ totalStudents: 0, activeStudents: 0, totalCollected: 0, totalExpected: 0, sessionName: 'None' });
    }

    // 2. Active Stats (Simplified for RSC performance)
    const thresholdDate = new Date();
    thresholdDate.setDate(thresholdDate.getDate() - 21);
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const students = await prisma.user.findMany({
      where: { role: 'STUDENT' },
      select: {
        id: true,
        createdAt: true,
        classId: true,
        campus: true,
        payments: {
          where: { sessionId: session.id, status: 'APPROVED', category: 'TUITION' },
          take: 1
        },
        attendance: {
          where: { date: { gte: thresholdDate }, status: 'PRESENT' },
          take: 1
        }
      }
    });

    const activeCount = students.filter(s => {
      const isNew = s.createdAt >= thirtyDaysAgo;
      const hasPaid = s.payments.length > 0;
      const isPresent = s.attendance.length > 0;
      return isNew || hasPaid || isPresent;
    }).length;

    // 3. Financial Aggregation
    const targetStudentIds = students.map(s => s.id);
    const collections = await prisma.payment.aggregate({
      where: { 
        sessionId: session.id, 
        status: 'APPROVED', 
        category: 'TUITION',
        studentId: { in: targetStudentIds }
      },
      _sum: { amount: true }
    });

    // 4. Expected Revenue
    const studentGroups = await prisma.user.groupBy({
      by: ['classId', 'campus'],
      where: { role: 'STUDENT' }, 
      _count: { _all: true }
    });

    const feeConfigs = await prisma.feeConfig.findMany({
      where: { sessionId: session.id, category: 'TUITION' }
    });

    let totalExpected = 0;
    for (const group of studentGroups) {
        const config = 
            feeConfigs.find(c => c.classId === group.classId) ||
            feeConfigs.find(c => c.campus === group.campus && !c.classId) ||
            feeConfigs.find(c => !c.campus && !c.classId);
        
        if (config) {
            totalExpected += (Number(config.amount) * group._count._all);
        }
    }

    return NextResponse.json({
      totalStudents: students.length,
      activeStudents: activeCount,
      totalCollected: (collections._sum as any).amount || 0,
      totalExpected,
      collectionRate: totalExpected > 0 ? Math.round(((collections._sum as any).amount || 0) / totalExpected * 100) : 0,
      sessionName: session.name
    });
    
  } catch (err: any) {
    console.error("[API Dashboard Stats] Failure:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
