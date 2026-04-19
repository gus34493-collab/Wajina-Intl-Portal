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

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status") || "OPEN";
    const campus = searchParams.get("campus");

    const risks = await prisma.operationalRisk.findMany({
      where: {
        status: status as any,
        ...(campus && campus !== "ALL" && { campus: campus as any }),
      },
      include: {
        creator: {
          select: { name: true }
        }
      },
      orderBy: { createdAt: "desc" }
    });

    return NextResponse.json(risks);
  } catch (err: any) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("wajina_token")?.value;
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { payload } = await jwtVerify(token, JWT_SECRET);
    const userId = payload.userId as string;

    const { title, severity, campus, description } = await req.json();

    const risk = await prisma.operationalRisk.create({
      data: {
        title,
        severity,
        campus: campus as any,
        description,
        status: "OPEN",
        createdBy: userId,
      }
    });

    return NextResponse.json(risk);
  } catch (err: any) {
    console.error("[Risks API POST] Error:", err);
    return NextResponse.json({ error: "Failed to create risk" }, { status: 500 });
  }
}
