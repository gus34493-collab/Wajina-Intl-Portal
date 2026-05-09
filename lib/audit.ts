import prisma from "@/lib/prisma";

/**
 * Fire-and-forget audit logger. Errors are swallowed to avoid
 * crashing the request; failures are logged to console only.
 */
export function audit(
  actorId: string | null,
  action: string,
  entity: string,
  entityId: string | null = null,
  detail: string | null = null,
  ipAddress: string | null = null
): void {
  const expiresAt = new Date();
  expiresAt.setFullYear(expiresAt.getFullYear() + 2);

  prisma.auditLog
    .create({ data: { actorId, action, entity, entityId, detail, ipAddress, expiresAt } })
    .catch((err) => console.error("[audit]", err.message));
}
