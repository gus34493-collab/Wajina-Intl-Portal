import prisma from '../prisma';

export const createAuditLog = async ({ action, entity, entityId, detail, actorId, oldValue = null, newValue = null }: any) => {
  await prisma.auditLog.create({
    data: {
      action,
      entity,
      entityId: entityId || null,
      detail: detail || null,
      actorId,
      // Note: oldValue/newValue are accepted for caller compatibility
      // but not stored — the AuditLog model has no such columns.
    },
  });
};
