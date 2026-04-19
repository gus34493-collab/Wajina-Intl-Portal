import express from 'express';
import prisma from '../prisma';
import { auth, requireRole } from '../middleware/auth';
import { audit } from '../middleware/audit';

const router = express.Router();
const MANAGEMENT = requireRole('DIRECTOR', 'PRINCIPAL', 'ADMIN_STAFF');

// ── GET /api/tasks ────────────────────────────────────────────────────────
router.get('/', auth, MANAGEMENT, async (req: any, res, next) => {
  try {
    const { status } = req.query;
    const where = status ? { status: (status as string).toUpperCase() } : {};

    const tasks = await prisma.task.findMany({
      where,
      orderBy: [{ dueDate: 'asc' }, { createdAt: 'desc' }],
      include: { createdBy: { select: { name: true } } },
    });

    res.json({ tasks });
  } catch (err: any) {
    next(err);
  }
});

// ── POST /api/tasks ───────────────────────────────────────────────────────
router.post('/', auth, MANAGEMENT, async (req: any, res, next) => {
  try {
    const { title, owner, dueDate, status, riskLevel, progress, category } = req.body;

    if (!title || !owner) {
      return res.status(400).json({ error: 'title and owner are required' });
    }

    const task = await prisma.task.create({
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

    audit(req.user.id, 'TASK_CREATED', 'Task', task.id, `Title: ${title}`, req.ip);
    res.status(201).json({ task });
  } catch (err: any) {
    next(err);
  }
});

// ── PATCH /api/tasks/:id ──────────────────────────────────────────────────
router.patch('/:id', auth, MANAGEMENT, async (req: any, res, next) => {
  try {
    const { id } = req.params;
    const { title, owner, dueDate, status, riskLevel, progress, category } = req.body;

    const existing = await prisma.task.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ error: 'Task not found' });

    const updated = await prisma.task.update({
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

    audit(req.user.id, 'TASK_UPDATED', 'Task', id, `Status: ${status || existing.status}`, req.ip);
    res.json({ task: updated });
  } catch (err: any) {
    next(err);
  }
});

// ── DELETE /api/tasks/:id ─────────────────────────────────────────────────
router.delete('/:id', auth, MANAGEMENT, async (req: any, res, next) => {
  try {
    const { id } = req.params;
    const existing = await prisma.task.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ error: 'Task not found' });

    await prisma.task.delete({ where: { id } });
    audit(req.user.id, 'TASK_DELETED', 'Task', id, `Title: ${existing.title}`, req.ip);
    res.json({ ok: true });
  } catch (err: any) {
    next(err);
  }
});

export default router;
