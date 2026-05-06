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
      const payment = await p.payment.update({ where: { id: transactionId }, data: { status: "CONFIRMED" } });
      await p.auditLog.create({
        data: {
          actorId: user.id, action: "APPROVE_PAYMENT", entity: "Payment",
          entityId: transactionId, detail: "Transaction approved",
        },
      });
      return payment;
    });

    return NextResponse.json(updated);
  } catch (err) {
    console.error("[finance/approve PUT]", err);
    return serverError();
  }
}
