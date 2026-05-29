import type { PrismaClient } from "@prisma/client";

export async function generateRequisitionRefNo(
  prisma: PrismaClient
): Promise<string> {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const prefix = `REQ-${year}${month}-`;

  const latest = await (prisma as PrismaClient).requisition.findFirst({
    where: { refNo: { startsWith: prefix } },
    orderBy: { refNo: "desc" },
    select: { refNo: true },
  });

  let seq = 1;
  if (latest?.refNo) {
    const parts = latest.refNo.split("-");
    const last = parseInt(parts[parts.length - 1], 10);
    if (!isNaN(last)) seq = last + 1;
  }

  return prefix + String(seq).padStart(4, "0");
}
