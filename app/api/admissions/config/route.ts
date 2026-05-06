import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthUser, unauthorized, forbidden, serverError } from "@/lib/api-auth";

export async function GET(req: NextRequest) {
  try {
    const campus = new URL(req.url).searchParams.get("campus");
    if (campus) {
      const config = await prisma.admissionConfig.findUnique({ where: { campus: campus.toUpperCase() as any } });
      return NextResponse.json(config ?? { entranceFee: 25000, cutoffScore: 50, scholarshipScore: 90 });
    }
    return NextResponse.json(await prisma.admissionConfig.findMany());
  } catch (err) {
    console.error("[admissions/config GET]", err);
    return serverError();
  }
}

export async function PATCH(req: NextRequest) {
  const user = await getAuthUser();
  if (!user) return unauthorized();

  const role = user.role as string;
  const ALLOWED = ["DIRECTOR", "PRINCIPAL", "HEAD_TEACHER", "VP_ADMIN", "DEAN_STUDENTS"];
  if (!ALLOWED.includes(role)) return forbidden();

  try {
    const body = await req.json();
    const targetCampus = body.campus ?? (user.campus as string);

    if (body.entranceFee !== undefined && role !== "DIRECTOR") {
      return NextResponse.json({ error: "Only the Director can update the Entrance Fee." }, { status: 403 });
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
        scholarshipScore: data.scholarshipScore ?? 90,
      },
    });

    return NextResponse.json({ success: true, config: updated });
  } catch (err) {
    console.error("[admissions/config PATCH]", err);
    return serverError();
  }
}
