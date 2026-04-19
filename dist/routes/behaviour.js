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
// Role helpers
const STAFF = (0, auth_1.requireRole)('DIRECTOR', 'PRINCIPAL', 'TEACHER', 'ACADEMIC_STAFF', 'ADMIN_STAFF');
const MANAGEMENT = (0, auth_1.requireRole)('DIRECTOR', 'PRINCIPAL');
const VALID_SEVERITIES = ['COMMENDATION', 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
const VALID_STATUSES = ['OPEN', 'IN_REVIEW', 'RESOLVED', 'ESCALATED', 'CLOSED'];
const VALID_CATEGORIES = [
    'Tardiness', 'Truancy', 'Bullying', 'Fighting', 'Disrespect',
    'Academic Dishonesty', 'Vandalism', 'Mobile Phone Violation',
    'Dress Code Violation', 'Substance Violation', 'Commendation',
    'Leadership', 'Academic Excellence', 'Community Service', 'Other',
];
const RECORD_SELECT = {
    id: true,
    date: true,
    category: true,
    severity: true,
    description: true,
    actionTaken: true,
    status: true,
    formTeacherNote: true,
    principalNote: true,
    termId: true,
    sessionId: true,
    createdAt: true,
    updatedAt: true,
    student: { select: { id: true, name: true, role: true, enrolledArm: { select: { fullName: true } } } },
    reporter: { select: { id: true, name: true, role: true } },
};
// ── GET /api/behaviour ────────────────────────────────────────────────────────
// Query params: studentId, reporterId, category, severity, status, termId, sessionId, page, limit
// Access:
//   DIRECTOR/PRINCIPAL → all records
//   TEACHER/ACADEMIC_STAFF/ADMIN_STAFF → only records they filed
//   PARENT → only their wards' records
//   STUDENT → only their own records
router.get('/', auth_1.auth, async (req, res, next) => {
    try {
        const { studentId, reporterId, category, severity, status, termId, sessionId, page = 1, limit = 50 } = req.query;
        const skip = (parseInt(page) - 1) * parseInt(limit);
        const role = req.user.role;
        let where = {};
        // Access scoping
        if (role === 'PARENT') {
            // Fetch ward IDs for this parent
            const wards = await prisma_1.default.user.findMany({ where: { parentId: req.user.id }, select: { id: true } });
            const wardIds = wards.map(w => w.id);
            where.studentId = { in: wardIds };
        }
        else if (role === 'STUDENT') {
            where.studentId = req.user.id;
        }
        else if (!['DIRECTOR', 'PRINCIPAL'].includes(role)) {
            // Teachers/staff see only records they reported
            where.reporterId = req.user.id;
        }
        // Optional additional filters
        if (studentId && ['DIRECTOR', 'PRINCIPAL'].includes(role))
            where.studentId = studentId;
        if (reporterId && ['DIRECTOR', 'PRINCIPAL'].includes(role))
            where.reporterId = reporterId;
        if (category)
            where.category = category;
        if (severity && VALID_SEVERITIES.includes(severity))
            where.severity = severity;
        if (status && VALID_STATUSES.includes(status))
            where.status = status;
        if (termId)
            where.termId = termId;
        if (sessionId)
            where.sessionId = sessionId;
        const [records, total] = await Promise.all([
            prisma_1.default.behaviourRecord.findMany({
                where,
                select: RECORD_SELECT,
                orderBy: { date: 'desc' },
                skip,
                take: parseInt(limit),
            }),
            prisma_1.default.behaviourRecord.count({ where }),
        ]);
        res.json({ records, total, page: parseInt(page), limit: parseInt(limit) });
    }
    catch (err) {
        next(err);
    }
});
// ── GET /api/behaviour/:id ────────────────────────────────────────────────────
router.get('/:id', auth_1.auth, async (req, res, next) => {
    try {
        const record = await prisma_1.default.behaviourRecord.findUnique({ where: { id: req.params.id }, select: RECORD_SELECT });
        if (!record)
            return res.status(404).json({ error: 'Record not found' });
        const role = req.user.role;
        // Check visibility
        if (role === 'STUDENT' && record.student.id !== req.user.id)
            return res.status(403).json({ error: 'Access denied' });
        if (role === 'PARENT') {
            const wards = await prisma_1.default.user.findMany({ where: { parentId: req.user.id }, select: { id: true } });
            if (!wards.some(w => w.id === record.student.id))
                return res.status(403).json({ error: 'Access denied' });
        }
        if (!['DIRECTOR', 'PRINCIPAL'].includes(role) && role !== 'PARENT' && role !== 'STUDENT') {
            if (record.reporter.id !== req.user.id)
                return res.status(403).json({ error: 'Access denied' });
        }
        res.json(record);
    }
    catch (err) {
        next(err);
    }
});
// ── POST /api/behaviour ───────────────────────────────────────────────────────
router.post('/', auth_1.auth, STAFF, async (req, res, next) => {
    try {
        const { studentId, date, category, severity, description, actionTaken, termId, sessionId } = req.body;
        if (!studentId || !date || !category || !severity || !description) {
            return res.status(400).json({ error: 'studentId, date, category, severity, and description are required' });
        }
        if (!VALID_SEVERITIES.includes(severity))
            return res.status(400).json({ error: 'Invalid severity' });
        // Verify student exists
        const student = await prisma_1.default.user.findUnique({ where: { id: studentId } });
        if (!student || student.role !== 'STUDENT')
            return res.status(404).json({ error: 'Student not found' });
        const record = await prisma_1.default.behaviourRecord.create({
            data: {
                studentId,
                reporterId: req.user.id,
                date: new Date(date),
                category,
                severity,
                description,
                ...(actionTaken && { actionTaken }),
                ...(termId && { termId }),
                ...(sessionId && { sessionId }),
            },
            select: RECORD_SELECT,
        });
        (0, audit_1.audit)(req.user.id, 'BEHAVIOUR_CREATED', 'BehaviourRecord', record.id, `${severity} record filed for student ${student.name}`, req.ip);
        res.status(201).json(record);
    }
    catch (err) {
        next(err);
    }
});
// ── PATCH /api/behaviour/:id ──────────────────────────────────────────────────
// Reporters can update description/actionTaken while OPEN
// Form teachers can add formTeacherNote, update status to IN_REVIEW
// Management can update status, principalNote
router.patch('/:id', auth_1.auth, async (req, res, next) => {
    try {
        const existing = await prisma_1.default.behaviourRecord.findUnique({ where: { id: req.params.id } });
        if (!existing)
            return res.status(404).json({ error: 'Record not found' });
        const role = req.user.role;
        const isManagement = ['DIRECTOR', 'PRINCIPAL'].includes(role);
        const isReporter = existing.reporterId === req.user.id;
        const canEdit = isManagement || isReporter;
        if (!canEdit)
            return res.status(403).json({ error: 'Insufficient permissions' });
        // Fields each role can set
        const { description, actionTaken, formTeacherNote, principalNote, status } = req.body;
        const data = {};
        if (isReporter && existing.status === 'OPEN') {
            if (description !== undefined)
                data.description = description;
            if (actionTaken !== undefined)
                data.actionTaken = actionTaken;
        }
        if (formTeacherNote !== undefined)
            data.formTeacherNote = formTeacherNote;
        if (isManagement) {
            if (principalNote !== undefined)
                data.principalNote = principalNote;
            if (status && VALID_STATUSES.includes(status))
                data.status = status;
        }
        if (Object.keys(data).length === 0)
            return res.status(400).json({ error: 'No valid fields to update' });
        const updated = await prisma_1.default.behaviourRecord.update({ where: { id: req.params.id }, data, select: RECORD_SELECT });
        (0, audit_1.audit)(req.user.id, 'BEHAVIOUR_UPDATED', 'BehaviourRecord', existing.id, `Status: ${updated.status}`, req.ip);
        res.json(updated);
    }
    catch (err) {
        next(err);
    }
});
// ── DELETE /api/behaviour/:id ─────────────────────────────────────────────────
router.delete('/:id', auth_1.auth, MANAGEMENT, async (req, res, next) => {
    try {
        const existing = await prisma_1.default.behaviourRecord.findUnique({ where: { id: req.params.id } });
        if (!existing)
            return res.status(404).json({ error: 'Record not found' });
        await prisma_1.default.behaviourRecord.delete({ where: { id: req.params.id } });
        (0, audit_1.audit)(req.user.id, 'BEHAVIOUR_DELETED', 'BehaviourRecord', existing.id, `Record deleted`, req.ip);
        res.json({ message: 'Record deleted' });
    }
    catch (err) {
        next(err);
    }
});
// ── GET /api/behaviour/stats/summary ─────────────────────────────────────────
// Returns per-severity counts, optionally scoped to studentId or termId
// Management: full summary. Teachers: only records they reported.
router.get('/stats/summary', auth_1.auth, STAFF, async (req, res, next) => {
    try {
        const { studentId, termId, sessionId } = req.query;
        const where = {
            ...(studentId && { studentId }),
            ...(termId && { termId }),
            ...(sessionId && { sessionId }),
        };
        if (!['DIRECTOR', 'PRINCIPAL'].includes(req.user.role)) {
            where.reporterId = req.user.id;
        }
        const rows = await prisma_1.default.behaviourRecord.groupBy({
            by: ['severity'],
            where,
            _count: { id: true },
        });
        const counts = {};
        for (const r of rows)
            counts[r.severity] = r._count.id;
        res.json(counts);
    }
    catch (err) {
        next(err);
    }
});
exports.default = router;
