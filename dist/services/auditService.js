"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createAuditLog = void 0;
const prisma_1 = __importDefault(require("../prisma"));
const createAuditLog = async ({ action, entity, entityId, detail, actorId, oldValue = null, newValue = null }) => {
    await prisma_1.default.auditLog.create({
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
exports.createAuditLog = createAuditLog;
