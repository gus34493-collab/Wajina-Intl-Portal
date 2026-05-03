"use server";

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

export async function createPayment(data: any, user: any) {
  return withTenantContext(prisma, user, async () => {
    const payment = await prisma.payment.create({
      data: {
        ...data,
      }
    });
    revalidatePath('/finance');
    return payment;
  });
}
