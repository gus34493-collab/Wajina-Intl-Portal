import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthUser, unauthorized, forbidden, badRequest, serverError, getIP } from "@/lib/api-auth";

const MANAGEMENT = [
  "DIRECTOR", "PRINCIPAL", "ADMIN_STAFF", "HEAD_TEACHER", "ASST_HEAD_TEACHER",
  "VP_ADMIN", "VP_ACADEMICS", "BURSAR", "HR",
];
const ADMISSION_OFFICERS = ["DIRECTOR", "PRINCIPAL", "ADMIN_STAFF", "HEAD_TEACHER", "VP_ADMIN"];

export async function GET(req: NextRequest) {
  const user = await getAuthUser();
  if (!user) return unauthorized();
  if (!MANAGEMENT.includes(user.role as string)) return forbidden();

  try {
    const { searchParams } = new URL(req.url);
    const role = user.role as string;
    const status = searchParams.get("status");
    const type = searchParams.get("type");
    const sessionId = searchParams.get("sessionId");
    const campusFilter = role === "DIRECTOR" ? searchParams.get("campus") : (user.campus as string);
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
    const limit = Math.min(parseInt(searchParams.get("limit") ?? "100"), 200);
    const skip = (page - 1) * limit;

    const where: any = {};
    if (status) where.status = status.toUpperCase();
    if (type) where.type = type.toUpperCase();
    if (sessionId) where.sessionId = sessionId;
    if (campusFilter && campusFilter !== "ALL") where.campus = campusFilter.toUpperCase() as any;

    const [admissions, total] = await Promise.all([
      prisma.admission.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
        include: { session: { select: { name: true } } },
      }),
      prisma.admission.count({ where }),
    ]);

    return NextResponse.json({ admissions, total });
  } catch (err) {
    console.error("[admissions GET]", err);
    return serverError();
  }
}

export async function POST(req: NextRequest) {
  const user = await getAuthUser();
  if (!user) return unauthorized();
  if (!ADMISSION_OFFICERS.includes(user.role as string)) return forbidden();

  try {
    const { applicantName, campus, targetClass, type, parentName, parentPhone, parentEmail, notes, sessionId } = await req.json();
    if (!applicantName || !campus || !targetClass || !parentName || !parentPhone) {
      return badRequest("applicantName, campus, targetClass, parentName, and parentPhone are required.");
    }

    let targetSessionId = sessionId ?? null;
    if (!targetSessionId) {
      const current = await prisma.academicSession.findFirst({ where: { status: "ACTIVE" }, select: { id: true } });
      targetSessionId = current?.id ?? null;
    }

    const admission = await prisma.$transaction(async (tx) => {
      const created = await tx.admission.create({
        data: {
          applicantName: applicantName.trim().slice(0, 150),
          campus: campus.toUpperCase() as any,
          targetClass: targetClass.trim().slice(0, 50),
          type: ((type ?? "NEW").toUpperCase()) as any,
          parentName: parentName.trim().slice(0, 150),
          parentPhone: parentPhone.trim().slice(0, 30),
          parentEmail: parentEmail?.trim().slice(0, 150) ?? null,
          notes: notes?.trim().slice(0, 500) ?? null,
          sessionId: targetSessionId,
          status: "APPLIED",
        },
      });
      await tx.auditLog.create({
        data: {
          actorId: user.id, action: "ADMISSION_CREATED", entity: "Admission",
          entityId: created.id, detail: `Applicant: ${applicantName}`, ipAddress: getIP(req),
        },
      });
      return created;
    });

    return NextResponse.json({ admission }, { status: 201 });
  } catch (err) {
    console.error("[admissions POST]", err);
    return serverError();
  }
}
