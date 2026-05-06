import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthUser, unauthorized, serverError } from "@/lib/api-auth";

export async function GET(req: NextRequest) {
  const user = await getAuthUser();
  if (!user) return unauthorized();

  try {
    const { searchParams } = new URL(req.url);
    const studentId = searchParams.get("studentId");
    const armId = searchParams.get("armId");
    const date = searchParams.get("date");
    const termId = searchParams.get("termId");
    const status = searchParams.get("status");
    const page = parseInt(searchParams.get("page") ?? "1");
    const limit = parseInt(searchParams.get("limit") ?? "50");
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};

    if (user.role === "STUDENT") {
      where.studentId = user.id;
    } else if (user.role === "PARENT") {
      const links = await prisma.studentParent.findMany({ where: { parentId: user.id }, select: { studentId: true } });
      where.studentId = { in: links.map((l) => l.studentId) };
    } else if (user.role === "TEACHER" || user.role === "FORM_TEACHER") {
      const arms = await prisma.classArm.findMany({ where: { teacherId: user.id }, select: { id: true } });
      where.student = { armId: { in: arms.map((a) => a.id) } };
    }

    // Campus enforcement for non-Director non-Parent staff
    if (user.role !== "DIRECTOR" && user.role !== "PARENT" && user.campus) {
      where.student = { ...(where.student as object | undefined ?? {}), campus: user.campus as any };
    }

    if (studentId) where.studentId = studentId;
    if (armId) where.armId = armId;
    if (termId) where.termId = termId;
    if (status) where.status = status;
    if (date) where.date = new Date(date);

    const [records, total] = await Promise.all([
      prisma.attendance.findMany({
        where,
        include: {
          student: { select: { id: true, name: true, enrolledArm: { select: { fullName: true } } } },
          markedBy: { select: { id: true, name: true } },
          term: { select: { id: true, name: true } },
        },
        orderBy: [{ date: "desc" }, { student: { name: "asc" } }],
        skip,
        take: limit,
      }),
      prisma.attendance.count({ where }),
    ]);

    return NextResponse.json({ records, total, page, limit });
  } catch (err) {
    console.error("[attendance GET]", err);
    return serverError();
  }
}
