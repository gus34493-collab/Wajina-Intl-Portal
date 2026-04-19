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
    const userCampus = payload.campus as string;

    const allowedRoles = ["DIRECTOR", "PRINCIPAL", "HEAD_TEACHER", "VP_ADMIN", "VP_ACADEMICS", "ASST_HEAD_TEACHER", "BURSAR"];
    if (!allowedRoles.includes(userRole)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    let campus = userRole === 'DIRECTOR' ? searchParams.get("campus") : userCampus;

    const latestTerm = await prisma.term.findFirst({
      where: { status: 'CURRENT' },
      orderBy: { startDate: 'desc' }
    });
    
    if (!latestTerm) {
      return NextResponse.json({ subjects: [], campus: campus || "ALL" });
    }

    const subjects = await prisma.subject.findMany({
      where: { 
        ...(campus && campus !== "ALL" && { class: { campus: campus as any } }) 
      },
      include: {
        class: { select: { name: true } },
        grades: {
          where: { termId: latestTerm.id, status: 'PRINCIPAL_APPROVED' },
          select: { total: true }
        }
      }
    });

    const data = subjects.map(s => {
      const avg = s.grades.length > 0
        ? s.grades.reduce((sum, g) => sum + g.total, 0) / s.grades.length
        : 0;
      return {
        id: s.id,
        name: s.name,
        className: s.class.name,
        average: Math.round(avg * 10) / 10,
        studentCount: s.grades.length
      };
    }).sort((a, b) => b.average - a.average);

    return NextResponse.json({ subjects: data, campus: campus || 'ALL' });
    
  } catch (err: any) {
    console.error("[API Analytics Subjects] Failure:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
