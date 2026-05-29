import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import {
  getAuthUser,
  unauthorized,
  forbidden,
  badRequest,
  notFound,
  serverError,
} from "@/lib/api-auth";
import { scopeForRole, maskCurrencyIfNeeded } from "@/lib/requisitionAccess";
import { numberToWords } from "@/lib/numberToWords";

const REQUISITION_INCLUDE = {
  items: true,
  initiator: { select: { id: true, name: true, role: true, campus: true } },
  approvals: {
    include: { approver: { select: { name: true, role: true } } },
  },
} as const;

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthUser();
  if (!user) return unauthorized();
  const { id } = await params;

  try {
    const scope = scopeForRole(user.id, user.role, user.campus);
    const requisition = await prisma.requisition.findFirst({
      where: { id, ...scope },
      include: REQUISITION_INCLUDE,
    });

    if (!requisition) return notFound();

    const masked = maskCurrencyIfNeeded(
      requisition as unknown as Record<string, unknown>,
      user.role
    );

    return NextResponse.json(masked);
  } catch (err) {
    console.error("[requisition GET]", err);
    return serverError();
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthUser();
  if (!user) return unauthorized();
  const { id } = await params;

  try {
    const existing = await prisma.requisition.findUnique({
      where: { id },
      include: { items: true },
    });

    if (!existing) return notFound();
    if (existing.initiatorId !== user.id) return forbidden();
    if (existing.status !== "DRAFT")
      return NextResponse.json(
        { error: "Requisition can only be edited while in DRAFT status." },
        { status: 409 }
      );

    const body = await req.json();
    const { department, priority, justification, items } = body;

    const updateData: Record<string, unknown> = {};
    if (department !== undefined) updateData.department = department.trim();
    if (priority !== undefined) updateData.priority = priority.toUpperCase();
    if (justification !== undefined)
      updateData.justification = justification.trim();

    if (items !== undefined) {
      if (!Array.isArray(items) || items.length === 0)
        return badRequest("items must be a non-empty array.");

      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (!item.description?.trim())
          return badRequest(`items[${i}].description is required.`);
        if (!Number.isInteger(item.quantity) || item.quantity < 1)
          return badRequest(`items[${i}].quantity must be an integer >= 1.`);
        if (typeof item.unitCost !== "number" || item.unitCost < 0)
          return badRequest(`items[${i}].unitCost must be a number >= 0.`);
      }

      const computedItems = items.map(
        (
          item: { sn?: number; description: string; quantity: number; unitCost: number },
          idx: number
        ) => ({
          sn: item.sn ?? idx + 1,
          description: item.description.trim(),
          quantity: item.quantity,
          unitCost: item.unitCost,
          totalCost: item.quantity * item.unitCost,
        })
      );

      const amountTotal = computedItems.reduce((sum, i) => sum + i.totalCost, 0);
      updateData.amountTotal = amountTotal;
      updateData.amountInWords = numberToWords(amountTotal);
      updateData.items = {
        deleteMany: {},
        create: computedItems,
      };
    }

    const updated = await prisma.requisition.update({
      where: { id },
      data: updateData as any,
      include: REQUISITION_INCLUDE,
    });

    const masked = maskCurrencyIfNeeded(
      updated as unknown as Record<string, unknown>,
      user.role
    );

    return NextResponse.json(masked);
  } catch (err) {
    console.error("[requisition PATCH]", err);
    return serverError();
  }
}
