import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import {
  getAuthUser, unauthorized, badRequest, serverError, getIP,
} from "@/lib/api-auth";
import { audit } from "@/lib/audit";

export async function GET(req: NextRequest) {
  const user = await getAuthUser();
  if (!user) return unauthorized();

  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const where: Record<string, unknown> = {};

    if (user.role === "DIRECTOR") {
      // sees all
    } else if (user.role === "PARENT") {
      where.parentId = user.id;
    } else if (user.role === "TEACHER" || user.role === "FORM_TEACHER") {
      where.targetRole = user.role;
      if (user.campus) where.student = { campus: user.campus as any };
    } else {
      where.targetRole = { in: ["ADMIN", "VP_ADMIN", "PRINCIPAL", "HEAD_TEACHER", "VP_ACADEMICS", "DEAN_STUDENTS"] };
      if (user.campus) where.student = { campus: user.campus as any };
    }

    if (status) where.status = status;

    const complaints = await prisma.complaint.findMany({
      where,
      include: {
        parent: { select: { name: true } },
        student: { select: { name: true, campus: true } },
        resolver: { select: { name: true, role: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(complaints);
  } catch (err) {
    console.error("[complaints GET]", err);
    return serverError();
  }
}

export async function POST(req: NextRequest) {
  const user = await getAuthUser();
  if (!user) return unauthorized();

  try {
    const { subject, message, studentId, targetRole } = await req.json();
    if (!subject || !message) return badRequest("Subject and message are required.");

    const complaint = await prisma.complaint.create({
      data: { parentId: user.id, studentId, subject, message, targetRole },
    });

    audit(user.id, "SUBMIT_COMPLAINT", "Complaint", complaint.id, `Complaint submitted by ${user.name}`, getIP(req));
    return NextResponse.json(complaint, { status: 201 });
  } catch (err) {
    console.error("[complaints POST]", err);
    return serverError();
  }
}
