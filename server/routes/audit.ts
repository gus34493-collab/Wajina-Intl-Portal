import express from 'express';
import prisma from '../prisma';
import { auth, requireRole } from '../middleware/auth';

const router = express.Router();

// GET /api/audit
// Directors can see all; Principals see non-Director actions
router.get('/', auth, requireRole('DIRECTOR', 'PRINCIPAL'), async (req: any, res, next) => {
  try {
    const { actorId, action, entity, from, to, page = 1, limit = 100 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where: any = {
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
      prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: parseInt(limit),
        include: {
          actor: { select: { id: true, name: true, role: true } },
        },
      }),
      prisma.auditLog.count({ where }),
    ]);

    res.json({ logs, total, page: parseInt(page), limit: parseInt(limit) });
  } catch (err) { next(err); }
});

// GET /api/audit/actions — distinct action types for filter dropdowns
router.get('/actions', auth, requireRole('DIRECTOR', 'PRINCIPAL'), async (req: any, res, next) => {
  try {
    const rows = await prisma.auditLog.findMany({
      distinct: ['action'],
      select: { action: true },
      orderBy: { action: 'asc' },
    });
    res.json(rows.map(r => r.action));
  } catch (err) { next(err); }
});

export default router;
