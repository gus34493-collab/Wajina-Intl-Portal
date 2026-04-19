import express from 'express';
import prisma from '../prisma';
import { auth, requireRole } from '../middleware/auth';
import { audit } from '../middleware/audit';

const router = express.Router();
const OPS_LEADERS = requireRole('DIRECTOR', 'PRINCIPAL', 'HEAD_TEACHER', 'VP_ADMIN', 'VP_ACADEMICS', 'ASST_HEAD_TEACHER', 'DEAN_STUDENTS');
const ANY_STAFF = requireRole('DIRECTOR', 'PRINCIPAL', 'HEAD_TEACHER', 'VP_ADMIN', 'VP_ACADEMICS', 'ASST_HEAD_TEACHER', 'DEAN_STUDENTS', 'TEACHER', 'FORM_TEACHER', 'HR', 'BURSAR', 'ACCOUNTS_OFFICER', 'ADMIN_STAFF');

// ── GET /api/risks – list campus-scoped risks ──────────────────────────────
router.get('/', auth, OPS_LEADERS, async (req: any, res, next) => {
  try {
    const campus = req.user.campus;
    const role = req.user.role;

    let where: any = {};
    // Lock to campus for non-Directors
    if (role !== 'DIRECTOR' && campus) {
      where.campus = campus;
    }

    const { status, severity } = req.query;
    if (status) where.status = status;
    if (severity) where.severity = severity;

    const risks = await prisma.operationalRisk.findMany({
      where,
      include: { creator: { select: { name: true, role: true } } },
      orderBy: { createdAt: 'desc' },
    });

    res.json(risks);
  } catch (err) { next(err); }
});

// ── POST /api/risks – log a new risk + auto-notify ──────────────────────────
router.post('/', auth, ANY_STAFF, async (req: any, res, next) => {
  try {
    const { title, description, severity, status = 'OPEN' } = req.body;
    const campus = req.user.campus || 'SECONDARY';

    if (!title || !description || !severity) {
      return res.status(400).json({ error: 'Title, description and severity are required.' });
    }

    const risk = await prisma.operationalRisk.create({
      data: {
        title,
        description,
        severity,
        status,
        campus,
        createdBy: req.user.id
      },
      include: { creator: { select: { name: true } } }
    });

    // AUDIT
    audit(req.user.id, 'RISK_CREATED', 'OperationalRisk', risk.id, `Logged ${severity} risk: ${title}`, req.ip);

    // AUTOMATED NOTIFICATIONS: Notify Director and local VP_ADMIN or HT/AsstHT
    const campusLeaders = await prisma.user.findMany({
      where: {
        campus,
        role: { in: ['VP_ADMIN', 'PRINCIPAL', 'HEAD_TEACHER', 'ASST_HEAD_TEACHER'] }
      },
      select: { id: true }
    });

    const directors = await prisma.user.findMany({
      where: { role: 'DIRECTOR' },
      select: { id: true }
    });

    const notifyIds = Array.from(new Set([
      ...campusLeaders.map(u => u.id),
      ...directors.map(u => u.id)
    ]));

    // Create Internal Requests (notifications)
    if (notifyIds.length > 0) {
      await prisma.request.createMany({
        data: notifyIds.map(receiverId => ({
          level: (severity === 'CRITICAL' || severity === 'HIGH') ? 'K3' : 'K2',
          title: `Operational Risk Alert: ${severity}`,
          description: `A new ${severity} risk has been logged: "${title}" by ${req.user.name}. Campus: ${campus}.`,
          senderId: req.user.id,
          receiverId,
          status: 'PENDING'
        }))
      });
    }

    res.status(201).json(risk);
  } catch (err) { next(err); }
});

// ── PATCH /api/risks/:id – update status/severity ───────────────────────
router.patch('/:id', auth, OPS_LEADERS, async (req: any, res, next) => {
  try {
    const { id } = req.params;
    const { status, severity, description } = req.body;

    const existing = await prisma.operationalRisk.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ error: 'Risk not found' });

    // Enforce campus lockdown
    if (req.user.role !== 'DIRECTOR' && existing.campus !== req.user.campus) {
      return res.status(403).json({ error: 'Unauthorised. This risk belongs to another campus.' });
    }

    const updated = await prisma.operationalRisk.update({
      where: { id },
      data: {
        ...(status && { status }),
        ...(severity && { severity }),
        ...(description && { description })
      }
    });

    audit(req.user.id, 'RISK_UPDATED', 'OperationalRisk', id, `Updated risk status to ${status || existing.status}`, req.ip);
    res.json(updated);
  } catch (err) { next(err); }
});

export default router;
