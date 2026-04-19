"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRevenueStats = exports.getDashboardStats = exports.getStudentBalances = exports.upsertFeeConfig = exports.getFeeConfigs = exports.flagTransaction = exports.approveTransaction = exports.VALID_CATEGORIES = void 0;
const prisma_1 = __importDefault(require("../prisma"));
const auditService_1 = require("../services/auditService");
// ── Predefined Fee Categories ──────────────────────────────────────────────
exports.VALID_CATEGORIES = [
    'TUITION',
    'ENTRANCE_FORM',
    'BOOKS',
    'UNIFORM',
    'ICT',
    'EXCURSION',
    'MOCK_EXAM',
    'WAEC_NECO',
    'DEVELOPMENT_LEVY',
    'TRANSPORT',
    'FEEDING',
    'OTHER'
];
const approveTransaction = async (req, res) => {
    const { transactionId } = req.params;
    const userId = req.user.id;
    try {
        const oldTx = await prisma_1.default.payment.findUnique({ where: { id: transactionId } });
        if (!oldTx)
            return res.status(404).json({ error: 'Transaction not found' });
        const updatedTx = await prisma_1.default.payment.update({
            where: { id: transactionId },
            data: { status: 'APPROVED' }
        });
        await (0, auditService_1.createAuditLog)({
            action: 'APPROVE_PAYMENT',
            entity: 'Payment',
            entityId: transactionId,
            detail: 'Transaction approved',
            actorId: userId,
            oldValue: oldTx,
            newValue: updatedTx
        });
        res.json(updatedTx);
    }
    catch (err) {
        res.status(500).json({ error: 'Failed to approve transaction', details: err.message });
    }
};
exports.approveTransaction = approveTransaction;
const flagTransaction = async (req, res) => {
    const { transactionId } = req.params;
    const userId = req.user.id;
    try {
        const oldTx = await prisma_1.default.payment.findUnique({ where: { id: transactionId } });
        if (!oldTx)
            return res.status(404).json({ error: 'Transaction not found' });
        const updatedTx = await prisma_1.default.payment.update({
            where: { id: transactionId },
            data: { status: 'FLAGGED' }
        });
        await (0, auditService_1.createAuditLog)({
            action: 'FLAG_TRANSACTION',
            entity: 'Payment',
            entityId: transactionId,
            detail: 'Transaction flagged',
            actorId: userId,
            oldValue: oldTx,
            newValue: updatedTx
        });
        res.json(updatedTx);
    }
    catch (err) {
        res.status(500).json({ error: 'Failed to flag transaction', details: err.message });
    }
};
exports.flagTransaction = flagTransaction;
// ── GET /api/finance/fees ────────────────────────────────────────────────────
const getFeeConfigs = async (req, res) => {
    try {
        const { sessionId, category } = req.query;
        const where = {
            ...(sessionId && { sessionId: sessionId }),
            ...(category && { category: category })
        };
        const fees = await prisma_1.default.feeConfig.findMany({
            where,
            include: {
                class: { select: { name: true, campus: true } },
                term: { select: { name: true } },
                session: { select: { name: true } }
            },
            orderBy: [
                { category: 'asc' },
                { campus: 'asc' },
                { classId: 'asc' }
            ]
        });
        res.json({ fees, categories: exports.VALID_CATEGORIES });
    }
    catch (err) {
        res.status(500).json({ error: 'Failed to fetch fee configurations', details: err.message });
    }
};
exports.getFeeConfigs = getFeeConfigs;
// ── POST /api/finance/fees ───────────────────────────────────────────────────
const upsertFeeConfig = async (req, res) => {
    try {
        const { category = 'TUITION', amount, campus, classId, termId, sessionId } = req.body;
        if (amount === undefined || amount === null || !sessionId) {
            return res.status(400).json({ error: 'Amount and sessionId are required' });
        }
        if (!exports.VALID_CATEGORIES.includes(category)) {
            return res.status(400).json({ error: `Invalid category. Must be one of: ${exports.VALID_CATEGORIES.join(', ')}` });
        }
        const userId = req.user.id;
        const targetAmount = parseFloat(amount);
        // Prisma upsert doesn't work with null in compound unique, so use findFirst + create/update
        const existing = await prisma_1.default.feeConfig.findFirst({
            where: {
                category,
                campus: campus || null,
                classId: classId || null,
                termId: termId || null,
                sessionId
            }
        });
        let fee;
        if (existing) {
            fee = await prisma_1.default.feeConfig.update({
                where: { id: existing.id },
                data: { amount: targetAmount }
            });
        }
        else {
            fee = await prisma_1.default.feeConfig.create({
                data: {
                    category,
                    amount: targetAmount,
                    campus: campus || null,
                    classId: classId || null,
                    termId: termId || null,
                    sessionId
                }
            });
        }
        await (0, auditService_1.createAuditLog)({
            action: 'SET_FEE_CONFIG',
            entity: 'FeeConfig',
            entityId: fee.id,
            detail: `Set ${category} fee to ₦${targetAmount.toLocaleString()} (Campus: ${campus || 'ALL'}, Class: ${classId || 'ALL'}, Session: ${sessionId})`,
            actorId: userId,
            newValue: fee
        });
        res.json({ message: 'Fee configuration updated successfully', data: fee });
    }
    catch (err) {
        res.status(500).json({ error: 'Failed to update fee configuration', details: err.message });
    }
};
exports.upsertFeeConfig = upsertFeeConfig;
// ── GET /api/finance/student-balances ────────────────────────────────────────
// Returns payment status for all students, with expected fees and total paid.
const getStudentBalances = async (req, res) => {
    try {
        const { sessionId, campus, classId, search } = req.query;
        // Build student filter
        const studentWhere = {
            role: 'STUDENT',
            status: 'ACTIVE',
            ...(campus && { campus: campus }),
            ...(classId && { classId: classId }),
            ...(search && {
                OR: [
                    { name: { contains: search, mode: 'insensitive' } },
                    { email: { contains: search, mode: 'insensitive' } },
                ]
            })
        };
        const students = await prisma_1.default.user.findMany({
            where: studentWhere,
            select: {
                id: true,
                name: true,
                email: true,
                campus: true,
                classId: true,
                enrolledClass: { select: { name: true, campus: true } },
            },
            orderBy: { name: 'asc' }
        });
        // Fetch all fee configs for the session (or the latest session)
        let targetSessionId = sessionId;
        if (!targetSessionId) {
            const latestSession = await prisma_1.default.academicSession.findFirst({
                where: { status: 'ACTIVE' },
                orderBy: { year: 'desc' },
                select: { id: true }
            });
            targetSessionId = latestSession?.id;
        }
        if (!targetSessionId) {
            return res.json({ students: [], sessionId: null });
        }
        // Get all fee configs for the session
        const feeConfigs = await prisma_1.default.feeConfig.findMany({
            where: { sessionId: targetSessionId },
            include: { class: { select: { name: true } } }
        });
        // Get all payments for these students in this session
        const studentIds = students.map(s => s.id);
        const payments = await prisma_1.default.payment.findMany({
            where: {
                studentId: { in: studentIds },
                sessionId: targetSessionId,
                status: 'APPROVED'
            },
            select: {
                studentId: true,
                amount: true,
                category: true
            }
        });
        // Index payments by student
        const paymentsByStudent = {};
        for (const p of payments) {
            if (!paymentsByStudent[p.studentId])
                paymentsByStudent[p.studentId] = [];
            paymentsByStudent[p.studentId].push(p);
        }
        // Resolve expected fees for each student (hierarchical: class > campus > global)
        const result = students.map(student => {
            const studentPayments = paymentsByStudent[student.id] || [];
            const totalPaid = studentPayments.reduce((sum, p) => sum + p.amount, 0);
            // Calculate expected total from fee configs
            let expectedTotal = 0;
            const feeBreakdown = [];
            // Group fee configs by category
            const categoriesUsed = [...new Set(feeConfigs.map(f => f.category))];
            for (const category of categoriesUsed) {
                const categoryConfigs = feeConfigs.filter(f => f.category === category);
                // Hierarchical lookup: class-specific > campus-specific > global
                let matchedFee = categoryConfigs.find(f => f.classId === student.classId) ||
                    categoryConfigs.find(f => !f.classId && f.campus === student.campus) ||
                    categoryConfigs.find(f => !f.classId && !f.campus);
                if (matchedFee) {
                    expectedTotal += matchedFee.amount;
                    feeBreakdown.push({
                        category: matchedFee.category,
                        expected: matchedFee.amount,
                        paid: studentPayments.filter((p) => p.category === matchedFee.category).reduce((s, p) => s + p.amount, 0)
                    });
                }
            }
            const balance = expectedTotal - totalPaid;
            return {
                id: student.id,
                name: student.name,
                className: student.enrolledClass?.name || '—',
                campus: student.enrolledClass?.campus || student.campus || '—',
                expectedTotal,
                totalPaid,
                balance,
                status: balance <= 0 ? 'PAID' : (totalPaid > 0 ? 'PARTIAL' : 'UNPAID'),
                feeBreakdown
            };
        });
        // Aggregate summary for dashboard
        const summary = {
            totalStudents: result.length,
            totalExpected: result.reduce((s, st) => s + st.expectedTotal, 0),
            totalCollected: result.reduce((s, st) => s + st.totalPaid, 0),
            countPaid: result.filter(s => s.status === 'PAID').length,
            countPartial: result.filter(s => s.status === 'PARTIAL').length,
            countUnpaid: result.filter(s => s.status === 'UNPAID').length,
        };
        res.json({ students: result, summary, sessionId: targetSessionId });
    }
    catch (err) {
        res.status(500).json({ error: 'Failed to fetch student balances', details: err.message });
    }
};
exports.getStudentBalances = getStudentBalances;
/**
 * GET dashboard stats (High Performance)
 */
