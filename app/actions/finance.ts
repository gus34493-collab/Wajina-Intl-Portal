"use server";

import type { FeeCategory } from "@prisma/client";
import prisma from "@/lib/prisma";
import { withTenantContext } from "@/lib/prisma-extension";
import { revalidatePath } from "next/cache";

/**
 * SCOPED FINANCE ACTIONS
 */
export async function getCampusPayments(user: any) {
  return withTenantContext(prisma, user, async () => {
    return prisma.payment.findMany({
      orderBy: { createdAt: 'desc' },
      include: { student: true }
    });
  });
}

export async function createPayment(
  data: {
    studentId: string;
    amount: number;
    category: string | FeeCategory;
    reference: string;
    sessionId: string;
  },
  user: any
) {
  return withTenantContext(prisma, user, async () => {
    const payment = await prisma.payment.create({
      data: {
        studentId: data.studentId,
        amount: data.amount,
        category: data.category as FeeCategory,
        reference: data.reference,
        sessionId: data.sessionId,
        status: "PENDING",
        campus: user.campus,
      },
      include: { student: true },
    });
    revalidatePath('/finance');
    return payment;
  });
}
