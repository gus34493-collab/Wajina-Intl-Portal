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
const STAFF = (0, auth_1.requireRole)('DIRECTOR', 'PRINCIPAL', 'TEACHER', 'ACADEMIC_STAFF', 'ADMIN_STAFF');
const MANAGEMENT = (0, auth_1.requireRole)('DIRECTOR', 'PRINCIPAL');
// ─────────────────────────────────────────────────────────────────
// GET /api/attendance
// Teachers see records for their managed arms' students.
// Management sees all. Parents see their wards. Students see own.
// Query: studentId, armId, date (YYYY-MM-DD), termId, status, page, limit
// ─────────────────────────────────────────────────────────────────
router.get('/', auth_1.auth, async (req, res, next) => {
    try {
        const { studentId, armId, date, termId, status, page = 1, limit = 50 } = req.query;
        const skip = (parseInt(page) - 1) * parseInt(limit);
        const role = req.user.role;
        let studentFilter = {};
        if (role === 'STUDENT') {
            studentFilter = { studentId: req.user.id };
        }
        else if (role === 'PARENT') {
            const wards = await prisma_1.default.user.findMany({ where: { parentId: req.user.id }, select: { id: true } });
            studentFilter = { studentId: { in: wards.map((w) => w.id) } };
        }
        else if (role === 'TEACHER' || role === 'ACADEMIC_STAFF') {
            // Teacher sees students in their managed arms only
            const arms = await prisma_1.default.classArm.findMany({
                where: { teacherId: req.user.id },
                select: { id: true },
            });
            const armIds = arms.map((a) => a.id);
            studentFilter = {
                student: { armId: { in: armIds } },
            };
        }
        // DIRECTOR, PRINCIPAL, ADMIN_STAFF: no restriction
        const where = {
            ...studentFilter,
            ...(studentId && { studentId }),
            ...(armId && { armId }),
            ...(termId && { termId }),
            ...(status && { status }),
            ...(date && {
                date: new Date(date),
            }),
        };
        const [records, total] = await Promise.all([
            prisma_1.default.attendance.findMany({
                where,
                include: {
                    student: { select: { id: true, name: true, enrolledArm: { select: { fullName: true } } } },
                    markedBy: { select: { id: true, name: true } },
                    term: { select: { id: true, name: true } },
                },
                orderBy: [{ date: 'desc' }, { student: { name: 'asc' } }],
                skip,
                take: parseInt(limit),
            }),
            prisma_1.default.attendance.count({ where }),
        ]);
        res.json({ records, total, page: parseInt(page), limit: parseInt(limit) });
    }
    catch (err) {
        next(err);
    }
});
// ─────────────────────────────────────────────────────────────────
// POST /api/attendance/bulk
// Mark attendance for an entire arm on a given date.
// Body: { date: "YYYY-MM-DD", armId, termId?, records: [{ studentId, status, note? }] }
// A record is upserted (one per student per day). Teachers only for their arm.
// ─────────────────────────────────────────────────────────────────
router.post('/bulk', auth_1.auth, STAFF, async (req, res, next) => {
    try {
        const { date, armId, termId, records } = req.body;
        if (!date || !Array.isArray(records) || records.length === 0) {
            return res.status(400).json({ error: 'date and records[] are required.' });
        }
        const dateObj = new Date(date);
        if (isNaN(dateObj.getTime()))
            return res.status(400).json({ error: 'Invalid date format. Use YYYY-MM-DD.' });
        // Teachers can only mark attendance for their own arms
        if (req.user.role === 'TEACHER' || req.user.role === 'ACADEMIC_STAFF') {
            if (armId) {
                const arm = await prisma_1.default.classArm.findUnique({ where: { id: armId } });
                if (!arm || arm.teacherId !== req.user.id) {
                    return res.status(403).json({ error: 'You can only mark attendance for your assigned arm.' });
                }
            }
        }
        const VALID_STATUSES = ['PRESENT', 'ABSENT'];
        for (const r of records) {
            if (!r.studentId || !VALID_STATUSES.includes(r.status)) {
                return res.status(400).json({ error: `Invalid record: studentId and status (PRESENT|ABSENT) required.` });
            }
        }
        // Upsert each record
        const upserts = records.map((r) => prisma_1.default.attendance.upsert({
            where: { studentId_date: { studentId: r.studentId, date: dateObj } },
            update: { status: r.status, note: r.note || null, markedById: req.user.id, termId: termId || null, armId: armId || null },
            create: {
                date: dateObj,
                status: r.status,
                note: r.note || null,
                studentId: r.studentId,
                markedById: req.user.id,
                termId: termId || null,
                armId: armId || null,
            },
        }));
        const results = await prisma_1.default.$transaction(upserts);
        (0, audit_1.audit)(req.user.id, 'ATTENDANCE_BULK_MARK', 'Attendance', armId || 'N/A', `${records.length} records marked for ${date} by ${req.user.name}`, req.ip);
        res.json({ saved: results.length, date, armId });
    }
    catch (err) {
        next(err);
    }
});
// ─────────────────────────────────────────────────────────────────
// GET /api/attendance/today/:armId
// Returns today's attendance for a given arm, and the student list
// so the teacher can see who hasn't been marked yet.
// ─────────────────────────────────────────────────────────────────
router.get('/today/:armId', auth_1.auth, STAFF, async (req, res, next) => {
    try {
        const { armId } = req.params;
        const arm = await prisma_1.default.classArm.findUnique({
            where: { id: armId },
            include: {
                students: { where: { status: 'ACTIVE' }, select: { id: true, name: true }, orderBy: { name: 'asc' } },
            },
        });
        if (!arm)
            return res.status(404).json({ error: 'Arm not found.' });
        // Enforce teacher arm ownership
        if ((req.user.role === 'TEACHER' || req.user.role === 'ACADEMIC_STAFF') && arm.teacherId !== req.user.id) {
            return res.status(403).json({ error: 'Not your arm.' });
        }
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const existing = await prisma_1.default.attendance.findMany({
            where: { armId, date: today },
            select: { studentId: true, status: true, note: true },
        });
        const markedMap = {};
        for (const r of existing)
            markedMap[r.studentId] = { status: r.status, note: r.note };
        const students = arm.students.map((s) => ({
            ...s,
            marked: !!markedMap[s.id],
            status: markedMap[s.id]?.status || null,
            note: markedMap[s.id]?.note || null,
        }));
        res.json({ arm: { id: arm.id, fullName: arm.fullName }, date: today.toISOString().split('T')[0], students });
    }
    catch (err) {
        next(err);
    }
});
// ─────────────────────────────────────────────────────────────────
// GET /api/attendance/summary
// Returns present/absent counts grouped by period.
// Query: armId, studentId, termId, month (YYYY-MM)
// ─────────────────────────────────────────────────────────────────
router.get('/summary', auth_1.auth, async (req, res, next) => {
    try {
        const { armId, studentId, termId, month } = req.query;
        const role = req.user.role;
        let where = {};
        if (role === 'STUDENT')
            where.studentId = req.user.id;
        else if (role === 'PARENT') {
            const wards = await prisma_1.default.user.findMany({ where: { parentId: req.user.id }, select: { id: true } });
            where.studentId = { in: wards.map((w) => w.id) };
        }
        if (armId)
            where.armId = armId;
        if (studentId && role !== 'STUDENT' && role !== 'PARENT')
            where.studentId = studentId;
        if (termId)
            where.termId = termId;
        if (month) {
            const [year, mon] = month.split('-').map(Number);
            where.date = { gte: new Date(year, mon - 1, 1), lt: new Date(year, mon, 1) };
        }
        const [present, absent, total] = await Promise.all([
            prisma_1.default.attendance.count({ where: { ...where, status: 'PRESENT' } }),
            prisma_1.default.attendance.count({ where: { ...where, status: 'ABSENT' } }),
            prisma_1.default.attendance.count({ where }),
        ]);
        res.json({ present, absent, total, rate: total > 0 ? Math.round((present / total) * 100) : null });
    }
    catch (err) {
        next(err);
    }
});
exports.default = router;
