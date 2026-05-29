export async function generateRequisitionRefNo(tx: any): Promise<string> {
  const now = new Date();
  const datePart = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}`;
  const count = await tx.requisition.count();
  const sequence = String(count + 1).padStart(4, "0");
  return `REQ-${datePart}-${sequence}`;
}
