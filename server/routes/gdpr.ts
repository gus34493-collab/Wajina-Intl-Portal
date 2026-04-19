import express from 'express';
import prisma from '../prisma';
import { auth, requireRole } from '../middleware/auth';
import { audit } from '../middleware/audit';

const router = express.Router();

// ── GET /api/gdpr/export — export all personal data for the logged-in user ───
router.get('/export', auth, async (req: any, res, next) => {
  try {
    const userId = req.user.id;

    // Fetch all data associated with this user
    const [user, grades, attendance, behaviour, payments, requests, auditLogs] = await Promise.all([
      prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true, email: true, name: true, role: true, status: true,
          phone: true, profilePhoto: true, campus: true,
          isFormMaster: true, createdAt: true, updatedAt: true,
          consentGiven: true, consentDate: true,
        },
      }),
      prisma.grade.findMany({
        where: { studentId: userId },
        include: { subject: { select: { name: true } }, term: { select: { name: true } } },
      }),
      prisma.attendance.findMany({
        where: { studentId: userId },
        include: { term: { select: { name: true } }, markedBy: { select: { name: true } } },
      }),
      prisma.behaviourRecord.findMany({
        where: { studentId: userId },
        include: { reporter: { select: { name: true, role: true } } },
      }),
      prisma.payment.findMany({ where: { studentId: userId } }),
      prisma.request.findMany({
        where: { OR: [{ senderId: userId }, { receiverId: userId }] },
      }),
      prisma.auditLog.findMany({
        where: { actorId: userId },
        orderBy: { createdAt: 'desc' },
        take: 100,
      }),
    ]);

    const exportData = {
      exportDate: new Date().toISOString(),
      exportedFor: user,
      academicRecords: { grades, attendance, behaviour },
      financialRecords: payments,
      communications: requests,
      activityLog: auditLogs,
    };

    audit(userId, 'DATA_EXPORT', 'User', userId, 'GDPR data export requested', req.ip);

    res.json({
      message: 'Data export completed successfully.',
      data: exportData,
    });
  } catch (err: any) {
    next(err);
  }
});

// ── POST /api/gdpr/request-deletion — request account deletion ───────────────
router.post('/request-deletion', auth, async (req: any, res, next) => {
  try {
    const user = await prisma.user.update({
      where: { id: req.user.id },
      data: { deletionRequestedAt: new Date() },
      select: { id: true, name: true, email: true, deletionRequestedAt: true },
    });

    audit(req.user.id, 'DELETION_REQUESTED', 'User', req.user.id, 'GDPR right to erasure requested', req.ip);

    res.json({
      message: 'Deletion request submitted. An administrator will process your request within 30 days. You will receive a confirmation email.',
      user,
    });
  } catch (err: any) {
    next(err);
  }
});

// ── POST /api/gdpr/cancel-deletion — cancel a pending deletion request ───────
router.post('/cancel-deletion', auth, async (req: any, res, next) => {
  try {
    const user = await prisma.user.update({
      where: { id: req.user.id },
      data: { deletionRequestedAt: null },
      select: { id: true, name: true, email: true, deletionRequestedAt: true },
    });

    res.json({ message: 'Deletion request cancelled.', user });
  } catch (err: any) {
    next(err);
  }
});

// ── GET /api/gdpr/deletion-status — check if deletion is pending ─────────────
router.get('/deletion-status', auth, async (req: any, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { id: true, name: true, deletionRequestedAt: true },
    });

    res.json({
      deletionRequested: !!user?.deletionRequestedAt,
      requestedAt: user?.deletionRequestedAt || null,
    });
  } catch (err: any) {
    next(err);
  }
});

// ── POST /api/gdpr/process-deletion — Director-only: actually delete a user ──
router.post('/process-deletion/:id', auth, requireRole('DIRECTOR'), async (req: any, res, next) => {
  try {
    const target = await prisma.user.findUnique({
      where: { id: req.params.id },
      select: { id: true, name: true, email: true, role: true, deletionRequestedAt: true },
    });

    if (!target) return res.status(404).json({ error: 'User not found.' });

    // Prevent self-deletion
    if (target.id === req.user.id) {
      return res.status(400).json({ error: 'You cannot delete your own account.' });
    }

    // Anonymise rather than hard-delete to preserve referential integrity
    await prisma.user.update({
      where: { id: target.id },
      data: {
        email: `deleted_${target.id}@deleted.local`,
        name: 'Deleted User',
        phone: null,
        profilePhoto: null,
        status: 'DISABLED',
        deletionRequestedAt: null,
      },
    });

    audit(req.user.id, 'USER_ANONYMISED', 'User', target.id,
      `GDPR erasure processed by ${req.user.name} for ${target.name}`, req.ip);

    res.json({ message: `User "${target.name}" has been anonymised and disabled.` });
  } catch (err: any) {
    next(err);
  }
});

// ── GET /api/gdpr/pending-deletions — Director-only: list pending requests ───
router.get('/pending-deletions', auth, requireRole('DIRECTOR'), async (req: any, res, next) => {
  try {
    const users = await prisma.user.findMany({
      where: { deletionRequestedAt: { not: null } },
      select: {
        id: true, name: true, email: true, role: true,
        deletionRequestedAt: true, createdAt: true,
      },
      orderBy: { deletionRequestedAt: 'asc' },
    });

    res.json({ pendingDeletions: users, count: users.length });
  } catch (err: any) {
    next(err);
  }
});

export default router;
