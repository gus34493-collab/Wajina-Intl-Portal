import prisma from '../prisma';

/**
 * Centralised audit logging helper.
 * Writes are fire-and-forget but errors are logged to console.
 * @param {string} actorId
 * @param {string} action
 * @param {string} entity
 * @param {string|null} entityId
 * @param {string|null} detail
 * @param {string|null} ipAddress
 * @returns {Promise<void>}
 */
export async function audit(
  actorId: string | null, 
  action: string, 
  entity: string, 
  entityId: string | null = null, 
  detail: string | null = null, 
  ipAddress: string | null = null
) {
  // Set expiry for automatic retention cleanup (2 years from now)
  const expiresAt = new Date();
  expiresAt.setFullYear(expiresAt.getFullYear() + 2);

  prisma.auditLog.create({
    data: { actorId, action, entity, entityId, detail, ipAddress, expiresAt },
  }).catch((err: any) => {
    console.error('[audit] Failed to write audit log:', err.message);
  });
}
