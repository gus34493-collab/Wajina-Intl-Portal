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
    const userCampus = payload.campus as string;

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const level = searchParams.get("level");

    let where: any = {};
    if (status) where.status = status.toUpperCase();
    if (level) where.level = level.toUpperCase();
    
    // Campus/Role Scope: Non-directors only see their campus or things specifically sent to them
    if (userRole !== 'DIRECTOR' && userCampus) {
      where.OR = [
        { sender: { campus: userCampus as any } },
        { receiverId: userId }
      ];
    }

    const requests = await prisma.request.findMany({
      where,
      include: {
        sender: { select: { name: true, role: true, campus: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    return NextResponse.json({ requests });
    
  } catch (err: any) {
    console.error("[API Requests] Failure:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
