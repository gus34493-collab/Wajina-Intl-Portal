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
    const userId = payload.id as string;

    const { searchParams } = new URL(req.url);
    const termId = searchParams.get("termId");
    const studentId = searchParams.get("studentId") || userId; // Default to self

    // Security: Only certain roles can view others' grades
    if (studentId !== userId) {
      const isManagement = ["DIRECTOR", "PRINCIPAL", "HEAD_TEACHER", "VP_ACADEMICS", "VP_ADMIN", "TEACHER", "FORM_TEACHER"].includes(userRole);
      if (!isManagement) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }

    const where: any = {
      studentId,
      ...(termId && { termId })
    };

    const grades = await prisma.grade.findMany({
      where,
      include: {
        subject: { select: { name: true } },
        term: { select: { name: true, academicSessionId: true } }
      },
      orderBy: { subject: { name: 'asc' } }
    });

    return NextResponse.json({ grades });
    
  } catch (err: any) {
    console.error("[API Grades] Failure:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
