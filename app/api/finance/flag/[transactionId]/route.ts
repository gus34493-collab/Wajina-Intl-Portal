import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthUser, unauthorized, forbidden, notFound, serverError } from "@/lib/api-auth";

const FINANCE_ROLES = ["DIRECTOR", "PRINCIPAL", "ACCOUNTS_OFFICER", "BURSAR"];

export async function PUT(req: NextRequest, { params }: { params: Promise<{ transactionId: string }> }) {
  const user = await getAuthUser();
  if (!user) return unauthorized();
  if (!FINANCE_ROLES.includes(user.role as string)) return forbidden();
  const { transactionId } = await params;

  try {
    const tx = await prisma.payment.findUnique({ where: { id: transactionId } });
    if (!tx) return notFound("Transaction not found.");

    const updated = await prisma.$transaction(async (p) => {
      await p.auditLog.create({
        data: {
          actorId: user.id, action: "FLAG_TRANSACTION", entity: "Payment",
          entityId: transactionId, detail: "Transaction flagged for review",
        },
      });
      return tx;
    });

    return NextResponse.json(updated);
  } catch (err) {
    console.error("[finance/flag PUT]", err);
    return serverError();
  }
}
