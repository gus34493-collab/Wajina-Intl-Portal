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

    const isManagement = ['DIRECTOR', 'PRINCIPAL', 'HEAD_TEACHER', 'ASST_HEAD_TEACHER', 'VP_ADMIN', 'VP_ACADEMICS'].includes(userRole);
    
    if (!isManagement) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const overrideFormMaster = searchParams.get("overrideFormMaster") === "true";
    const campus = userRole === 'DIRECTOR' ? searchParams.get("campus") : userCampus;

    let where: any = {};
    
    if (overrideFormMaster) {
      where.status = { in: ['SUBMITTED', 'FORM_APPROVED'] };
    } else {
      where.status = 'FORM_APPROVED';
    }

    if (campus && campus !== "ALL") {
      where.student = { campus: campus as any };
    }

    const [grades, total, pendingCount] = await Promise.all([
      prisma.grade.findMany({
        where,
        take: 50,
        orderBy: { updatedAt: 'asc' },
        include: {
          student: { select: { name: true, enrolledArm: { select: { fullName: true } } } },
          subject: { select: { name: true } }
        }
      }),
      prisma.grade.count({ where }),
      prisma.grade.count({ 
        where: { 
          status: { in: ['SUBMITTED', 'FORM_APPROVED'] },
          ...(campus && campus !== "ALL" && { student: { campus: campus as any } })
        } 
      })
    ]);

    return NextResponse.json({ grades, total, pendingCount });
    
  } catch (err: any) {
    console.error("[API Grades Pending Review] Failure:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
