"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.audit = audit;
const prisma_1 = __importDefault(require("../prisma"));
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
async function audit(actorId, action, entity, entityId = null, detail = null, ipAddress = null) {
    // Set expiry for automatic retention cleanup (2 years from now)
    const expiresAt = new Date();
    expiresAt.setFullYear(expiresAt.getFullYear() + 2);
    prisma_1.default.auditLog.create({
        data: { actorId, action, entity, entityId, detail, ipAddress, expiresAt },
    }).catch((err) => {
        console.error('[audit] Failed to write audit log:', err.message);
    });
}
