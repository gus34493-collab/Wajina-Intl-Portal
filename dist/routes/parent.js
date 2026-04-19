"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const prisma_1 = __importDefault(require("../prisma"));
const auth_1 = require("../middleware/auth");
const router = express_1.default.Router();
const PARENT_ONLY = (0, auth_1.requireRole)('PARENT');
// ─────────────────────────────────────────────────────────────────
// Middleware: verify the student being queried belongs to this parent
// ─────────────────────────────────────────────────────────────────
async function guardWard(req, res, next) {
    const { studentId } = req.params;
    const ward = await prisma_1.default.user.findFirst({
        where: { id: studentId, parentId: req.user.id },
        select: { id: true, name: true },
    });
    if (!ward)
        return res.status(403).json({ error: 'This student is not linked to your account.' });
    req.ward = ward;
    next();
}
// ─────────────────────────────────────────────────────────────────
// GET /api/parent/dashboard
// Returns a combined summary for all wards:
//   - Basic info (name, class, arm)
//   - Attendance rate for current term
//   - Latest approved grades average
//   - Open behaviour records count
//   - Fee status
// ─────────────────────────────────────────────────────────────────
router.get('/dashboard', auth_1.auth, PARENT_ONLY, async (req, res, next) => {
    try {
        const wards = await prisma_1.default.user.findMany({
            where: { parentId: req.user.id, role: 'STUDENT' },
            select: {
                id: true,
                name: true,
                campus: true,
                enrolledArm: {
                    select: { fullName: true, class: { select: { name: true } } },
                },
                enrolledClass: { select: { name: true } },
                payments: {
                    orderBy: { id: 'desc' },
                    take: 1,
                    select: { status: true, amount: true },
                },
            },
        });
        if (!wards.length)
            return res.json({ wards: [] });
        // Find current term
        const currentTerm = await prisma_1.default.term.findFirst({
            where: { isCurrent: true },
            select: { id: true, name: true, session: { select: { name: true } } },
        });
        const summaries = await Promise.all(wards.map(async (ward) => {
            const [present, totalAtt, grades, behaviourCount] = await Promise.all([
                prisma_1.default.attendance.count({
                    where: { studentId: ward.id, status: 'PRESENT', ...(currentTerm && { termId: currentTerm.id }) },
                }),
                prisma_1.default.attendance.count({
                    where: { studentId: ward.id, ...(currentTerm && { termId: currentTerm.id }) },
                }),
                prisma_1.default.grade.findMany({
                    where: {
                        studentId: ward.id,
                        status: 'PRINCIPAL_APPROVED',
                        ...(currentTerm && { termId: currentTerm.id }),
                    },
                    select: { total: true },
                }),
                prisma_1.default.behaviourRecord.count({
                    where: { studentId: ward.id, status: { in: ['OPEN', 'IN_REVIEW'] } },
                }),
            ]);
            const attendanceRate = totalAtt > 0 ? Math.round((present / totalAtt) * 100) : null;
            const averageGrade = grades.length > 0
                ? Math.round((grades.reduce((a, g) => a + g.total, 0) / grades.length) * 10) / 10
                : null;
            const latestPayment = ward.payments[0] || null;
            return {
                id: ward.id,
                name: ward.name,
                campus: ward.campus,
                class: ward.enrolledClass?.name || ward.enrolledArm?.class?.name || null,
                arm: ward.enrolledArm?.fullName || null,
                attendance: { present, total: totalAtt, rate: attendanceRate },
                averageGrade,
                gradeCount: grades.length,
                openBehaviourCount: behaviourCount,
                payment: latestPayment
                    ? { status: latestPayment.status, amount: latestPayment.amount }
                    : null,
            };
        }));
        res.json({
            wards: summaries,
            currentTerm: currentTerm
                ? { id: currentTerm.id, name: currentTerm.name, session: currentTerm.session?.name }
                : null,
        });
    }
    catch (err) {
        next(err);
    }
});
// ─────────────────────────────────────────────────────────────────
// GET /api/parent/wards
// Simple list of this parent's wards with class/arm info.
// ─────────────────────────────────────────────────────────────────
router.get('/wards', auth_1.auth, PARENT_ONLY, async (req, res, next) => {
    try {
        const wards = await prisma_1.default.user.findMany({
            where: { parentId: req.user.id, role: 'STUDENT' },
            select: {
                id: true,
                name: true,
                email: true,
                status: true,
                campus: true,
                enrolledArm: { select: { id: true, fullName: true, class: { select: { id: true, name: true } } } },
                enrolledClass: { select: { id: true, name: true } },
            },
            orderBy: { name: 'asc' },
        });
        res.json({ wards });
    }
    catch (err) {
        next(err);
    }
});
// ─────────────────────────────────────────────────────────────────
// GET /api/parent/wards/:studentId/attendance
// Query: termId, month (YYYY-MM), page, limit
// ─────────────────────────────────────────────────────────────────
router.get('/wards/:studentId/attendance', auth_1.auth, PARENT_ONLY, guardWard, async (req, res, next) => {
    try {
        const { termId, month, page = 1, limit = 60 } = req.query;
        const skip = (parseInt(page) - 1) * parseInt(limit);
        let dateFilter = {};
        if (month) {
            const [year, mon] = month.split('-').map(Number);
            dateFilter = { gte: new Date(year, mon - 1, 1), lt: new Date(year, mon, 1) };
        }
        const where = {
            studentId: req.params.studentId,
            ...(termId && { termId }),
            ...(month && { date: dateFilter }),
        };
        const [records, total, present, absent] = await Promise.all([
            prisma_1.default.attendance.findMany({
                where,
                select: { id: true, date: true, status: true, note: true },
                orderBy: { date: 'desc' },
                skip,
                take: parseInt(limit),
            }),
            prisma_1.default.attendance.count({ where }),
            prisma_1.default.attendance.count({ where: { ...where, status: 'PRESENT' } }),
            prisma_1.default.attendance.count({ where: { ...where, status: 'ABSENT' } }),
        ]);
        res.json({
            student: { id: req.ward.id, name: req.ward.name },
            records,
            total,
            present,
            absent,
            rate: total > 0 ? Math.round((present / total) * 100) : null,
            page: parseInt(page),
            limit: parseInt(limit),
        });
    }
    catch (err) {
        next(err);
    }
});
// ─────────────────────────────────────────────────────────────────
// GET /api/parent/wards/:studentId/grades
// Returns only PRINCIPAL_APPROVED grades.
// Query: termId, sessionId
// ─────────────────────────────────────────────────────────────────
router.get('/wards/:studentId/grades', auth_1.auth, PARENT_ONLY, guardWard, async (req, res, next) => {
    try {
        const { termId, sessionId } = req.query;
        const where = {
            studentId: req.params.studentId,
            status: 'PRINCIPAL_APPROVED',
            ...(termId && { termId }),
            ...(sessionId && { sessionId }),
        };
        const grades = await prisma_1.default.grade.findMany({
            where,
            select: {
                id: true,
                firstCA: true,
                secondCA: true,
                thirdCA: true,
                exam: true,
                total: true,
                grade: true,
                position: true,
                teacherComment: true,
                principalRemark: true,
                subject: { select: { id: true, name: true } },
                term: { select: { id: true, name: true, session: { select: { name: true } } } },
            },
            orderBy: { subject: { name: 'asc' } },
        });
        // Compute overall average and position
        const average = grades.length
            ? Math.round((grades.reduce((a, g) => a + g.total, 0) / grades.length) * 10) / 10
            : null;
        res.json({
            student: { id: req.ward.id, name: req.ward.name },
            grades,
            subjectCount: grades.length,
            average,
        });
    }
    catch (err) {
        next(err);
    }
});
// ─────────────────────────────────────────────────────────────────
// GET /api/parent/wards/:studentId/behaviour
// Returns behaviour records for a ward. Non-RESOLVED/CLOSED records shown first.
// Query: status, page, limit
// ─────────────────────────────────────────────────────────────────
router.get('/wards/:studentId/behaviour', auth_1.auth, PARENT_ONLY, guardWard, async (req, res, next) => {
    try {
        const { status, page = 1, limit = 25 } = req.query;
        const skip = (parseInt(page) - 1) * parseInt(limit);
        const where = {
            studentId: req.params.studentId,
            ...(status && { status }),
        };
        const [records, total] = await Promise.all([
            prisma_1.default.behaviourRecord.findMany({
                where,
                select: {
                    id: true,
                    date: true,
                    category: true,
                    severity: true,
                    description: true,
                    actionTaken: true,
                    status: true,
                    principalNote: true,
                    reporter: { select: { name: true, role: true } },
                    term: true,
                },
                orderBy: { date: 'desc' },
                skip,
                take: parseInt(limit),
            }),
            prisma_1.default.behaviourRecord.count({ where }),
        ]);
        res.json({
            student: { id: req.ward.id, name: req.ward.name },
            records,
            total,
            page: parseInt(page),
            limit: parseInt(limit),
        });
    }
    catch (err) {
        next(err);
    }
});
// ─────────────────────────────────────────────────────────────────
// GET /api/parent/wards/:studentId/fee-status
// Returns payment records for this student.
// ─────────────────────────────────────────────────────────────────
router.get('/wards/:studentId/fee-status', auth_1.auth, PARENT_ONLY, guardWard, async (req, res, next) => {
    try {
        const payments = await prisma_1.default.payment.findMany({
            where: { studentId: req.params.studentId },
            select: { id: true, reference: true, amount: true, status: true, termId: true, sessionId: true },
            orderBy: { id: 'desc' },
        });
        const paid = payments.filter((p) => p.status === 'SUCCESS').reduce((a, p) => a + p.amount, 0);
        const pending = payments.filter((p) => p.status !== 'SUCCESS').reduce((a, p) => a + p.amount, 0);
        res.json({
            student: { id: req.ward.id, name: req.ward.name },
            payments,
            totalPaid: paid,
            totalPending: pending,
            latestStatus: payments[0]?.status || null,
        });
    }
    catch (err) {
        next(err);
    }
});
exports.default = router;
