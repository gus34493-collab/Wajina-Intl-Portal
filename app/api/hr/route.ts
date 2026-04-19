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

    const allowedRoles = ["DIRECTOR", "PRINCIPAL", "HEAD_TEACHER", "VP_ADMIN", "HR"];
    if (!allowedRoles.includes(userRole)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const campus = userRole === 'DIRECTOR' ? searchParams.get("campus") : userCampus;

    const [activeStaff, pendingOnboarding, staffList] = await Promise.all([
      prisma.user.count({
        where: {
          role: { notIn: ['STUDENT', 'PARENT'] },
          status: 'ACTIVE',
          ...(campus && campus !== "ALL" && { campus: campus as any })
        }
      }),
      prisma.user.count({
        where: {
          role: { notIn: ['STUDENT', 'PARENT'] },
          status: 'PENDING',
          ...(campus && campus !== "ALL" && { campus: campus as any })
        }
      }),
      prisma.user.findMany({
        where: {
          role: { in: ['TEACHER', 'FORM_TEACHER', 'ADMIN_STAFF', 'HOD', 'PRINCIPAL', 'HR'] },
          ...(campus && campus !== "ALL" && { campus: campus as any })
        },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          campus: true,
          status: true,
          appraisalsReceived: {
            orderBy: { createdAt: 'desc' },
            take: 1
          }
        },
        orderBy: { name: 'asc' }
      })
    ]);

    return NextResponse.json({ 
      summary: { activeStaff, pendingOnboarding },
      staff: staffList,
      campus: campus || 'ALL' 
    });
    
  } catch (err: any) {
    console.error("[API HR Data] Failure:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
