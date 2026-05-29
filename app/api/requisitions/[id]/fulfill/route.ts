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

const FULFILLER_ROLES = new Set(["BURSAR", "ACCOUNTS_OFFICER"]);

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
  if (!FULFILLER_ROLES.has(user.role)) return forbidden();
  const { id } = await params;

  try {
    const existing = await prisma.requisition.findUnique({
      where: { id },
    });

    if (!existing) return notFound();
    if (existing.status !== "APPROVED")
      return NextResponse.json(
        { error: "Only APPROVED requisitions can be fulfilled." },
        { status: 409 }
      );

    const updated = await prisma.$transaction(async (tx) => {
      const result = await tx.requisition.update({
        where: { id },
        data: {
          status: "FULFILLED",
          fulfilledAt: new Date(),
          fulfilledById: user.id,
          currentStage: "FULFILLED",
        },
        include: REQUISITION_INCLUDE,
      });
      await tx.auditLog.create({
        data: {
          actorId: user.id,
          action: "FULFILL_REQUISITION",
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
    console.error("[requisition fulfill POST]", err);
    return serverError();
  }
}
