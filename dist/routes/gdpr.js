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
// ── GET /api/gdpr/export — export all personal data for the logged-in user ───
router.get('/export', auth_1.auth, async (req, res, next) => {
    try {
        const userId = req.user.id;
        // Fetch all data associated with this user
        const [user, grades, attendance, behaviour, payments, requests, auditLogs] = await Promise.all([
            prisma_1.default.user.findUnique({
                where: { id: userId },
                select: {
                    id: true, email: true, name: true, role: true, status: true,
                    phone: true, profilePhoto: true, campus: true,
                    isFormMaster: true, createdAt: true, updatedAt: true,
                    consentGiven: true, consentDate: true,
                },
            }),
            prisma_1.default.grade.findMany({
                where: { studentId: userId },
                include: { subject: { select: { name: true } }, term: { select: { name: true } } },
            }),
            prisma_1.default.attendance.findMany({
                where: { studentId: userId },
                include: { term: { select: { name: true } }, markedBy: { select: { name: true } } },
            }),
            prisma_1.default.behaviourRecord.findMany({
                where: { studentId: userId },
                include: { reporter: { select: { name: true, role: true } } },
            }),
            prisma_1.default.payment.findMany({ where: { studentId: userId } }),
            prisma_1.default.request.findMany({
                where: { OR: [{ senderId: userId }, { receiverId: userId }] },
            }),
            prisma_1.default.auditLog.findMany({
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
        (0, audit_1.audit)(userId, 'DATA_EXPORT', 'User', userId, 'GDPR data export requested', req.ip);
        res.json({
            message: 'Data export completed successfully.',
            data: exportData,
        });
    }
    catch (err) {
        next(err);
    }
});
// ── POST /api/gdpr/request-deletion — request account deletion ───────────────
router.post('/request-deletion', auth_1.auth, async (req, res, next) => {
    try {
        const user = await prisma_1.default.user.update({
            where: { id: req.user.id },
            data: { deletionRequestedAt: new Date() },
            select: { id: true, name: true, email: true, deletionRequestedAt: true },
        });
        (0, audit_1.audit)(req.user.id, 'DELETION_REQUESTED', 'User', req.user.id, 'GDPR right to erasure requested', req.ip);
        res.json({
            message: 'Deletion request submitted. An administrator will process your request within 30 days. You will receive a confirmation email.',
            user,
        });
    }
    catch (err) {
        next(err);
    }
});
// ── POST /api/gdpr/cancel-deletion — cancel a pending deletion request ───────
router.post('/cancel-deletion', auth_1.auth, async (req, res, next) => {
    try {
        const user = await prisma_1.default.user.update({
            where: { id: req.user.id },
            data: { deletionRequestedAt: null },
            select: { id: true, name: true, email: true, deletionRequestedAt: true },
        });
        res.json({ message: 'Deletion request cancelled.', user });
    }
    catch (err) {
        next(err);
    }
});
// ── GET /api/gdpr/deletion-status — check if deletion is pending ─────────────
router.get('/deletion-status', auth_1.auth, async (req, res, next) => {
    try {
        const user = await prisma_1.default.user.findUnique({
            where: { id: req.user.id },
            select: { id: true, name: true, deletionRequestedAt: true },
        });
        res.json({
            deletionRequested: !!user?.deletionRequestedAt,
            requestedAt: user?.deletionRequestedAt || null,
        });
    }
    catch (err) {
        next(err);
    }
});
// ── POST /api/gdpr/process-deletion — Director-only: actually delete a user ──
router.post('/process-deletion/:id', auth_1.auth, (0, auth_1.requireRole)('DIRECTOR'), async (req, res, next) => {
    try {
        const target = await prisma_1.default.user.findUnique({
            where: { id: req.params.id },
            select: { id: true, name: true, email: true, role: true, deletionRequestedAt: true },
        });
        if (!target)
            return res.status(404).json({ error: 'User not found.' });
        // Prevent self-deletion
        if (target.id === req.user.id) {
            return res.status(400).json({ error: 'You cannot delete your own account.' });
        }
        // Anonymise rather than hard-delete to preserve referential integrity
        await prisma_1.default.user.update({
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
        (0, audit_1.audit)(req.user.id, 'USER_ANONYMISED', 'User', target.id, `GDPR erasure processed by ${req.user.name} for ${target.name}`, req.ip);
        res.json({ message: `User "${target.name}" has been anonymised and disabled.` });
    }
    catch (err) {
        next(err);
    }
});
// ── GET /api/gdpr/pending-deletions — Director-only: list pending requests ───
router.get('/pending-deletions', auth_1.auth, (0, auth_1.requireRole)('DIRECTOR'), async (req, res, next) => {
    try {
        const users = await prisma_1.default.user.findMany({
            where: { deletionRequestedAt: { not: null } },
            select: {
                id: true, name: true, email: true, role: true,
                deletionRequestedAt: true, createdAt: true,
            },
            orderBy: { deletionRequestedAt: 'asc' },
        });
        res.json({ pendingDeletions: users, count: users.length });
    }
    catch (err) {
        next(err);
    }
});
exports.default = router;
