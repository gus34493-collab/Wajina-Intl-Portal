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
const ADMIN = (0, auth_1.requireRole)('DIRECTOR', 'PRINCIPAL', 'HEAD_TEACHER', 'VP_ADMIN');
// ════════════════════════════════════════════════════════════════════════════
// ACADEMIC SESSIONS
// ════════════════════════════════════════════════════════════════════════════
// GET /api/structure/sessions
router.get('/sessions', auth_1.auth, async (req, res, next) => {
    try {
        const sessions = await prisma_1.default.academicSession.findMany({
            orderBy: { year: 'desc' },
            include: { terms: { orderBy: { name: 'asc' } } },
        });
        res.json(sessions);
    }
    catch (err) {
        next(err);
    }
});
// POST /api/structure/sessions
router.post('/sessions', auth_1.auth, ADMIN, async (req, res, next) => {
    try {
        const { name, year, startDate, endDate, isDefault } = req.body;
        if (!name || !year)
            return res.status(400).json({ error: 'name and year are required' });
        // If setting as default, unset existing default
        if (isDefault) {
            await prisma_1.default.academicSession.updateMany({ where: { isDefault: true }, data: { isDefault: false } });
        }
        const session = await prisma_1.default.academicSession.create({
            data: {
                name,
                year: String(year), // Ensure string for schema
                startDate: startDate ? new Date(startDate) : new Date(),
                endDate: endDate ? new Date(endDate) : new Date(new Date().setFullYear(new Date().getFullYear() + 1)),
                isDefault: !!isDefault,
                status: 'UPCOMING',
            },
        });
        (0, audit_1.audit)(req.user.id, 'CREATE', 'AcademicSession', session.id, name, req.ip);
        res.status(201).json(session);
    }
    catch (err) {
        next(err);
    }
});
// PATCH /api/structure/sessions/:id
router.patch('/sessions/:id', auth_1.auth, ADMIN, async (req, res, next) => {
    try {
        const { name, year, startDate, endDate, status, isDefault } = req.body;
        if (isDefault) {
            await prisma_1.default.academicSession.updateMany({ where: { isDefault: true }, data: { isDefault: false } });
        }
        const session = await prisma_1.default.academicSession.update({
            where: { id: req.params.id },
            data: {
                ...(name && { name }),
                ...(year && { year: String(year) }),
                ...(startDate !== undefined && { startDate: startDate ? new Date(startDate) : null }),
                ...(endDate !== undefined && { endDate: endDate ? new Date(endDate) : null }),
                ...(status && { status }),
                ...(isDefault !== undefined && { isDefault: !!isDefault }),
            },
        });
        (0, audit_1.audit)(req.user.id, 'UPDATE', 'AcademicSession', session.id, name || session.name, req.ip);
        res.json(session);
    }
    catch (err) {
        next(err);
    }
});
// DELETE /api/structure/sessions/:id
router.delete('/sessions/:id', auth_1.auth, ADMIN, async (req, res, next) => {
    try {
        const existing = await prisma_1.default.academicSession.findUnique({ where: { id: req.params.id } });
        if (!existing)
            return res.status(404).json({ error: 'Session not found' });
        await prisma_1.default.academicSession.delete({ where: { id: req.params.id } });
        (0, audit_1.audit)(req.user.id, 'DELETE', 'AcademicSession', req.params.id, existing.name, req.ip);
        res.json({ message: 'Session deleted' });
    }
    catch (err) {
        next(err);
    }
});
// ════════════════════════════════════════════════════════════════════════════
// TERMS
// ════════════════════════════════════════════════════════════════════════════
// GET /api/structure/terms
router.get('/terms', auth_1.auth, async (req, res, next) => {
    try {
        const { sessionId } = req.query;
        const terms = await prisma_1.default.term.findMany({
            where: sessionId ? { sessionId } : undefined,
            orderBy: [{ session: { year: 'desc' } }, { name: 'asc' }],
            include: { session: { select: { name: true, year: true } } },
        });
        res.json(terms);
    }
    catch (err) {
        next(err);
    }
});
// POST /api/structure/terms
router.post('/terms', auth_1.auth, ADMIN, async (req, res, next) => {
    try {
        const { sessionId, name, startDate, endDate, isCurrent } = req.body;
        if (!sessionId || !name)
            return res.status(400).json({ error: 'sessionId and name are required' });
        if (isCurrent) {
            await prisma_1.default.term.updateMany({ where: { isCurrent: true }, data: { isCurrent: false } });
        }
        const term = await prisma_1.default.term.create({
            data: {
                sessionId,
                name,
                startDate: startDate ? new Date(startDate) : new Date(),
                endDate: endDate ? new Date(endDate) : new Date(new Date().setMonth(new Date().getMonth() + 4)),
                isCurrent: !!isCurrent,
                status: 'UPCOMING',
            },
            include: { session: { select: { name: true } } },
        });
        (0, audit_1.audit)(req.user.id, 'CREATE', 'Term', term.id, `${name} - ${term.session.name}`, req.ip);
        res.status(201).json(term);
    }
    catch (err) {
        next(err);
    }
});
// PATCH /api/structure/terms/:id
router.patch('/terms/:id', auth_1.auth, ADMIN, async (req, res, next) => {
    try {
        const { startDate, endDate, status, isCurrent } = req.body;
        if (isCurrent) {
            await prisma_1.default.term.updateMany({ where: { isCurrent: true }, data: { isCurrent: false } });
        }
        const term = await prisma_1.default.term.update({
            where: { id: req.params.id },
            data: {
                ...(startDate !== undefined && { startDate: startDate ? new Date(startDate) : null }),
                ...(endDate !== undefined && { endDate: endDate ? new Date(endDate) : null }),
                ...(status && { status }),
                ...(isCurrent !== undefined && { isCurrent: !!isCurrent }),
            },
        });
        (0, audit_1.audit)(req.user.id, 'UPDATE', 'Term', term.id, term.name, req.ip);
        res.json(term);
    }
    catch (err) {
        next(err);
    }
});
// DELETE /api/structure/terms/:id
router.delete('/terms/:id', auth_1.auth, ADMIN, async (req, res, next) => {
    try {
        const existing = await prisma_1.default.term.findUnique({ where: { id: req.params.id } });
        if (!existing)
            return res.status(404).json({ error: 'Term not found' });
        await prisma_1.default.term.delete({ where: { id: req.params.id } });
        (0, audit_1.audit)(req.user.id, 'DELETE', 'Term', req.params.id, existing.name, req.ip);
        res.json({ message: 'Term deleted' });
    }
    catch (err) {
        next(err);
    }
});
// ════════════════════════════════════════════════════════════════════════════
// CLASSES
// ════════════════════════════════════════════════════════════════════════════
// GET /api/structure/classes
router.get('/classes', auth_1.auth, async (req, res, next) => {
    try {
        const { campus } = req.query;
        const classes = await prisma_1.default.class.findMany({
            where: { ...(campus && { campus }), active: true },
            orderBy: [{ campus: 'asc' }, { displayOrder: 'asc' }, { name: 'asc' }],
            include: { _count: { select: { arms: true } } },
        });
        res.json(classes);
    }
    catch (err) {
        next(err);
    }
});
// POST /api/structure/classes
router.post('/classes', auth_1.auth, ADMIN, async (req, res, next) => {
    try {
        const { name, campus, category, displayOrder } = req.body;
        if (!name || !campus)
            return res.status(400).json({ error: 'name and campus are required' });
        let cls = await prisma_1.default.class.findFirst({ where: { name, campus } });
        if (!cls) {
            cls = await prisma_1.default.class.create({
                data: {
                    name,
                    campus,
                    category: category || null,
                    displayOrder: displayOrder ? parseInt(displayOrder) : 99,
                    active: true,
                },
            });
            (0, audit_1.audit)(req.user.id, 'CREATE', 'Class', cls.id, `${campus} - ${name}`, req.ip);
        }
        res.status(201).json(cls);
    }
    catch (err) {
        next(err);
    }
});
// PATCH /api/structure/classes/:id
router.patch('/classes/:id', auth_1.auth, ADMIN, async (req, res, next) => {
    try {
        const { name, campus, category, displayOrder, active } = req.body;
        const cls = await prisma_1.default.class.update({
            where: { id: req.params.id },
            data: {
                ...(name && { name }),
                ...(campus && { campus }),
                ...(category !== undefined && { category }),
                ...(displayOrder !== undefined && { displayOrder: parseInt(displayOrder) }),
                ...(active !== undefined && { active: !!active }),
            },
        });
        (0, audit_1.audit)(req.user.id, 'UPDATE', 'Class', cls.id, cls.name, req.ip);
        res.json(cls);
    }
    catch (err) {
        next(err);
    }
});
// DELETE /api/structure/classes/:id
router.delete('/classes/:id', auth_1.auth, (0, auth_1.requireRole)('DIRECTOR'), async (req, res, next) => {
    try {
        const existing = await prisma_1.default.class.findUnique({ where: { id: req.params.id } });
        if (!existing)
            return res.status(404).json({ error: 'Class not found' });
        await prisma_1.default.class.delete({ where: { id: req.params.id } });
        (0, audit_1.audit)(req.user.id, 'DELETE', 'Class', req.params.id, existing.name, req.ip);
        res.json({ message: 'Class deleted' });
    }
    catch (err) {
        next(err);
    }
});
// ════════════════════════════════════════════════════════════════════════════
// CLASS ARMS
// ════════════════════════════════════════════════════════════════════════════
// GET /api/structure/arms
router.get('/arms', auth_1.auth, async (req, res, next) => {
    try {
        const { classId } = req.query;
        const arms = await prisma_1.default.classArm.findMany({
            where: classId ? { classId } : undefined,
            orderBy: [{ class: { displayOrder: 'asc' } }, { label: 'asc' }],
            include: {
                class: { select: { name: true, campus: true } },
                teacher: { select: { id: true, name: true } },
                _count: { select: { students: true } },
            },
        });
        res.json(arms);
    }
    catch (err) {
        next(err);
    }
});
// POST /api/structure/arms
router.post('/arms', auth_1.auth, ADMIN, async (req, res, next) => {
    try {
        const { classId, label, teacherId, capacity } = req.body;
        if (!classId || !label)
            return res.status(400).json({ error: 'classId and label are required' });
        const cls = await prisma_1.default.class.findUnique({ where: { id: classId }, select: { name: true } });
        if (!cls)
            return res.status(404).json({ error: 'Class not found' });
        const arm = await prisma_1.default.classArm.create({
            data: {
                classId,
                label: label.trim().toUpperCase(),
                fullName: `${cls.name} ${label.trim().toUpperCase()}`,
                teacherId: teacherId || null,
                capacity: capacity ? parseInt(capacity) : null,
            },
            include: {
                class: { select: { name: true, campus: true } },
                teacher: { select: { id: true, name: true } },
                _count: { select: { students: true } },
            },
        });
        (0, audit_1.audit)(req.user.id, 'CREATE', 'ClassArm', arm.id, arm.fullName, req.ip);
        res.status(201).json(arm);
    }
    catch (err) {
        next(err);
    }
});
// PATCH /api/structure/arms/:id
router.patch('/arms/:id', auth_1.auth, ADMIN, async (req, res, next) => {
    try {
        const { teacherId, capacity } = req.body;
        const arm = await prisma_1.default.classArm.update({
            where: { id: req.params.id },
            data: {
                ...(teacherId !== undefined && { teacherId: teacherId || null }),
                ...(capacity !== undefined && { capacity: capacity ? parseInt(capacity) : null }),
            },
        });
        (0, audit_1.audit)(req.user.id, 'UPDATE', 'ClassArm', arm.id, arm.fullName, req.ip);
        res.json(arm);
    }
    catch (err) {
        next(err);
    }
});
// PATCH /api/structure/arms/:id/timetable - Form Teacher or Admin
router.patch('/arms/:id/timetable', auth_1.auth, async (req, res, next) => {
    try {
        const { timetableUrl } = req.body;
        const { id } = req.params;
        const { id: userId, role } = req.user;
        const arm = await prisma_1.default.classArm.findUnique({ where: { id } });
        if (!arm)
            return res.status(404).json({ error: 'Class arm not found' });
        // Authorization: Admin or the specific Form Teacher
        const isOwner = arm.teacherId === userId;
        const isAdmin = ['DIRECTOR', 'PRINCIPAL', 'HEAD_TEACHER', 'VP_ADMIN'].includes(role);
        if (!isOwner && !isAdmin) {
            return res.status(403).json({ error: 'Only the assigned Form Teacher or Management can update this timetable.' });
        }
        const updated = await prisma_1.default.classArm.update({
            where: { id },
            data: { timetableUrl }
        });
        (0, audit_1.audit)(userId, 'TIMETABLE_UPDATE', 'ClassArm', id, `Timetable updated for ${arm.fullName}`, req.ip);
        res.json({ message: 'Timetable updated successfully', timetableUrl: updated.timetableUrl });
    }
    catch (err) {
        next(err);
    }
});
// DELETE /api/structure/arms/:id
router.delete('/arms/:id', auth_1.auth, ADMIN, async (req, res, next) => {
    try {
        const existing = await prisma_1.default.classArm.findUnique({ where: { id: req.params.id } });
        if (!existing)
            return res.status(404).json({ error: 'Class arm not found' });
        await prisma_1.default.classArm.delete({ where: { id: req.params.id } });
        (0, audit_1.audit)(req.user.id, 'DELETE', 'ClassArm', req.params.id, existing.fullName, req.ip);
        res.json({ message: 'Class arm deleted' });
    }
    catch (err) {
        next(err);
    }
});
// ════════════════════════════════════════════════════════════════════════════
// OVERVIEW (aggregated tree)
// ════════════════════════════════════════════════════════════════════════════
// GET /api/structure/overview
router.get('/overview', auth_1.auth, async (req, res, next) => {
    try {
        const [sessions, classes] = await Promise.all([
            prisma_1.default.academicSession.findMany({
                orderBy: { year: 'desc' },
                include: { terms: { orderBy: { name: 'asc' } } },
            }),
            prisma_1.default.class.findMany({
                where: { active: true },
                orderBy: [{ campus: 'asc' }, { displayOrder: 'asc' }],
                include: {
                    arms: {
                        include: {
                            teacher: { select: { name: true } },
                            _count: { select: { students: true } },
                        },
                        orderBy: { label: 'asc' },
                    },
                },
            }),
        ]);
        res.json({ sessions, classes });
    }
    catch (err) {
        next(err);
    }
});
// ── GET /api/structure/subjects ───────────────────────────────────────────────────
// ?teacherId=   → subjects taught by that teacher (via assigned class)
// ?classId=     → subjects for that class
// No filter     → all subjects (management)
router.get('/subjects', auth_1.auth, async (req, res, next) => {
    try {
        const { teacherId, classId } = req.query;
        const where = {};
        if (classId)
            where.classId = classId;
        if (teacherId) {
            // Subjects where the linked class has this user as formMaster
            where.class = { formMasterId: teacherId };
        }
        const subjects = await prisma_1.default.subject.findMany({
            where,
            orderBy: { name: 'asc' },
            include: { class: { select: { id: true, name: true, campus: true } } },
        });
        res.json({ subjects });
    }
    catch (err) {
        next(err);
    }
});
exports.default = router;
