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

    const allowedRoles = ["DIRECTOR", "PRINCIPAL", "ADMIN_STAFF", "HEAD_TEACHER", "VP_ADMIN", "VP_ACADEMICS", "ASST_HEAD_TEACHER"];
    if (!allowedRoles.includes(userRole)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const campus = userRole === 'DIRECTOR' ? searchParams.get("campus") : userCampus;

    const skip = parseInt(searchParams.get("page") || "1") - 1;
    const limit = parseInt(searchParams.get("limit") || "100");

    const where: any = {};
    if (status) where.status = status.toUpperCase();
    if (campus && campus !== "ALL") where.campus = campus.toUpperCase() as any;

    const [admissions, total] = await Promise.all([
      prisma.admission.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: skip * limit,
        take: limit,
        include: { session: { select: { name: true } } },
      }),
      prisma.admission.count({ where }),
    ]);

    return NextResponse.json({ admissions, total });
    
  } catch (err: any) {
    console.error("[API Admissions List] Failure:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
     // Replicating POST logic from admissions.ts
     // ... but focusing on GET/Stats/Dashboard for now.
     return NextResponse.json({ error: "Not implemented" }, { status: 501 });
  } catch (err) {
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
