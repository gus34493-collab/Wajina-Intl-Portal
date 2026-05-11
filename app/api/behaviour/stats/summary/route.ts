import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import {
  getAuthUser, hasRole, unauthorized, forbidden, serverError,
} from "@/lib/api-auth";

export async function GET(req: NextRequest) {
  const user = await getAuthUser();
  if (!user) return unauthorized();
  if (!hasRole(user, "DIRECTOR", "PRINCIPAL", "TEACHER", "FORM_TEACHER")) return forbidden();

  try {
    const { searchParams } = new URL(req.url);
    const studentId = searchParams.get("studentId");
    const termId = searchParams.get("termId");
    const sessionId = searchParams.get("sessionId");

    const where: Record<string, unknown> = {
      ...(studentId && { studentId }),
      ...(termId && { termId }),
      ...(sessionId && { sessionId }),
    };

    if (!["DIRECTOR", "PRINCIPAL"].includes(user.role)) {
      where.reporterId = user.id;
    }

    const rows = await prisma.behaviourRecord.groupBy({
      by: ["severity"],
      where,
      _count: { id: true },
    });

    const counts: Record<string, number> = {};
    for (const r of rows) counts[r.severity] = r._count.id;
    return NextResponse.json(counts);
  } catch (err) {
    console.error("[behaviour/stats/summary GET]", err);
    return serverError();
  }
}
