"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const prisma_1 = __importDefault(require("../prisma"));
const auth_1 = require("../middleware/auth");
const audit_1 = require("../middleware/audit");
const engine = __importStar(require("../utils/academicEngine"));
const router = express_1.default.Router();
const MANAGEMENT = (0, auth_1.requireRole)('DIRECTOR', 'PRINCIPAL', 'HEAD_TEACHER', 'VP_ADMIN', 'VP_ACADEMICS', 'ASST_HEAD_TEACHER');
const TEACHER_PLUS = (0, auth_1.requireRole)('DIRECTOR', 'PRINCIPAL', 'HEAD_TEACHER', 'VP_ADMIN', 'VP_ACADEMICS', 'ASST_HEAD_TEACHER', 'TEACHER', 'HOD', 'DEAN_STUDENTS', 'ACADEMIC_STAFF');
const GRADE_SELECT = {
    id: true,
    firstCA: true,
    secondCA: true,
    thirdCA: true,
    fourthCA: true,
    fifthCA: true,
    exam: true,
    total: true,
    grade: true,
    status: true,
    studentId: true,
    subjectId: true,
    teacherComment: true,
    formMasterRemark: true,
    principalRemark: true,
    returnReason: true,
    position: true,
    createdAt: true,
    updatedAt: true,
    student: { select: { id: true, name: true, enrolledArm: { select: { id: true, fullName: true } } } },
    subject: { select: { id: true, name: true, teacher: { select: { id: true, name: true } } } },
    term: { select: { id: true, name: true } },
};
// ─────────────────────────────────────────────────────────────────
// GET /api/grades
// Query: subjectId, studentId, termId, status, armId, page, limit
// ─────────────────────────────────────────────────────────────────
router.get('/', auth_1.auth, async (req, res, next) => {
    try {
        const { subjectId, studentId, termId, status, armId, page = 1, limit = 100 } = req.query;
        const skip = (parseInt(page) - 1) * parseInt(limit);
        const role = req.user.role;
        // Strict debt blocking for students
        if (role === 'STUDENT') {
            const canView = await engine.canViewResults(req.user.id, termId);
            if (!canView) {
                return res.status(403).json({
                    error: 'Access Denied',
                    message: 'Your results are currently locked. Please ensure all school fees are fully paid to gain access.'
                });
            }
        }
        let where = {};
        if (role === 'STUDENT') {
            where = { studentId: req.user.id, status: 'PRINCIPAL_APPROVED' };
        }
        else if (role === 'PARENT') {
            const wards = await prisma_1.default.user.findMany({ where: { parentId: req.user.id }, select: { id: true } });
            where = { studentId: { in: wards.map((w) => w.id) }, status: 'PRINCIPAL_APPROVED' };
        }
        else if (role === 'TEACHER' || role === 'ACADEMIC_STAFF') {
            const subjects = await prisma_1.default.subject.findMany({
                where: { teacherId: req.user.id },
                select: { id: true },
            });
            where.subjectId = { in: subjects.map((s) => s.id) };
        }
        if (subjectId)
            where.subjectId = subjectId;
        if (studentId && role !== 'STUDENT' && role !== 'PARENT')
            where.studentId = studentId;
        if (termId)
            where.termId = termId;
        if (status && role !== 'STUDENT' && role !== 'PARENT')
            where.status = status;
        if (armId)
            where.student = { armId };
        const [grades, total] = await Promise.all([
            prisma_1.default.grade.findMany({
                where,
                select: GRADE_SELECT,
                orderBy: [{ student: { name: 'asc' } }],
                skip,
                take: parseInt(limit),
            }),
            prisma_1.default.grade.count({ where }),
        ]);
        res.json({ grades, total, page: parseInt(page), limit: parseInt(limit) });
    }
    catch (err) {
        next(err);
    }
});
// ─────────────────────────────────────────────────────────────────
// PUT /api/grades/upsert
// ─────────────────────────────────────────────────────────────────
router.put('/upsert', auth_1.auth, TEACHER_PLUS, async (req, res, next) => {
    try {
        const { studentId, subjectId, termId, sessionId, firstCA, secondCA, thirdCA, fourthCA, fifthCA, exam, teacherComment } = req.body;
        if (!studentId || !subjectId) {
            return res.status(400).json({ error: 'studentId and subjectId are required.' });
        }
        const student = await prisma_1.default.user.findUnique({
            where: { id: studentId },
            include: { enrolledClass: true }
        });
        if (!student)
            return res.status(404).json({ error: 'Student not found.' });
        const config = engine.getAssessmentConfig(student.campus, student.enrolledClass?.category, student.enrolledClass?.name);
        const ca1 = parseFloat(firstCA) || 0;
        const ca2 = parseFloat(secondCA) || 0;
        const ca3 = parseFloat(thirdCA) || 0;
        const ca4 = parseFloat(fourthCA) || 0;
        const ca5 = parseFloat(fifthCA) || 0;
        const ex = parseFloat(exam) || 0;
        const inputScores = [ca1, ca2, ca3, ca4, ca5, ex];
        for (let i = 0; i < config.maxScores.length; i++) {
            const val = i < 5 ? inputScores[i] : ex;
            const max = config.maxScores[i];
            if (val > max) {
                return res.status(400).json({ error: `${config.labels[i]} exceeds maximum points (${max}).` });
            }
        }
        // Verify teacher ownership
        const role = req.user.role;
        if (role === 'TEACHER' || role === 'ACADEMIC_STAFF') {
            const subject = await prisma_1.default.subject.findUnique({ where: { id: subjectId } });
            if (!subject || subject.teacherId !== req.user.id) {
                return res.status(403).json({ error: 'You can only enter grades for your own subjects.' });
            }
        }
        const existing = await prisma_1.default.grade.findUnique({
            where: { studentId_subjectId_termId: { studentId, subjectId, termId: termId || '' } },
        });
        if (existing && !['DRAFT', 'RETURNED'].includes(existing.status)) {
            return res.status(409).json({ error: `Cannot edit a grade with status: ${existing.status}.` });
        }
        const result = engine.calculateScore({
            firstCA: ca1, secondCA: ca2, thirdCA: ca3, fourthCA: ca4, fifthCA: ca5, exam: ex
        }, config);
        // Auto-generate reports/remarks
        const autoRemarks = engine.generateReports(result.total);
        const gradeData = {
            studentId,
            subjectId,
            termId,
            sessionId,
            firstCA: ca1,
            secondCA: ca2,
            thirdCA: ca3,
            fourthCA: ca4,
            fifthCA: ca5,
            exam: ex,
            total: result.total,
            grade: result.grade,
            teacherComment: autoRemarks.teacher, // Auto-generated
            principalRemark: autoRemarks.principal, // Auto-generated
            status: 'SUBMITTED'
        };
        const grade = await prisma_1.default.grade.upsert({
            where: {
                studentId_subjectId_termId: { studentId, subjectId, termId: termId || '' }
            },
            update: gradeData,
            create: { ...gradeData, studentId, subjectId },
            select: GRADE_SELECT
        });
        res.json(grade);
    }
    catch (err) {
        next(err);
    }
});
// ─────────────────────────────────────────────────────────────────
// POST /api/grades/submit-batch
// ─────────────────────────────────────────────────────────────────
router.post('/submit-batch', auth_1.auth, TEACHER_PLUS, async (req, res, next) => {
    try {
        const { subjectId, termId } = req.body;
        if (!subjectId)
            return res.status(400).json({ error: 'subjectId is required.' });
        const role = req.user.role;
        if (role === 'TEACHER' || role === 'ACADEMIC_STAFF') {
            const subject = await prisma_1.default.subject.findUnique({ where: { id: subjectId } });
            if (!subject || subject.teacherId !== req.user.id) {
                return res.status(403).json({ error: 'Not your subject.' });
            }
        }
        const { count } = await prisma_1.default.grade.updateMany({
            where: { subjectId, status: { in: ['DRAFT', 'RETURNED'] }, ...(termId && { termId }) },
            data: { status: 'SUBMITTED' },
        });
        (0, audit_1.audit)(req.user.id, 'GRADES_SUBMITTED', 'Grade', subjectId, `${count} grades submitted for review by ${req.user.name}`, req.ip);
        res.json({ submitted: count });
    }
    catch (err) {
        next(err);
    }
});
// ─────────────────────────────────────────────────────────────────
// POST /api/grades/:id/approve
// ─────────────────────────────────────────────────────────────────
router.post('/:id/approve', auth_1.auth, async (req, res, next) => {
    try {
        const role = req.user.role;
        if (!['DIRECTOR', 'PRINCIPAL', 'HEAD_TEACHER', 'VP_ADMIN', 'VP_ACADEMICS', 'ASST_HEAD_TEACHER', 'TEACHER', 'ACADEMIC_STAFF'].includes(role)) {
            return res.status(403).json({ error: 'Only management, form masters or principals can approve grades.' });
        }
        const grade = await prisma_1.default.grade.findUnique({ where: { id: req.params.id } });
        if (!grade)
            return res.status(404).json({ error: 'Grade not found.' });
        let nextStatus;
        let updateData = {};
        if (grade.status === 'SUBMITTED') {
            if (role === 'TEACHER' || role === 'ACADEMIC_STAFF') {
                const student = await prisma_1.default.user.findUnique({
                    where: { id: grade.studentId },
                    select: { enrolledClass: { select: { formMasterId: true } } },
                });
                if (student?.enrolledClass?.formMasterId !== req.user.id) {
                    return res.status(403).json({ error: 'Only the form master for this class can approve at this stage.' });
                }
            }
            nextStatus = 'FORM_APPROVED';
            updateData.formMasterRemark = req.body.remark || null;
        }
        else if (grade.status === 'FORM_APPROVED') {
            if (!['DIRECTOR', 'PRINCIPAL', 'HEAD_TEACHER', 'VP_ADMIN'].includes(role)) {
                return res.status(403).json({ error: 'Only Principal, Head Teacher or Director can give final approval.' });
            }
            nextStatus = 'PRINCIPAL_APPROVED';
            updateData.principalRemark = req.body.remark || null;
        }
        else {
            return res.status(409).json({ error: `Grade status "${grade.status}" cannot be approved at this stage.` });
        }
        const updated = await prisma_1.default.grade.update({
            where: { id: req.params.id },
            data: { status: nextStatus, ...updateData },
            select: GRADE_SELECT,
        });
        (0, audit_1.audit)(req.user.id, 'GRADE_APPROVED', 'Grade', grade.id, `${req.user.name} approved grade → ${nextStatus}`, req.ip);
        // HOD Notification Logic for High Performance (>80%)
        if (nextStatus === 'PRINCIPAL_APPROVED' && updated.total >= 80) {
            try {
                const subjectWithDept = await prisma_1.default.subject.findUnique({
                    where: { id: updated.subjectId },
                    include: { department: true }
                });
                if (subjectWithDept?.department?.hodId) {
                    await prisma_1.default.request.create({
                        data: {
                            level: 'K3',
                            title: 'High Performance Alert',
                            description: `Student ${updated.student.name} scored ${updated.total}% in ${subjectWithDept.name}. HOD recognition recommended.`,
                            senderId: req.user.id,
                            receiverId: subjectWithDept.department.hodId,
                            status: 'PENDING'
                        }
                    });
                }
            }
            catch (notifErr) {
                console.error('Failed to send HOD notification:', notifErr);
            }
        }
        res.json(updated);
    }
    catch (err) {
        next(err);
    }
});
// ─────────────────────────────────────────────────────────────────
// POST /api/grades/:id/return
// ─────────────────────────────────────────────────────────────────
router.post('/:id/return', auth_1.auth, async (req, res, next) => {
    try {
        const role = req.user.role;
        if (!['DIRECTOR', 'PRINCIPAL', 'TEACHER', 'ACADEMIC_STAFF'].includes(role)) {
            return res.status(403).json({ error: 'Not authorised.' });
        }
        const grade = await prisma_1.default.grade.findUnique({ where: { id: req.params.id } });
        if (!grade)
            return res.status(404).json({ error: 'Grade not found.' });
        if (!['SUBMITTED', 'FORM_APPROVED'].includes(grade.status)) {
            return res.status(409).json({ error: `Grade in status "${grade.status}" cannot be returned.` });
        }
        if (!req.body.reason?.trim()) {
            return res.status(400).json({ error: 'A return reason is required.' });
        }
        const updated = await prisma_1.default.grade.update({
            where: { id: req.params.id },
            data: { status: 'RETURNED', returnReason: req.body.reason.trim() },
            select: GRADE_SELECT,
        });
        (0, audit_1.audit)(req.user.id, 'GRADE_RETURNED', 'Grade', grade.id, `Grade returned for correction: ${req.body.reason}`, req.ip);
        res.json(updated);
    }
    catch (err) {
        next(err);
    }
});
// ─────────────────────────────────────────────────────────────────
// GET /api/grades/pending-review
// ─────────────────────────────────────────────────────────────────
router.get('/pending-review', auth_1.auth, async (req, res, next) => {
    try {
        const role = req.user.role;
        const { termId, page = 1, limit = 50 } = req.query;
        const skip = (parseInt(page) - 1) * parseInt(limit);
        let where = {};
        if (role === 'DIRECTOR' || role === 'PRINCIPAL') {
            where.status = 'FORM_APPROVED';
        }
        else if (role === 'TEACHER' || role === 'ACADEMIC_STAFF') {
            const formClass = await prisma_1.default.class.findFirst({
                where: { formMasterId: req.user.id },
                select: { id: true },
            });
            if (!formClass)
                return res.json({ grades: [], total: 0, page: 1, limit: parseInt(limit) });
            where = {
                status: 'SUBMITTED',
                student: { classId: formClass.id },
            };
        }
        else {
            return res.status(403).json({ error: 'Not authorised.' });
        }
        if (termId)
            where.termId = termId;
        const [grades, total] = await Promise.all([
            prisma_1.default.grade.findMany({ where, select: GRADE_SELECT, skip, take: parseInt(limit), orderBy: { updatedAt: 'asc' } }),
            prisma_1.default.grade.count({ where }),
        ]);
        res.json({ grades, total, page: parseInt(page), limit: parseInt(limit) });
    }
    catch (err) {
        next(err);
    }
});
// ─────────────────────────────────────────────────────────────────
// GET /api/grades/summary/arm/:armId
// Term-level summary for an arm: per-subject averages, top/bottom performers.
// ─────────────────────────────────────────────────────────────────
router.get('/summary/arm/:armId', auth_1.auth, MANAGEMENT, async (req, res, next) => {
    try {
        const { armId } = req.params;
        const { termId } = req.query;
        const where = {
            student: { armId },
            ...(termId && { termId }),
            status: 'PRINCIPAL_APPROVED',
        };
        const grades = await prisma_1.default.grade.findMany({
            where,
            select: {
                total: true,
                grade: true,
                subject: { select: { id: true, name: true } },
                student: { select: { id: true, name: true } },
            },
        });
        const bySubject = {};
        for (const g of grades) {
            const sid = g.subject.id;
            if (!bySubject[sid])
                bySubject[sid] = { name: g.subject.name, scores: [] };
            bySubject[sid].scores.push(g.total);
        }
        const subjectSummary = Object.values(bySubject).map((s) => {
            const avg = s.scores.reduce((a, b) => a + b, 0) / s.scores.length;
            return { name: s.name, count: s.scores.length, average: Math.round(avg * 10) / 10 };
        }).sort((a, b) => b.average - a.average);
        const byStudent = {};
        for (const g of grades) {
            if (!byStudent[g.student.id])
                byStudent[g.student.id] = { name: g.student.name, scores: [] };
            byStudent[g.student.id].scores.push(g.total);
        }
        const studentRanking = Object.values(byStudent).map((s) => {
            const avg = s.scores.reduce((a, b) => a + b, 0) / s.scores.length;
            return { name: s.name, subjectCount: s.scores.length, average: Math.round(avg * 10) / 10 };
        }).sort((a, b) => b.average - a.average).map((s, i) => ({ ...s, position: i + 1 }));
        res.json({ subjectSummary, studentRanking, totalGrades: grades.length });
    }
    catch (err) {
        next(err);
    }
});
// ─────────────────────────────────────────────────────────────────
// GET /api/grades/campus-stats
// ─────────────────────────────────────────────────────────────────
router.get('/campus-stats', auth_1.auth, MANAGEMENT, async (req, res, next) => {
    try {
        const { termId } = req.query;
        const termFilter = termId ? { termId } : {};
        const [submitted, formApproved, principalApproved, returned] = await Promise.all([
            prisma_1.default.grade.count({ where: { ...termFilter, status: 'SUBMITTED' } }),
            prisma_1.default.grade.count({ where: { ...termFilter, status: 'FORM_APPROVED' } }),
            prisma_1.default.grade.count({ where: { ...termFilter, status: 'PRINCIPAL_APPROVED' } }),
            prisma_1.default.grade.count({ where: { ...termFilter, status: 'RETURNED' } }),
        ]);
        const approvedGrades = await prisma_1.default.grade.findMany({
            where: { ...termFilter, status: 'PRINCIPAL_APPROVED' },
            select: {
                total: true,
                subject: { select: { name: true } },
                student: { select: { id: true, enrolledClass: { select: { campus: true } } } },
            },
        });
        const byStudent = {};
        const subjectPass = {};
        for (const g of approvedGrades) {
            const sid = g.student.id;
            const campus = g.student.enrolledClass?.campus || 'SECONDARY';
            if (!byStudent[sid])
                byStudent[sid] = { scores: [], campus };
            byStudent[sid].scores.push(g.total);
            const sname = g.subject.name;
            if (!subjectPass[sname])
                subjectPass[sname] = { pass: 0, total: 0 };
            subjectPass[sname].total++;
            if (g.total >= 50)
                subjectPass[sname].pass++;
        }
        const students = Object.values(byStudent);
        const totalStudents = students.length;
        const byCampus = { PRIMARY: { total: 0, ready: 0 }, SECONDARY: { total: 0, ready: 0 } };
        let atBenchmark = 0;
        for (const s of students) {
            const avg = s.scores.reduce((a, b) => a + b, 0) / s.scores.length;
            const campus = s.campus === 'PRIMARY' ? 'PRIMARY' : 'SECONDARY';
            byCampus[campus].total++;
            if (avg >= 50) {
                atBenchmark++;
                byCampus[campus].ready++;
            }
        }
        const subjectRates = Object.entries(subjectPass).map(([name, d]) => ({
            name,
            passRate: d.total ? Math.round((d.pass / d.total) * 1000) / 10 : 0,
            count: d.total,
        })).sort((a, b) => b.passRate - a.passRate);
        res.json({
            pipeline: { submitted, formApproved, principalApproved, returned },
            promotionStats: {
                totalStudents,
                atBenchmark,
                atBenchmarkPct: totalStudents ? Math.round((atBenchmark / totalStudents) * 1000) / 10 : null,
                atRisk: totalStudents - atBenchmark,
                primary: { total: byCampus.PRIMARY.total, ready: byCampus.PRIMARY.ready,
                    readyPct: byCampus.PRIMARY.total ? Math.round((byCampus.PRIMARY.ready / byCampus.PRIMARY.total) * 1000) / 10 : null },
                secondary: { total: byCampus.SECONDARY.total, ready: byCampus.SECONDARY.ready,
                    readyPct: byCampus.SECONDARY.total ? Math.round((byCampus.SECONDARY.ready / byCampus.SECONDARY.total) * 1000) / 10 : null },
            },
            subjectRates,
        });
    }
    catch (err) {
        next(err);
    }
});
// ─────────────────────────────────────────────────────────────────
// GET /api/grades/annual-report/:studentId
// Returns aggregated mean of results from 1st, 2nd, and 3rd terms.
// ─────────────────────────────────────────────────────────────────
router.get('/annual-report/:studentId', auth_1.auth, async (req, res, next) => {
    try {
        const { studentId } = req.params;
        const { sessionId } = req.query;
        const role = req.user.role;
        // Security
        if (role === 'STUDENT' && studentId !== req.user.id)
            return res.status(403).json({ error: 'Not authorized' });
        const grades = await prisma_1.default.grade.findMany({
            where: {
                studentId,
                sessionId: sessionId,
                status: 'PRINCIPAL_APPROVED'
            },
            select: {
                total: true,
                term: { select: { name: true } },
                subject: { select: { id: true, name: true } }
            }
        });
        // Group by subject then term
        const subjectMap = {};
        for (const g of grades) {
            if (!subjectMap[g.subject.id]) {
                subjectMap[g.subject.id] = { name: g.subject.name, terms: { FIRST: null, SECOND: null, THIRD: null } };
            }
            subjectMap[g.subject.id].terms[g.term.name] = g.total;
        }
        const report = Object.values(subjectMap).map((s) => {
            const scores = Object.values(s.terms).filter(v => v !== null);
            const annualMean = engine.calculateAnnualMean(scores);
            // Auto-generate reports/remarks based on the annual mean for this subject
            const remarks = engine.generateReports(annualMean);
            // Get the correct configuration to access the right grading scale
            const config = engine.getAssessmentConfig(s.campus, s.class?.category, s.class?.name);
            return {
                name: s.name,
                terms: s.terms,
                annualMean,
                grade: config.scale.find(g => annualMean >= g.min)?.grade || 'F',
                teacherReport: remarks.teacher,
                principalReport: remarks.principal
            };
        });
        // Check if 3rd term is completed before allowing "Publication" (client-side flag or logic)
        const thirdTerm = await prisma_1.default.term.findFirst({
            where: { sessionId: sessionId, name: 'THIRD' }
        });
        const isPublished = thirdTerm?.status === 'COMPLETED';
        res.json({ report, isPublished, termStatus: thirdTerm?.status });
    }
    catch (err) {
        next(err);
    }
});
exports.default = router;