const getDashboardStats = async (req, res) => {
    try {
        // 1. Session Discovery: Use ACTIVE or LATEST
        let session = await prisma_1.default.academicSession.findFirst({ where: { status: 'ACTIVE' } });
        if (!session)
            session = await prisma_1.default.academicSession.findFirst({ orderBy: { year: 'desc' } });
        if (!session) {
            return res.json({ totalStudents: 0, totalCollected: 0, totalExpected: 0, sessionName: 'None' });
        }
        // 2. Aggregate Data
        const [enrollment, collections] = await Promise.all([
            prisma_1.default.user.count({ where: { role: 'STUDENT' } }),
            prisma_1.default.payment.aggregate({
                where: { sessionId: session.id, status: 'APPROVED', category: 'TUITION' },
                _sum: { amount: true }
            })
        ]);
        // 3. Expected Revenue Estimation
        const studentGroups = await prisma_1.default.user.groupBy({
            by: ['classId', 'campus'],
            where: { role: 'STUDENT' },
            _count: { _all: true }
        });
        const feeConfigs = await prisma_1.default.feeConfig.findMany({
            where: { sessionId: session.id, category: 'TUITION' }
        });
        let totalExpected = 0;
        for (const group of studentGroups) {
            const config = feeConfigs.find(c => c.classId === group.classId) ||
                feeConfigs.find(c => c.campus === group.campus && !c.classId) ||
                feeConfigs.find(c => !c.campus && !c.classId);
            if (config) {
                totalExpected += (Number(config.amount) * group._count._all);
            }
        }
        res.json({
            totalStudents: enrollment,
            totalCollected: collections._sum.amount || 0,
            totalExpected,
            collectionRate: totalExpected > 0 ? Math.round((collections._sum.amount || 0) / totalExpected * 100) : 0,
            sessionName: session.name
        });
    }
    catch (err) {
        console.error('[DashboardStats Error]', err);
        res.status(500).json({ error: 'Failed to fetch dashboard stats' });
    }
};
exports.getDashboardStats = getDashboardStats;
/**
 * GET revenue stats for the last 6 weeks (Optimized)
 */
