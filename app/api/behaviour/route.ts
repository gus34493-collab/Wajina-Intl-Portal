import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import {
  getAuthUser, hasRole, unauthorized, forbidden, badRequest, serverError, getIP,
} from "@/lib/api-auth";
import { audit } from "@/lib/audit";

const VALID_SEVERITIES = ["COMMENDATION", "LOW", "MEDIUM", "HIGH", "CRITICAL"];
const VALID_STATUSES = ["OPEN", "IN_REVIEW", "RESOLVED", "ESCALATED", "CLOSED"];

const RECORD_SELECT = {
  id: true, date: true, category: true, severity: true, description: true,
  actionTaken: true, status: true, formTeacherNote: true, principalNote: true,
  termId: true, sessionId: true, createdAt: true, updatedAt: true,
  student: { select: { id: true, name: true, role: true, enrolledArm: { select: { fullName: true } } } },
  reporter: { select: { id: true, name: true, role: true } },
};

export async function GET(req: NextRequest) {
  const user = await getAuthUser();
  if (!user) return unauthorized();

  try {
    const { searchParams } = new URL(req.url);
    const studentId = searchParams.get("studentId");
    const reporterId = searchParams.get("reporterId");
    const category = searchParams.get("category");
    const severity = searchParams.get("severity");
    const status = searchParams.get("status");
    const termId = searchParams.get("termId");
    const sessionId = searchParams.get("sessionId");
    const page = parseInt(searchParams.get("page") ?? "1");
    const limit = parseInt(searchParams.get("limit") ?? "50");
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};

    if (user.role === "PARENT") {
      const links = await prisma.studentParent.findMany({ where: { parentId: user.id }, select: { studentId: true } });
      where.studentId = { in: links.map((l) => l.studentId) };
    } else if (user.role === "STUDENT") {
      where.studentId = user.id;
    } else if (!["DIRECTOR", "PRINCIPAL"].includes(user.role)) {
      where.reporterId = user.id;
    }

    if (user.role !== "DIRECTOR" && user.role !== "PARENT" && user.campus) {
      where.student = { campus: user.campus as any };
    }

    if (studentId && ["DIRECTOR", "PRINCIPAL"].includes(user.role)) where.studentId = studentId;
    if (reporterId && ["DIRECTOR", "PRINCIPAL"].includes(user.role)) where.reporterId = reporterId;
    if (category) where.category = category;
    if (severity && VALID_SEVERITIES.includes(severity)) where.severity = severity;
    if (status && VALID_STATUSES.includes(status)) where.status = status;
    if (termId) where.termId = termId;
    if (sessionId) where.sessionId = sessionId;

    const [records, total] = await Promise.all([
      prisma.behaviourRecord.findMany({ where, select: RECORD_SELECT, orderBy: { date: "desc" }, skip, take: limit }),
      prisma.behaviourRecord.count({ where }),
    ]);

    return NextResponse.json({ records, total, page, limit });
  } catch (err) {
    console.error("[behaviour GET]", err);
    return serverError();
  }
}

export async function POST(req: NextRequest) {
  const user = await getAuthUser();
  if (!user) return unauthorized();
  if (!hasRole(user, "DIRECTOR", "PRINCIPAL", "TEACHER", "FORM_TEACHER", "ADMIN_STAFF")) return forbidden();

  try {
    const { studentId, date, category, severity, description, actionTaken, termId, sessionId } = await req.json();

    if (!studentId || !date || !category || !severity || !description) {
      return badRequest("studentId, date, category, severity and description are required");
    }
    if (!VALID_SEVERITIES.includes(severity)) return badRequest("Invalid severity");

    const student = await prisma.user.findUnique({ where: { id: studentId } });
    if (!student || student.role !== "STUDENT") return badRequest("Student not found");

    if (user.role !== "DIRECTOR" && user.campus && student.campus !== user.campus) {
      return forbidden("Student belongs to another campus.");
    }

    const record = await prisma.behaviourRecord.create({
      data: {
        studentId, reporterId: user.id, date: new Date(date), category, severity, description,
        ...(actionTaken && { actionTaken }),
        ...(termId && { termId }),
        ...(sessionId && { sessionId }),
      },
      select: RECORD_SELECT,
    });

    audit(user.id, "BEHAVIOUR_CREATED", "BehaviourRecord", record.id, `${severity} record filed for ${student.name}`, getIP(req));
    return NextResponse.json(record, { status: 201 });
  } catch (err) {
    console.error("[behaviour POST]", err);
    return serverError();
  }
}
