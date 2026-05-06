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
    const status = searchParams.get("status");
    const page = parseInt(searchParams.get("page") ?? "1");
    const limit = parseInt(searchParams.get("limit") ?? "25");
    const skip = (page - 1) * limit;

    const where: any = { studentId, ...(status && { status }) };

    const [records, total] = await Promise.all([
      prisma.behaviourRecord.findMany({
        where,
        select: {
          id: true,
          date: true,
          category: true,
          severity: true,
          description: true,
          actionTaken: true,
          status: true,
          principalNote: true,
          reporter: { select: { name: true, role: true } },
          termId: true,
        },
        orderBy: { date: "desc" },
        skip,
        take: limit,
      }),
      prisma.behaviourRecord.count({ where }),
    ]);

    return NextResponse.json({ student: { id: ward.id, name: ward.name }, records, total, page, limit });
  } catch (err) {
    console.error("[parent/wards/:studentId/behaviour GET]", err);
    return serverError();
  }
}
