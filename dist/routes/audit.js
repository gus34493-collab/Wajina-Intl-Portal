"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const prisma_1 = __importDefault(require("../prisma"));
const auth_1 = require("../middleware/auth");
const router = express_1.default.Router();
// GET /api/audit
// Directors can see all; Principals see non-Director actions
router.get('/', auth_1.auth, (0, auth_1.requireRole)('DIRECTOR', 'PRINCIPAL'), async (req, res, next) => {
    try {
        const { actorId, action, entity, from, to, page = 1, limit = 100 } = req.query;
        const skip = (parseInt(page) - 1) * parseInt(limit);
        const where = {
            ...(actorId && { actorId }),
            ...(action && { action: { contains: action, mode: 'insensitive' } }),
            ...(entity && { entity: { contains: entity, mode: 'insensitive' } }),
            ...((from || to) && {
                createdAt: {
                    ...(from && { gte: new Date(from) }),
                    ...(to && { lte: new Date(to) }),
                },
            }),
            // Principals cannot see Director-level audit entries
            ...(req.user.role === 'PRINCIPAL' && {
                NOT: {
                    actor: { role: 'DIRECTOR' },
                },
            }),
        };
        const [logs, total] = await Promise.all([
            prisma_1.default.auditLog.findMany({
                where,
                orderBy: { createdAt: 'desc' },
                skip,
                take: parseInt(limit),
                include: {
                    actor: { select: { id: true, name: true, role: true } },
                },
            }),
            prisma_1.default.auditLog.count({ where }),
        ]);
        res.json({ logs, total, page: parseInt(page), limit: parseInt(limit) });
    }
    catch (err) {
        next(err);
    }
});
// GET /api/audit/actions — distinct action types for filter dropdowns
router.get('/actions', auth_1.auth, (0, auth_1.requireRole)('DIRECTOR', 'PRINCIPAL'), async (req, res, next) => {
    try {
        const rows = await prisma_1.default.auditLog.findMany({
            distinct: ['action'],
            select: { action: true },
            orderBy: { action: 'asc' },
        });
        res.json(rows.map(r => r.action));
    }
    catch (err) {
        next(err);
    }
});
exports.default = router;
