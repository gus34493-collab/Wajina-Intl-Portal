import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";
import prisma from "@/lib/prisma";
import { cookies } from "next/headers";

if (!process.env.JWT_SECRET) throw new Error("JWT_SECRET environment variable is not set");
const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET);

export async function GET(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("wajina_token")?.value;

    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { payload } = await jwtVerify(token, JWT_SECRET);
    const userRole = payload.role as string;
    
    // Scoped to Management
    const isMgmt = ["DIRECTOR", "PRINCIPAL", "HEAD_TEACHER", "VP_ADMIN"].includes(userRole);
    if (!isMgmt) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const sessions = await prisma.academicSession.findMany({
      orderBy: { startDate: 'desc' },
      include: { terms: { orderBy: { startDate: 'asc' } } }
    });

    return NextResponse.json({ sessions });
    
  } catch (err: any) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
