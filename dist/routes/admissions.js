"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const prisma_js_1 = __importDefault(require("../prisma.js"));
const auth_js_1 = require("../middleware/auth.js");
const audit_js_1 = require("../middleware/audit.js");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const router = express_1.default.Router();
const MANAGEMENT = (0, auth_js_1.requireRole)('DIRECTOR', 'PRINCIPAL', 'ADMIN_STAFF', 'HEAD_TEACHER', 'VP_ADMIN', 'VP_ACADEMICS', 'ASST_HEAD_TEACHER', 'BURSAR');
const ADMISSION_OFFICERS = (0, auth_js_1.requireRole)('DIRECTOR', 'PRINCIPAL', 'ADMIN_STAFF', 'HEAD_TEACHER', 'VP_ADMIN');
const ACADEMIC_REVIEWERS = (0, auth_js_1.requireRole)('DIRECTOR', 'VP_ACADEMICS', 'ASST_HEAD_TEACHER');
const FINANCIAL_GATEKEEPERS = (0, auth_js_1.requireRole)('DIRECTOR', 'BURSAR');
// ── GET /api/admissions/stats – KPI counts for the dashboard ─────────────
router.get('/stats', auth_js_1.auth, MANAGEMENT, async (req, res, next) => {
    try {
        const { sessionId } = req.query;
        let targetSessionId = sessionId;
        if (!targetSessionId) {
            const currentSession = await prisma_js_1.default.academicSession.findFirst({
                where: { status: 'ACTIVE' },
                select: { id: true },
            });
            targetSessionId = currentSession?.id;
        }
        const where = targetSessionId ? { sessionId: targetSessionId } : {};
        const [total, qualified, offered, feeConfirmed, enrolled, transfers] = await Promise.all([
            prisma_js_1.default.admission.count({ where }),
            prisma_js_1.default.admission.count({ where: { ...where, status: { in: ['QUALIFIED', 'OFFERED', 'FEE_CONFIRMED', 'ENROLLED'] } } }),
            prisma_js_1.default.admission.count({ where: { ...where, status: { in: ['OFFERED', 'FEE_CONFIRMED', 'ENROLLED'] } } }),
            prisma_js_1.default.admission.count({ where: { ...where, status: { in: ['FEE_CONFIRMED', 'ENROLLED'] } } }),
            prisma_js_1.default.admission.count({ where: { ...where, status: 'ENROLLED' } }),
            prisma_js_1.default.admission.count({ where: { ...where, type: 'TRANSFER' } }),
        ]);
        const yieldPct = total > 0 ? ((enrolled / total) * 100).toFixed(1) : '0.0';
        res.json({ total, qualified, offered, feeConfirmed, enrolled, transfers, yieldPct });
    }
    catch (err) {
        next(err);
    }
});
// ── GET /api/admissions – list with filters ───────────────────────────────
router.get('/', auth_js_1.auth, MANAGEMENT, async (req, res, next) => {
    try {
        const { status, campus, type, sessionId, page = 1, limit = 100 } = req.query;
        const skip = (parseInt(page) - 1) * parseInt(limit);
        const where = {};
        if (status)
            where.status = status.toUpperCase();
        if (campus)
            where.campus = campus.toUpperCase();
        if (type)
            where.type = type.toUpperCase();
        if (sessionId)
            where.sessionId = sessionId;
        const [admissions, total] = await Promise.all([
            prisma_js_1.default.admission.findMany({
                where,
                orderBy: { createdAt: 'desc' },
                skip,
                take: parseInt(limit),
                include: { session: { select: { name: true } } },
            }),
            prisma_js_1.default.admission.count({ where }),
        ]);
        res.json({ admissions, total });
    }
    catch (err) {
        next(err);
    }
});
// ── POST /api/admissions – create new application ─────────────────────────
router.post('/', auth_js_1.auth, ADMISSION_OFFICERS, async (req, res, next) => {
    try {
        const { applicantName, campus, targetClass, type, parentName, parentPhone, parentEmail, notes, sessionId } = req.body;
        if (!applicantName || !campus || !targetClass || !parentName || !parentPhone) {
            return res.status(400).json({ error: 'applicantName, campus, targetClass, parentName, and parentPhone are required' });
        }
        let targetSessionId = sessionId;
        if (!targetSessionId) {
            const currentSession = await prisma_js_1.default.academicSession.findFirst({
                where: { status: 'ACTIVE' },
                select: { id: true },
            });
            targetSessionId = currentSession?.id;
        }
        const admission = await prisma_js_1.default.admission.create({
            data: {
                applicantName: applicantName.trim().slice(0, 150),
                campus: campus.toUpperCase(),
                targetClass: targetClass.trim().slice(0, 50),
                type: (type || 'NEW').toUpperCase(),
                parentName: parentName.trim().slice(0, 150),
                parentPhone: parentPhone.trim().slice(0, 30),
                parentEmail: parentEmail?.trim().slice(0, 150) || null,
                notes: notes?.trim().slice(0, 500) || null,
                sessionId: targetSessionId || null,
                status: 'APPLIED',
            },
        });
        (0, audit_js_1.audit)(req.user.id, 'ADMISSION_CREATED', 'Admission', admission.id, `Applicant: ${applicantName}`, req.ip);
        res.status(201).json({ admission });
    }
    catch (err) {
        next(err);
    }
});
// ── PATCH /api/admissions/:id – update status & automation ────────────────
router.patch('/:id', auth_js_1.auth, MANAGEMENT, async (req, res, next) => {
    try {
        const { id } = req.params;
        const { status, notes, entranceScore, classId, armId } = req.body;
        const userRole = req.user.role;
        const existing = await prisma_js_1.default.admission.findUnique({ where: { id } });
        if (!existing)
            return res.status(404).json({ error: 'Admission not found' });
        // Restriction: Only VPs/Asst Head can enter scores
        if (entranceScore !== undefined) {
            const allowedRoles = ['DIRECTOR', 'VP_ACADEMICS', 'ASST_HEAD_TEACHER'];
            if (!allowedRoles.includes(userRole)) {
                return res.status(403).json({ error: 'Only VP Academics or Assistant Head Teacher can enter entrance scores.' });
            }
        }
        // Restriction: Only Bursar/Director can set to ENROLLED
        if (status === 'ENROLLED' && !['DIRECTOR', 'BURSAR'].includes(userRole)) {
            return res.status(403).json({ error: 'Only the Bursar can confirm tuition and move an applicant to ENROLLED status.' });
        }
        // AUTOMATION: Create User profiles if status is ENROLLED
        if (status === 'ENROLLED' && existing.status !== 'ENROLLED') {
            if (!classId || !armId) {
                return res.status(400).json({ error: 'Destination Class and Arm must be selected before enrollment.' });
            }
            // 1. Generate Emails
            const year = new Date().getFullYear();
            const baseEmail = existing.applicantName.toLowerCase().replace(/\s+/g, '.');
            const studentEmail = `${baseEmail}.${year}@wajinaschools.com`;
            const parentEmail = existing.parentEmail || `p.${baseEmail}@wajinaschools.com`;
            // 2. Hash Default Password
            const hashedPw = await bcryptjs_1.default.hash('Wajina@2026', 10);
            try {
                await prisma_js_1.default.$transaction(async (tx) => {
                    // A. Create or Find Parent
                    let parent = await tx.user.findUnique({ where: { email: parentEmail } });
                    if (!parent) {
                        parent = await tx.user.create({
                            data: {
                                email: parentEmail,
                                name: existing.parentName,
                                phone: existing.parentPhone,
                                password: hashedPw,
                                role: 'PARENT',
                                status: 'ACTIVE',
                                campus: existing.campus,
                            }
                        });
                    }
                    // B. Create Student
                    await tx.user.create({
                        data: {
                            email: studentEmail,
                            name: existing.applicantName,
                            password: hashedPw,
                            role: 'STUDENT',
                            status: 'ACTIVE',
                            campus: existing.campus,
                            classId: classId,
                            armId: armId,
                            parentId: parent.id,
                        }
                    });
                    // C. Update Admission status
                    await tx.admission.update({
                        where: { id },
                        data: {
                            status: 'ENROLLED',
                            classId,
                            armId,
                            notes: notes || existing.notes
                        }
                    });
                });
                (0, audit_js_1.audit)(req.user.id, 'ADMISSION_AUTO_ENROLLED', 'Admission', id, `Student and Parent profiles created for ${existing.applicantName}`, req.ip);
                return res.json({ message: 'Success! Student and Parent profiles have been created and assigned to class.' });
            }
            catch (e) {
                if (e.code === 'P2002')
                    return res.status(400).json({ error: 'A student with this generated email already exists.' });
                throw e;
            }
        }
        // General Patch (Non-Enrollment)
        const updated = await prisma_js_1.default.admission.update({
            where: { id },
            data: {
                ...(status && { status: status.toUpperCase() }),
                ...(notes !== undefined && { notes: notes?.trim().slice(0, 500) || null }),
                ...(entranceScore !== undefined && { entranceScore: parseFloat(entranceScore) }),
                ...(classId && { classId }),
                ...(armId && { armId }),
            },
        });
        (0, audit_js_1.audit)(req.user.id, 'ADMISSION_UPDATED', 'Admission', id, `Status: ${status || existing.status}`, req.ip);
        res.json({ admission: updated });
    }
    catch (err) {
        next(err);
    }
});
exports.default = router;
