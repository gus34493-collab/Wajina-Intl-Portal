import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";
import prisma from "@/lib/prisma";
import { cookies } from "next/headers";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "fallback-secret-for-development-only"
);

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const campus = searchParams.get("campus");

    if (campus) {
      const config = await prisma.admissionConfig.findUnique({
        where: { campus: campus.toUpperCase() as any }
      });
      return NextResponse.json(config || { entranceFee: 25000, cutoffScore: 50, scholarshipScore: 90 });
    }

    const configs = await prisma.admissionConfig.findMany();
    return NextResponse.json(configs);
  } catch (err: any) {
    console.error("[API Admissions Config GET] Failure:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("wajina_token")?.value || cookieStore.get("wajina_access")?.value;

    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { payload } = await jwtVerify(token, JWT_SECRET);
    const userRole = payload.role as string;
    const userCampus = payload.campus as string;

    const allowedRoles = ["DIRECTOR", "PRINCIPAL", "HEAD_TEACHER", "VP_ADMIN", "DEAN_STUDENTS"];
    if (!allowedRoles.includes(userRole)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const targetCampus = body.campus || userCampus;

    // Director can update entranceFee. Others can't.
    if (body.entranceFee !== undefined && userRole !== "DIRECTOR") {
       return NextResponse.json({ error: "Only Director can update Entrance Fee." }, { status: 403 });
    }

    const data: any = {};
    if (body.entranceFee !== undefined) data.entranceFee = parseFloat(body.entranceFee);
    if (body.deadline !== undefined) data.deadline = body.deadline ? new Date(body.deadline) : null;
    if (body.cutoffScore !== undefined) data.cutoffScore = parseFloat(body.cutoffScore);
    if (body.scholarshipScore !== undefined) data.scholarshipScore = parseFloat(body.scholarshipScore);

    const updated = await prisma.admissionConfig.upsert({
      where: { campus: targetCampus.toUpperCase() as any },
      update: data,
      create: {
        campus: targetCampus.toUpperCase() as any,
        ...data,
        entranceFee: data.entranceFee ?? 25000,
        cutoffScore: data.cutoffScore ?? 50,
        scholarshipScore: data.scholarshipScore ?? 90
      }
    });

    return NextResponse.json({ success: true, config: updated });
  } catch (err: any) {
    console.error("[API Admissions Config PATCH] Failure:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
