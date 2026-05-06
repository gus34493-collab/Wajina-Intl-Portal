import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthUser, unauthorized, serverError } from "@/lib/api-auth";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ teacherId: string }> }
) {
  const user = await getAuthUser();
  if (!user) return unauthorized();

  const { teacherId } = await params;

  try {
    const appraisals = await prisma.teacherAppraisal.findMany({
      where: { teacherId },
      include: { evaluator: { select: { name: true, role: true } } },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ appraisals });
  } catch (err) {
    console.error("[hr/appraisals/:teacherId GET]", err);
    return serverError();
  }
}
