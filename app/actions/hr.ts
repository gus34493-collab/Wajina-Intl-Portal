"use server";

import prisma from "@/lib/prisma";
import { withTenantContext } from "@/lib/prisma-extension";
import { revalidatePath } from "next/cache";

/**
 * SCOPED HR ACTIONS
 */
export async function getCampusStaff(user: any) {
  return withTenantContext(prisma, user, async () => {
    return prisma.user.findMany({
      where: {
        role: { notIn: ['STUDENT', 'PARENT'] }
      },
      orderBy: { name: 'asc' }
    });
  });
}

export async function updateStaffStatus(staffId: string, status: any, user: any) {
  return withTenantContext(prisma, user, async () => {
    const updated = await prisma.user.update({
      where: { id: staffId },
      data: { status }
    });
    revalidatePath('/hr');
    return updated;
  });
}
