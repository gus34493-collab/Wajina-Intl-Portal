"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const prisma_1 = __importDefault(require("../prisma"));
const auth_1 = require("../middleware/auth");
const audit_1 = require("../middleware/audit");
const router = express_1.default.Router();
const MANAGEMENT = (0, auth_1.requireRole)('DIRECTOR', 'PRINCIPAL', 'ADMIN_STAFF', 'ACADEMIC_STAFF', 'TEACHER');
// ── GET /api/requests/count – KPI summary counts ──────────────────────────
router.get('/count', auth_1.auth, async (req, res, next) => {
    try {
        const [pending, approved, denied, total] = await Promise.all([
            prisma_1.default.request.count({ where: { status: 'PENDING' } }),
            prisma_1.default.request.count({ where: { status: 'APPROVED' } }),
            prisma_1.default.request.count({ where: { status: 'DENIED' } }),
            prisma_1.default.request.count(),
        ]);
        res.json({ pending, approved, denied, total });
    }
    catch (err) {
        next(err);
    }
});
// ── GET /api/requests – list all requests (management view) ───────────────
router.get('/', auth_1.auth, MANAGEMENT, async (req, res, next) => {
    try {
        const { status, level, page = 1, limit = 200 } = req.query;
        const skip = (parseInt(page) - 1) * parseInt(limit);
        const where = {};
        if (status)
            where.status = status.toUpperCase();
        if (level)
            where.level = level.toUpperCase();
        const [requests, total] = await Promise.all([
            prisma_1.default.request.findMany({
                where,
                include: {
                    sender: { select: { id: true, name: true, role: true, campus: true } },
                    receiver: { select: { id: true, name: true, role: true } },
                },
                orderBy: { createdAt: 'desc' },
                skip,
                take: parseInt(limit),
            }),
            prisma_1.default.request.count({ where }),
        ]);
        res.json({ requests, total });
    }
    catch (err) {
        next(err);
    }
});
// ── POST /api/requests – submit a new request (any authenticated user) ────
router.post('/', auth_1.auth, async (req, res, next) => {
    try {
        const { level, title, description } = req.body;
        if (!level || !title || !description) {
            return res.status(400).json({ error: 'level, title, and description are required' });
        }
        const validLevels = ['K1', 'K2', 'K3'];
        if (!validLevels.includes(level)) {
            return res.status(400).json({ error: 'Invalid level. Must be K1, K2, or K3' });
        }
        const request = await prisma_1.default.request.create({
            data: {
                level,
                title: title.trim().slice(0, 200),
                description: description.trim().slice(0, 2000),
                status: 'PENDING',
                senderId: req.user.id,
            },
            include: { sender: { select: { id: true, name: true, role: true } } },
        });
        (0, audit_1.audit)(req.user.id, 'REQUEST_SUBMITTED', 'Request', request.id, `Title: ${title}`, req.ip);
        res.status(201).json({ request });
    }
    catch (err) {
        next(err);
    }
});
// ── PATCH /api/requests/:id – approve, deny, or forward ──────────────────
router.patch('/:id', auth_1.auth, MANAGEMENT, async (req, res, next) => {
    try {
        const { id } = req.params;
        const { action, reason } = req.body;
        const existing = await prisma_1.default.request.findUnique({ where: { id } });
        if (!existing)
            return res.status(404).json({ error: 'Request not found' });
        let data = {};
        if (action === 'approve') {
            data = { status: 'APPROVED' };
        }
        else if (action === 'deny') {
            data = { status: 'DENIED' };
        }
        else if (action === 'forward') {
            data = { isForwarded: true, receiverId: req.user.id };
        }
        else {
            return res.status(400).json({ error: 'action must be approve, deny, or forward' });
        }
        const updated = await prisma_1.default.request.update({
            where: { id },
            data,
            include: { sender: { select: { id: true, name: true, role: true } } },
        });
        (0, audit_1.audit)(req.user.id, `REQUEST_${action.toUpperCase()}D`, 'Request', id, reason || '', req.ip);
        res.json({ request: updated });
    }
    catch (err) {
        next(err);
    }
});
exports.default = router;
