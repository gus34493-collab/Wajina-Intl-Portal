import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthUser, hasRole, unauthorized, forbidden, serverError } from "@/lib/api-auth";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ studentId: string }> }
) {
  const user = await getAuthUser();
  if (!user) return unauthorized();
  if (!hasRole(user, "PARENT")) return forbidden();

  const { studentId } = await params;

  const link = await prisma.studentParent.findFirst({
    where: { studentId, parentId: user.id },
    select: { student: { select: { id: true, name: true } } },
  });
  if (!link) return forbidden("This student is not linked to your account.");
  const ward = link.student;

  try {
    const { searchParams } = new URL(req.url);
    const termId = searchParams.get("termId");
    const month = searchParams.get("month");
    const page = parseInt(searchParams.get("page") ?? "1");
    const limit = parseInt(searchParams.get("limit") ?? "60");
    const skip = (page - 1) * limit;

    let dateFilter = {};
    if (month) {
      const [year, mon] = month.split("-").map(Number);
      dateFilter = { gte: new Date(year, mon - 1, 1), lt: new Date(year, mon, 1) };
    }

    const where = {
      studentId,
      ...(termId && { termId }),
      ...(month && { date: dateFilter }),
    };

    const [records, total, present, absent] = await Promise.all([
      prisma.attendance.findMany({
        where,
        select: { id: true, date: true, status: true, note: true },
        orderBy: { date: "desc" },
        skip,
        take: limit,
      }),
      prisma.attendance.count({ where }),
      prisma.attendance.count({ where: { ...where, status: "PRESENT" } }),
      prisma.attendance.count({ where: { ...where, status: "ABSENT" } }),
    ]);

    return NextResponse.json({
      student: { id: ward.id, name: ward.name },
      records,
      total,
      present,
      absent,
      rate: total > 0 ? Math.round((present / total) * 100) : null,
      page,
      limit,
    });
  } catch (err) {
    console.error("[parent/wards/:studentId/attendance GET]", err);
    return serverError();
  }
}
