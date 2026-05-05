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

    if (userRole !== "DIRECTOR") {
      return NextResponse.json({ error: "Forbidden - Director Only" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const selectedCampus = searchParams.get("campus");

    let session = await prisma.academicSession.findFirst({ where: { status: 'ACTIVE' } });
    if (!session) session = await prisma.academicSession.findFirst({ orderBy: { year: 'desc' } });
    
    if (!session) return NextResponse.json({ labels: ['W1','W2','W3','W4','W5','W6'], data: [0,0,0,0,0,0] });

    const sixWeeksAgo = new Date();
    sixWeeksAgo.setDate(sixWeeksAgo.getDate() - 42);

    const payments = await prisma.payment.findMany({
      where: {
        status: 'APPROVED',
        category: 'TUITION',
        sessionId: session.id,
        createdAt: { gte: sixWeeksAgo },
        ...(selectedCampus && selectedCampus !== 'ALL' ? { student: { campus: selectedCampus as any } } : {})
      },
      select: { amount: true, createdAt: true },
    });

    const weeks = [0, 0, 0, 0, 0, 0];
    const now = new Date();
    
    payments.forEach((p: any) => {
      const createdDate = p.createdAt ? new Date(p.createdAt) : now;
      const diffDays = Math.floor((now.getTime() - createdDate.getTime()) / (1000 * 3600 * 24));
      const weekIndex = Math.floor(diffDays / 7);
      if (weekIndex >= 0 && weekIndex < 6) {
        weeks[5 - weekIndex] += Number(p.amount);
      }
    });

    return NextResponse.json({
        labels: ['Wk 1', 'Wk 2', 'Wk 3', 'Wk 4', 'Wk 5', 'Wk 6'],
        data: weeks.map(w => w / 1e6),
        totalRaw: weeks.reduce((a, b) => a + b, 0),
        sessionName: session.name
    });
    
  } catch (err: any) {
    console.error("[API Revenue Stats] Failure:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