const getRevenueStats = async (req, res) => {
    try {
        let session = await prisma_1.default.academicSession.findFirst({ where: { status: 'ACTIVE' } });
        if (!session)
            session = await prisma_1.default.academicSession.findFirst({ orderBy: { year: 'desc' } });
        if (!session)
            return res.json({ labels: ['W1', 'W2', 'W3', 'W4', 'W5', 'W6'], data: [0, 0, 0, 0, 0, 0] });
        const sixWeeksAgo = new Date();
        sixWeeksAgo.setDate(sixWeeksAgo.getDate() - 42);
        const payments = await prisma_1.default.payment.findMany({
            where: {
                status: 'APPROVED',
                category: 'TUITION',
                sessionId: session.id,
                createdAt: { gte: sixWeeksAgo }
            },
            select: { amount: true, createdAt: true },
        });
        const weeks = [0, 0, 0, 0, 0, 0];
        const now = new Date();
        payments.forEach((p) => {
            const createdDate = p.createdAt ? new Date(p.createdAt) : now;
            const diffDays = Math.floor((now.getTime() - createdDate.getTime()) / (1000 * 3600 * 24));
            const weekIndex = Math.floor(diffDays / 7);
            if (weekIndex >= 0 && weekIndex < 6) {
                weeks[5 - weekIndex] += p.amount;
            }
        });
        res.json({
            labels: ['W1', 'W2', 'W3', 'W4', 'W5', 'W6'],
            data: weeks.map(w => w / 1e6),
            totalRaw: weeks.reduce((a, b) => a + b, 0),
            sessionName: session.name
        });
    }
    catch (err) {
        console.error('[RevenueStats Error]', err.message);
        res.status(500).json({ error: 'Failed to fetch revenue stats' });
    }
};
exports.getRevenueStats = getRevenueStats;
