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
import { nextStage, rolesForStage } from "@/lib/approvalChain";
import { sendPushToUser, sendPushToRole } from "@/lib/sendPushToUser";

async function pushRequisitionApproved(initiatorId: string, refNo: string, currentStage: string, campus: string, isLastStage: boolean) {
  if (isLastStage) {
    await sendPushToUser(initiatorId, { title: "Requisition Approved", body: `Requisition ${refNo} has been fully approved.`, href: "/requisitions" });
  } else {
    const roles = rolesForStage(currentStage);
    await Promise.all(roles.map((role) =>
      sendPushToRole(role, { title: "Requisition Awaiting Approval", body: `Requisition ${refNo} is now at your stage for review.`, href: "/requisitions" }, campus)
    ));
  }
}

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
    const existing = await (prisma as any).requisition.findUnique({
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
    const advance = nextStage(stage);

    const isLastStage = advance === "FULFILLED";
    const newStatus = isLastStage ? "APPROVED" : "IN_REVIEW";
    const newStage = isLastStage ? "FULFILLED" : (advance ?? stage);

    const updated = await prisma.$transaction(async (tx) => {
      await tx.requisitionApproval.upsert({
        where: { requisitionId_stage: { requisitionId: id, stage: stage as any } },
        create: {
          requisitionId: id,
          stage: stage as any,
          approverId: user.id,
          decision: "APPROVED",
          comment: comment ?? null,
        },
        update: {
          approverId: user.id,
          decision: "APPROVED",
          comment: comment ?? null,
          decidedAt: new Date(),
        },
      });
      const result = await tx.requisition.update({
        where: { id },
        data: { status: newStatus as any, currentStage: newStage as any },
        include: REQUISITION_INCLUDE,
      });
      await tx.auditLog.create({
        data: {
          actorId: user.id,
          action: "APPROVE_REQUISITION_STAGE",
          entity: "Requisition",
          entityId: id,
          detail: stage,
          campus: existing.campus,
          ipAddress: getIP(req),
        },
      });
      return result;
    });

    pushRequisitionApproved(updated.initiatorId, updated.refNo, updated.currentStage, existing.campus as string, isLastStage).catch(() => {});

    const masked = maskCurrencyIfNeeded(
      updated as unknown as Record<string, unknown>,
      user.role
    );

    return NextResponse.json(masked);
  } catch (err) {
    console.error("[requisition approve POST]", err);
    return serverError();
  }
}
