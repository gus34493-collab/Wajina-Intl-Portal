import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import {
  getAuthUser,
  unauthorized,
  forbidden,
  badRequest,
  serverError,
  getIP,
} from "@/lib/api-auth";
import { scopeForRole, maskCurrencyIfNeeded } from "@/lib/requisitionAccess";
import { generateRequisitionRefNo } from "@/lib/requisitionRefNo";
import { numberToWords } from "@/lib/numberToWords";

const BLOCKED_ROLES = new Set(["PARENT", "STUDENT"]);

const REQUISITION_INCLUDE = {
  items: true,
  initiator: { select: { id: true, name: true, role: true, campus: true } },
  approvals: {
    include: { approver: { select: { name: true, role: true } } },
  },
} as const;

export async function GET(req: NextRequest) {
  const user = await getAuthUser();
  if (!user) return unauthorized();

  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const campusParam = searchParams.get("campus");
    const limit = Math.min(parseInt(searchParams.get("limit") ?? "20"), 50);
    const page = Math.max(parseInt(searchParams.get("page") ?? "0"), 0);

    const scope = scopeForRole(user.id, user.role, user.campus);
    const where: Record<string, unknown> = { ...scope };

    if (status) {
      const statuses = status
        .split(",")
        .map((value) => value.trim().toUpperCase())
        .filter(Boolean);
      where.status = statuses.length > 1 ? { in: statuses } : statuses[0];
    }

    if (user.role === "DIRECTOR" && campusParam) {
      where.campus = campusParam.toUpperCase();
    }

    const [requisitions, total] = await Promise.all([
      prisma.requisition.findMany({
        where,
        include: REQUISITION_INCLUDE,
        orderBy: { createdAt: "desc" },
        skip: page * limit,
        take: limit,
      }),
      prisma.requisition.count({ where }),
    ]);

    const masked = requisitions.map((r) =>
      maskCurrencyIfNeeded(r as unknown as Record<string, unknown>, user.role)
    );

    return NextResponse.json({ requisitions: masked, total, page, limit });
  } catch (err) {
    console.error("[requisitions GET]", err);
    return serverError();
  }
}

export async function POST(req: NextRequest) {
  const user = await getAuthUser();
  if (!user) return unauthorized();
  if (BLOCKED_ROLES.has(user.role)) return forbidden();

  try {
    const body = await req.json();
    const { title, department, priority, justification, items, campus: campusParam } = body;

    if (!title?.trim()) return badRequest ("title is required.")
    if (!department?.trim()) return badRequest("department is required.");
    if (!justification?.trim()) return badRequest("justification is required.");
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

    let campus: string;
    if (user.role === "DIRECTOR") {
      if (!campusParam) return badRequest("DIRECTOR must specify campus.");
      campus = campusParam.toUpperCase();
    } else {
      campus = campusParam ? campusParam.toUpperCase() : (user as any).campus;
    }

    const computedItems = items.map((item: { sn?: number; description: string; quantity: number; unitCost: number }, idx: number) => ({
      sn: item.sn ?? idx + 1,
      description: item.description.trim(),
      quantity: item.quantity,
      unitCost: item.unitCost,
      totalCost: item.quantity * item.unitCost,
    }));

    const amountTotal = computedItems.reduce((sum, i) => sum + i.totalCost, 0);
    const amountInWords = numberToWords(amountTotal);

    const requisition = await prisma.$transaction(async (tx) => {
      const refNo = await generateRequisitionRefNo(tx as typeof prisma);
      const created = await tx.requisition.create({
        data: {
          refNo,
          title: title.trim(),
          campus: (user as any).campus, // Always set campus to user's campus for data integrity; directors can filter by campus when fetching
          department: department.trim(),
          initiatorId: user.id,
          requestedBy: user.id,
          priority: priority?.toUpperCase() ?? "WEEK_1",
          justification: justification.trim(),
          amount: amountTotal,
          amountTotal,
          amountInWords,
          status: "DRAFT",
          currentStage: "INITIATOR",
          items: {
            create: computedItems,
          },
        },
        include: REQUISITION_INCLUDE,
      });
      await tx.auditLog.create({
        data: {
          actorId: user.id,
          action: "CREATE_REQUISITION",
          entity: "Requisition",
          entityId: created.id,
          detail: refNo,
          campus: campus as any,
          ipAddress: getIP(req),
        },
      });
      return created;
    });

    return NextResponse.json(requisition, { status: 201 });
  } catch (err) {
    console.error("[requisitions POST]", err);
    return serverError();
  }
}
