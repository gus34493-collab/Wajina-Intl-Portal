"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const prisma_js_1 = __importDefault(require("../prisma.js"));
const auth_js_1 = require("../middleware/auth.js");
const router = express_1.default.Router();
const PRINCIPAL_PLUS = (0, auth_js_1.requireRole)('DIRECTOR', 'PRINCIPAL');
const FINANCE = (0, auth_js_1.requireRole)('DIRECTOR', 'PRINCIPAL', 'ACCOUNTS_OFFICER', 'BURSAR');
async function audit(actorId, action, entity, entityId, detail, ip) {
    try {
        await prisma_js_1.default.auditLog.create({
            data: { actorId, action, entity, entityId, detail, ipAddress: ip }
        });
    }
    catch (err) {
        console.error('[PaymentAudit Error]', err);
    }
}
// ── GET /api/payments ─────────────────────────────────────────────────────────
router.get('/', auth_js_1.auth, FINANCE, async (req, res, next) => {
    try {
        const { campus, termId, category, page = 1, limit = 200 } = req.query;
        const skip = (parseInt(page) - 1) * parseInt(limit);
        const currentTerm = termId
            ? { id: termId }
            : await prisma_js_1.default.term.findFirst({ where: { isCurrent: true }, select: { id: true, name: true } });
        const whereStudent = { role: 'STUDENT', status: 'ACTIVE', ...(campus && { campus }) };
        const payments = await prisma_js_1.default.payment.findMany({
            where: {
                ...(currentTerm && { termId: currentTerm.id }),
                ...(category && { category: category }),
                student: whereStudent,
            },
            select: {
                id: true,
                reference: true,
                amount: true,
                status: true,
                termId: true,
                student: {
                    select: {
                        id: true,
                        name: true,
                        campus: true,
                        enrolledClass: { select: { name: true } },
                        enrolledArm: { select: { fullName: true, class: { select: { name: true } } } },
                    },
                },
            },
            orderBy: { id: 'desc' },
            skip,
            take: parseInt(limit),
        });
        res.json({ payments, currentTerm: currentTerm || null });
    }
    catch (err) {
        next(err);
    }
});
// ── POST /api/payments ────────────────────────────────────────────────────────
router.post('/', auth_js_1.auth, FINANCE, async (req, res, next) => {
    try {
        const { studentId, studentName, amount, reference, channel, notes, termId, category = 'TUITION' } = req.body;
        if (!amount || amount <= 0)
            return res.status(400).json({ error: 'Amount must be greater than zero.' });
        if (!reference)
            return res.status(400).json({ error: 'Reference number is required.' });
        let resolvedStudentId = studentId;
        if (!resolvedStudentId && studentName) {
            const student = await prisma_js_1.default.user.findFirst({
                where: { role: 'STUDENT', name: { equals: studentName.trim(), mode: 'insensitive' } },
                select: { id: true },
            });
            if (student)
                resolvedStudentId = student.id;
        }
        if (!resolvedStudentId) {
            return res.status(400).json({ error: 'Could not identify student. Provide a valid studentId or exact student name.' });
        }
        let resolvedTermId = termId;
        if (!resolvedTermId) {
            const currentTerm = await prisma_js_1.default.term.findFirst({ where: { isCurrent: true }, select: { id: true } });
            if (currentTerm)
                resolvedTermId = currentTerm.id;
        }
        const existing = await prisma_js_1.default.payment.findUnique({ where: { reference } });
        if (existing)
            return res.status(409).json({ error: 'A payment with this reference number already exists.' });
        const payment = await prisma_js_1.default.payment.create({
            data: {
                reference: reference.trim(),
                amount: parseFloat(amount),
                category: category,
                status: 'SUCCESS',
                studentId: resolvedStudentId,
                ...(resolvedTermId && { termId: resolvedTermId }),
            },
            select: {
                id: true, reference: true, amount: true, category: true, status: true,
                student: { select: { id: true, name: true, campus: true } },
            },
        });
        audit(req.user.id, 'CREATE_PAYMENT', 'Payment', payment.id, `${channel || 'manual'}: ₦${amount} for student ${resolvedStudentId}${notes ? ' — ' + notes : ''}`, req.ip);
        res.status(201).json({ payment });
    }
    catch (err) {
        next(err);
    }
});
// ── GET /api/payments/fee-status ─────────────────────────────────────────────
router.get('/fee-status', auth_js_1.auth, FINANCE, async (req, res, next) => {
    try {
        const { campus, classId, armId, status, search, page = 1, limit = 50 } = req.query;
        const skip = (parseInt(page) - 1) * parseInt(limit);
        const currentTerm = await prisma_js_1.default.term.findFirst({
            where: { isCurrent: true },
            select: { id: true, name: true, session: { select: { name: true } } },
        });
        const studentWhere = {
            role: 'STUDENT',
            status: 'ACTIVE',
            ...(campus && { campus: campus }),
            ...(classId && { classId: classId }),
            ...(armId && { armId: armId }),
            ...(search && {
                OR: [
                    { name: { contains: search, mode: 'insensitive' } },
                    { id: { contains: search, mode: 'insensitive' } },
                ],
            }),
        };
        const [students, total] = await Promise.all([
            prisma_js_1.default.user.findMany({
                where: studentWhere,
                select: {
                    id: true,
                    name: true,
                    campus: true,
                    enrolledArm: {
                        select: {
                            id: true,
                            name: true,
                            fullName: true,
                            class: { select: { id: true, name: true, campus: true } },
                        },
                    },
                    enrolledClass: { select: { id: true, name: true, campus: true } },
                    payments: currentTerm
                        ? {
                            where: { termId: currentTerm.id },
                            select: { id: true, reference: true, amount: true, status: true },
                            orderBy: { id: 'desc' },
                            take: 1,
                        }
                        : {
                            select: { id: true, reference: true, amount: true, status: true },
                            orderBy: { id: 'desc' },
                            take: 1,
                        },
                },
                orderBy: { name: 'asc' },
                skip,
                take: parseInt(limit),
            }),
            prisma_js_1.default.user.count({ where: studentWhere }),
        ]);
        const annotated = students.map((s) => {
            const latestPayment = s.payments[0] || null;
            const paid = latestPayment?.status === 'SUCCESS';
            return {
                id: s.id,
                name: s.name,
                campus: s.campus,
                class: s.enrolledClass || s.enrolledArm?.class || null,
                arm: s.enrolledArm || null,
                paymentStatus: paid ? 'PAID' : 'UNPAID',
                paymentAmount: latestPayment?.amount || null,
                paymentReference: latestPayment?.reference || null,
            };
        });
        const filtered = status ? annotated.filter((s) => s.paymentStatus === status) : annotated;
        const allStudents = await prisma_js_1.default.user.findMany({
            where: studentWhere,
            select: {
                payments: currentTerm
                    ? { where: { termId: currentTerm.id }, select: { status: true }, take: 1 }
                    : { select: { status: true }, take: 1 },
            },
        });
        let paidCount = 0;
        let unpaidCount = 0;
        for (const s of allStudents) {
            const payment = s.payments[0];
            if (payment?.status === 'SUCCESS')
                paidCount++;
            else
                unpaidCount++;
        }
        res.json({
            students: filtered,
            total: status ? filtered.length : total,
            page: parseInt(page),
            limit: parseInt(limit),
            currentTerm: currentTerm
                ? { id: currentTerm.id, name: currentTerm.name, session: currentTerm.session.name }
                : null,
            summary: { total: allStudents.length, paid: paidCount, unpaid: unpaidCount },
        });
    }
    catch (err) {
        next(err);
    }
});
// ── GET /api/payments/fee-status/by-class ───────────────────────────────────
router.get('/fee-status/by-class', auth_js_1.auth, FINANCE, async (req, res, next) => {
    try {
        const { campus } = req.query;
        const currentTerm = await prisma_js_1.default.term.findFirst({
            where: { isCurrent: true },
            select: { id: true },
        });
        const students = await prisma_js_1.default.user.findMany({
            where: {
                role: 'STUDENT',
                status: 'ACTIVE',
                ...(campus && { campus: campus }),
            },
            select: {
                id: true,
                enrolledArm: {
                    select: {
                        id: true,
                        name: true,
                        fullName: true,
                        class: { select: { id: true, name: true } },
                    },
                },
                enrolledClass: { select: { id: true, name: true } },
                payments: currentTerm
                    ? { where: { termId: currentTerm.id }, select: { status: true }, take: 1 }
                    : { select: { status: true }, take: 1 },
            },
        });
        const classMap = {};
        for (const s of students) {
            const cls = s.enrolledClass || s.enrolledArm?.class;
            const arm = s.enrolledArm;
            if (!cls)
                continue;
            if (!classMap[cls.id])
                classMap[cls.id] = { id: cls.id, name: cls.name, arms: {}, paid: 0, unpaid: 0 };
            const paid = s.payments[0]?.status === 'SUCCESS';
            if (paid)
                classMap[cls.id].paid++;
            else
                classMap[cls.id].unpaid++;
            if (arm) {
                if (!classMap[cls.id].arms[arm.id]) {
                    classMap[cls.id].arms[arm.id] = { id: arm.id, name: arm.name, fullName: arm.fullName, paid: 0, unpaid: 0 };
                }
                if (paid)
                    classMap[cls.id].arms[arm.id].paid++;
                else
                    classMap[cls.id].arms[arm.id].unpaid++;
            }
        }
        const result = Object.values(classMap).map((c) => ({
            ...c,
            arms: Object.values(c.arms),
        }));
        result.sort((a, b) => a.name.localeCompare(b.name));
        res.json({ classes: result });
    }
    catch (err) {
        next(err);
    }
});
exports.default = router;
