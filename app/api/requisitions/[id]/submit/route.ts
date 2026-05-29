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
import { maskCurrencyIfNeeded } from "@/lib/requisitionAccess";

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
    if (existing.initiatorId !== user.id) return forbidden();
    if (existing.status !== "DRAFT")
      return NextResponse.json(
        { error: "Only DRAFT requisitions can be submitted." },
        { status: 409 }
      );

    const updated = await prisma.$transaction(async (tx) => {
      const result = await tx.requisition.update({
        where: { id },
        data: { status: "SUBMITTED", currentStage: "HEAD_TEACHER" },
        include: REQUISITION_INCLUDE,
      });
      await tx.auditLog.create({
        data: {
          actorId: user.id,
          action: "SUBMIT_REQUISITION",
          entity: "Requisition",
          entityId: id,
          detail: existing.refNo,
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
    console.error("[requisition submit POST]", err);
    return serverError();
  }
}
