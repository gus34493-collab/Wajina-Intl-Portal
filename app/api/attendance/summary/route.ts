import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthUser, unauthorized, serverError } from "@/lib/api-auth";

export async function GET(req: NextRequest) {
  const user = await getAuthUser();
  if (!user) return unauthorized();

  try {
    const { searchParams } = new URL(req.url);
    const armId = searchParams.get("armId");
    const studentId = searchParams.get("studentId");
    const termId = searchParams.get("termId");
    const month = searchParams.get("month");

    const where: Record<string, unknown> = {};

    if (user.role === "STUDENT") {
      where.studentId = user.id;
    } else if (user.role === "PARENT") {
      const links = await prisma.studentParent.findMany({ where: { parentId: user.id }, select: { studentId: true } });
      where.studentId = { in: links.map((l) => l.studentId) };
    }

    if (armId) where.armId = armId;
    if (studentId && user.role !== "STUDENT" && user.role !== "PARENT") where.studentId = studentId;
    if (termId) where.termId = termId;
    if (month) {
      const [year, mon] = month.split("-").map(Number);
      where.date = { gte: new Date(year, mon - 1, 1), lt: new Date(year, mon, 1) };
    }

    const [present, absent, total] = await Promise.all([
      prisma.attendance.count({ where: { ...where, status: "PRESENT" } }),
      prisma.attendance.count({ where: { ...where, status: "ABSENT" } }),
      prisma.attendance.count({ where }),
    ]);

    return NextResponse.json({ present, absent, total, rate: total > 0 ? Math.round((present / total) * 100) : null });
  } catch (err) {
    console.error("[attendance/summary GET]", err);
    return serverError();
  }
}
