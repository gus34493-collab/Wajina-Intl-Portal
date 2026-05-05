import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";
import prisma from "@/lib/prisma";
import { cookies } from "next/headers";

if (!process.env.JWT_SECRET) throw new Error("JWT_SECRET environment variable is not set");
const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET);

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("wajina_token")?.value || cookieStore.get("wajina_access")?.value;

    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { payload } = await jwtVerify(token, JWT_SECRET);
    const userRole = payload.role as string;
    const userCampus = payload.campus as string;

    const allowedRoles = ["DIRECTOR", "PRINCIPAL", "HEAD_TEACHER", "VP_ADMIN", "HR", "DEAN_STUDENTS", "BURSAR"];
    if (!allowedRoles.includes(userRole)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    const body = await req.json();

    const currentAdmission = await prisma.admission.findUnique({ where: { id } });
    if (!currentAdmission) return NextResponse.json({ error: "Not found" }, { status: 404 });

    // Multi-tenant isolation for non-Director roles
    if (userRole !== "DIRECTOR" && currentAdmission.campus !== userCampus) {
      return NextResponse.json({ error: "Forbidden - Campus Mismatch" }, { status: 403 });
    }

    const dataToUpdate: any = {};
    if (body.entranceScore !== undefined) {
      dataToUpdate.entranceScore = parseFloat(body.entranceScore);
    }
    if (body.status !== undefined) {
      dataToUpdate.status = body.status;
    }
    if (body.isScholarshipEligible !== undefined) {
      dataToUpdate.isScholarshipEligible = body.isScholarshipEligible;
    }

    const updated = await prisma.admission.update({
      where: { id },
      data: dataToUpdate
    });

    return NextResponse.json({ success: true, admission: updated });
  } catch (err: any) {
    console.error("[API Admission Update PATCH] Failure:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
