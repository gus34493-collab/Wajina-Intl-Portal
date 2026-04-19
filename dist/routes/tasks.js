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
const MANAGEMENT = (0, auth_1.requireRole)('DIRECTOR', 'PRINCIPAL', 'ADMIN_STAFF');
// ── GET /api/tasks ────────────────────────────────────────────────────────
router.get('/', auth_1.auth, MANAGEMENT, async (req, res, next) => {
    try {
        const { status } = req.query;
        const where = status ? { status: status.toUpperCase() } : {};
        const tasks = await prisma_1.default.task.findMany({
            where,
            orderBy: [{ dueDate: 'asc' }, { createdAt: 'desc' }],
            include: { createdBy: { select: { name: true } } },
        });
        res.json({ tasks });
    }
    catch (err) {
        next(err);
    }
});
// ── POST /api/tasks ───────────────────────────────────────────────────────
router.post('/', auth_1.auth, MANAGEMENT, async (req, res, next) => {
    try {
        const { title, owner, dueDate, status, riskLevel, progress, category } = req.body;
        if (!title || !owner) {
            return res.status(400).json({ error: 'title and owner are required' });
        }
        const task = await prisma_1.default.task.create({
            data: {
                title: title.trim().slice(0, 200),
                owner: owner.trim().slice(0, 100),
                dueDate: dueDate ? new Date(dueDate) : null,
                status: (status || 'ON_TRACK').toUpperCase(),
                riskLevel: (riskLevel || 'LOW').toUpperCase(),
                progress: Math.min(100, Math.max(0, parseInt(progress || 0))),
                category: category?.trim().slice(0, 100) || null,
                createdById: req.user.id,
            },
        });
        (0, audit_1.audit)(req.user.id, 'TASK_CREATED', 'Task', task.id, `Title: ${title}`, req.ip);
        res.status(201).json({ task });
    }
    catch (err) {
        next(err);
    }
});
// ── PATCH /api/tasks/:id ──────────────────────────────────────────────────
router.patch('/:id', auth_1.auth, MANAGEMENT, async (req, res, next) => {
    try {
        const { id } = req.params;
        const { title, owner, dueDate, status, riskLevel, progress, category } = req.body;
        const existing = await prisma_1.default.task.findUnique({ where: { id } });
        if (!existing)
            return res.status(404).json({ error: 'Task not found' });
        const updated = await prisma_1.default.task.update({
            where: { id },
            data: {
                ...(title && { title: title.trim().slice(0, 200) }),
                ...(owner && { owner: owner.trim().slice(0, 100) }),
                ...(dueDate !== undefined && { dueDate: dueDate ? new Date(dueDate) : null }),
                ...(status && { status: status.toUpperCase() }),
                ...(riskLevel && { riskLevel: riskLevel.toUpperCase() }),
                ...(progress !== undefined && { progress: Math.min(100, Math.max(0, parseInt(progress))) }),
                ...(category !== undefined && { category: category?.trim().slice(0, 100) || null }),
            },
        });
        (0, audit_1.audit)(req.user.id, 'TASK_UPDATED', 'Task', id, `Status: ${status || existing.status}`, req.ip);
        res.json({ task: updated });
    }
    catch (err) {
        next(err);
    }
});
// ── DELETE /api/tasks/:id ─────────────────────────────────────────────────
router.delete('/:id', auth_1.auth, MANAGEMENT, async (req, res, next) => {
    try {
        const { id } = req.params;
        const existing = await prisma_1.default.task.findUnique({ where: { id } });
        if (!existing)
            return res.status(404).json({ error: 'Task not found' });
        await prisma_1.default.task.delete({ where: { id } });
        (0, audit_1.audit)(req.user.id, 'TASK_DELETED', 'Task', id, `Title: ${existing.title}`, req.ip);
        res.json({ ok: true });
    }
    catch (err) {
        next(err);
    }
});
exports.default = router;
