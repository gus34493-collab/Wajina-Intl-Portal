import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import {
  getAuthUser, hasRole, unauthorized, forbidden, notFound, badRequest, serverError, getIP,
} from "@/lib/api-auth";
import { audit } from "@/lib/audit";

const VALID_STATUSES = ["OPEN", "IN_REVIEW", "RESOLVED", "ESCALATED", "CLOSED"];

const RECORD_SELECT = {
  id: true, date: true, category: true, severity: true, description: true,
  actionTaken: true, status: true, formTeacherNote: true, principalNote: true,
  termId: true, sessionId: true, createdAt: true, updatedAt: true,
  student: { select: { id: true, name: true, role: true, enrolledArm: { select: { fullName: true } } } },
  reporter: { select: { id: true, name: true, role: true } },
};

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthUser();
  if (!user) return unauthorized();

  const { id } = await params;

  try {
    const record = await prisma.behaviourRecord.findUnique({ where: { id }, select: RECORD_SELECT });
    if (!record) return notFound("Record not found");

    if (user.role === "STUDENT" && record.student.id !== user.id) return forbidden();
    if (user.role === "PARENT") {
      const link = await prisma.studentParent.findFirst({ where: { parentId: user.id, studentId: record.student.id } });
      if (!link) return forbidden();
    }
    if (!["DIRECTOR", "PRINCIPAL", "PARENT", "STUDENT"].includes(user.role)) {
      if ((record.reporter as any).id !== user.id) return forbidden();
    }

    return NextResponse.json(record);
  } catch (err) {
    console.error("[behaviour/:id GET]", err);
    return serverError();
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthUser();
  if (!user) return unauthorized();

  const { id } = await params;

  try {
    const existing = await prisma.behaviourRecord.findUnique({ where: { id } });
    if (!existing) return notFound("Record not found");

    const isManagement = ["DIRECTOR", "PRINCIPAL"].includes(user.role);
    const isReporter = existing.reporterId === user.id;
    if (!isManagement && !isReporter) return forbidden();

    const { description, actionTaken, formTeacherNote, principalNote, status } = await req.json();
    const data: Record<string, unknown> = {};

    if (isReporter && existing.status === "OPEN") {
      if (description !== undefined) data.description = description;
      if (actionTaken !== undefined) data.actionTaken = actionTaken;
    }
    if (formTeacherNote !== undefined) data.formTeacherNote = formTeacherNote;
    if (isManagement) {
      if (principalNote !== undefined) data.principalNote = principalNote;
      if (status && VALID_STATUSES.includes(status)) data.status = status;
    }

    if (Object.keys(data).length === 0) return badRequest("No valid fields to update");

    const updated = await prisma.behaviourRecord.update({ where: { id }, data, select: RECORD_SELECT });
    audit(user.id, "BEHAVIOUR_UPDATED", "BehaviourRecord", id, `Status: ${updated.status}`, getIP(req));
    return NextResponse.json(updated);
  } catch (err) {
    console.error("[behaviour/:id PATCH]", err);
    return serverError();
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthUser();
  if (!user) return unauthorized();
  if (!hasRole(user, "DIRECTOR", "PRINCIPAL")) return forbidden();

  const { id } = await params;

  try {
    const existing = await prisma.behaviourRecord.findUnique({ where: { id } });
    if (!existing) return notFound("Record not found");

    await prisma.behaviourRecord.delete({ where: { id } });
    audit(user.id, "BEHAVIOUR_DELETED", "BehaviourRecord", id, "Record deleted", getIP(req));
    return NextResponse.json({ message: "Record deleted" });
  } catch (err) {
    console.error("[behaviour/:id DELETE]", err);
    return serverError();
  }
}
