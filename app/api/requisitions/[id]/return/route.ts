import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import {
  getAuthUser,
  unauthorized,
  forbidden,
  notFound,
  serverError,
  getIP,
} from "@/lib/api-auth";
import { canActOnStage, maskCurrencyIfNeeded } from "@/lib/requisitionAccess";

const REQUISITION_INCLUDE = {
  items: true,
  initiator: { select: { id: true, name: true, role: true, campus: true } },
  approvals: {
    include: { approver: { select: { name: true, role: true } } },
  },
} as const;

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthUser();
  if (!user) return unauthorized();
  const { id } = await params;

  try {
    const existing = await prisma.requisition.findUnique({
      where: { id },
    });

    if (!existing) return notFound();
    if (!canActOnStage(user.role, existing.currentStage))
      return forbidden("You are not authorised to act on this stage.");
    if (!["SUBMITTED", "IN_REVIEW"].includes(existing.status))
      return NextResponse.json(
        { error: "Requisition is not in a reviewable state." },
        { status: 409 }
      );

    const body = await req.json().catch(() => ({}));
    const comment: string | undefined = body.comment ?? undefined;

    const stage = existing.currentStage;

    const updated = await prisma.$transaction(async (tx) => {
      await tx.requisitionApproval.upsert({
        where: { requisitionId_stage: { requisitionId: id, stage: stage as any } },
        create: {
          requisitionId: id,
          stage: stage as any,
          approverId: user.id,
          decision: "RETURNED",
          comment: comment ?? null,
        },
        update: {
          approverId: user.id,
          decision: "RETURNED",
          comment: comment ?? null,
          decidedAt: new Date(),
        },
      });
      const result = await tx.requisition.update({
        where: { id },
        data: { status: "DRAFT", currentStage: "INITIATOR" },
        include: REQUISITION_INCLUDE,
      });
      await tx.auditLog.create({
        data: {
          actorId: user.id,
          action: "RETURN_REQUISITION",
          entity: "Requisition",
          entityId: id,
          detail: stage,
          campus: existing.campus,
          ipAddress: getIP(req),
        },
      });
      return result;
    });

    const masked = maskCurrencyIfNeeded(
      updated as unknown as Record<string, unknown>,
      user.role
    );

    return NextResponse.json(masked);
  } catch (err) {
    console.error("[requisition return POST]", err);
    return serverError();
  }
}
