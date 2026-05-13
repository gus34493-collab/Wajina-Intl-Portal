import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthUser, hasRole, unauthorized, forbidden, serverError } from "@/lib/api-auth";

const LEADERSHIP = ["DIRECTOR", "PRINCIPAL", "HEAD_TEACHER", "ASST_HEAD_TEACHER", "VP_ADMIN", "VP_ACADEMICS"] as const;

export async function PATCH(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthUser();
  if (!user) return unauthorized();
  if (!hasRole(user, ...LEADERSHIP)) return forbidden();

  const { id } = await params;

  try {
    const term = await prisma.term.findUnique({ where: { id }, select: { sessionId: true } });
    if (!term) return NextResponse.json({ error: "Term not found" }, { status: 404 });

    // Atomically deactivate all terms in session, then set this one as current
    await prisma.$transaction([
      prisma.term.updateMany({
        where: { sessionId: term.sessionId },
        data: { isCurrent: false },
      }),
      prisma.term.update({
        where: { id },
        data: { isCurrent: true },
      }),
    ]);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[terms/:id/activate PATCH]", err);
    return serverError();
  }
}
