import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthUser, unauthorized, serverError } from "@/lib/api-auth";

function periodDates(period: string): { gte: Date; lt: Date } | null {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const tomorrow = new Date(today); tomorrow.setDate(today.getDate() + 1);

  if (period === "day") {
    return { gte: today, lt: tomorrow };
  }
  if (period === "week") {
    const weekAgo = new Date(today); weekAgo.setDate(today.getDate() - 6);
    return { gte: weekAgo, lt: tomorrow };
  }
  if (period === "month") {
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    return { gte: monthStart, lt: tomorrow };
  }
  return null;
}

export async function GET(req: NextRequest) {
  const user = await getAuthUser();
  if (!user) return unauthorized();

  try {
    const { searchParams } = new URL(req.url);
    const armId    = searchParams.get("armId");
    const studentId = searchParams.get("studentId");
    const termId   = searchParams.get("termId");
    const month    = searchParams.get("month");   // YYYY-MM (legacy)
    const period   = searchParams.get("period");  // day | week | month | term
    const session  = searchParams.get("session"); // MORNING | CLOSING

    const where: Record<string, unknown> = {};

    // Role scoping
    if (user.role === "STUDENT") {
      where.studentId = user.id;
    } else if (user.role === "PARENT") {
      const links = await prisma.studentParent.findMany({
        where: { parentId: user.id },
        select: { studentId: true },
      });
      where.studentId = { in: links.map((l) => l.studentId) };
    }

    if (armId) where.armId = armId;
    if (studentId && user.role !== "STUDENT" && user.role !== "PARENT") {
      where.studentId = studentId;
    }
    if (session) where.session = session.toUpperCase();

    // Date filtering — period takes precedence over legacy month param
    if (period && period !== "term") {
      const range = periodDates(period);
      if (range) where.date = range;
    } else if (period === "term" && termId) {
      where.termId = termId;
    } else if (termId) {
      where.termId = termId;
    } else if (month) {
      const [year, mon] = month.split("-").map(Number);
      where.date = { gte: new Date(year, mon - 1, 1), lt: new Date(year, mon, 1) };
    }

    const [present, absent, late, total] = await Promise.all([
      (prisma.attendance as any).count({ where: { ...where, status: "PRESENT" } }),
      (prisma.attendance as any).count({ where: { ...where, status: "ABSENT" } }),
      (prisma.attendance as any).count({ where: { ...where, status: "LATE" } }),
      (prisma.attendance as any).count({ where }),
    ]);

    return NextResponse.json({
      present,
      absent,
      late,
      total,
      rate: total > 0 ? Math.round((present / total) * 100) : null,
    });
  } catch (err) {
    console.error("[attendance/summary GET]", err);
    return serverError();
  }
}
