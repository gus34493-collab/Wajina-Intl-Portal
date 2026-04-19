import express from 'express';
import prisma from '../prisma';
import { auth, requireRole } from '../middleware/auth';
import { audit } from '../middleware/audit';
import * as engine from '../utils/academicEngine';

const router = express.Router();

const MANAGEMENT = requireRole('DIRECTOR', 'PRINCIPAL', 'HEAD_TEACHER', 'VP_ADMIN', 'VP_ACADEMICS', 'ASST_HEAD_TEACHER');
const TEACHER_PLUS = requireRole('DIRECTOR', 'PRINCIPAL', 'HEAD_TEACHER', 'VP_ADMIN', 'VP_ACADEMICS', 'ASST_HEAD_TEACHER', 'TEACHER', 'HOD', 'DEAN_STUDENTS', 'FORM_TEACHER');

// ─────────────────────────────────────────────────────────────────
// GET /api/grades/pending
// Returns total counts of grades in SUBMITTED or FORM_APPROVED state
// ─────────────────────────────────────────────────────────────────
router.get('/pending', auth, MANAGEMENT, async (req: any, res, next) => {
  try {
    const campus = req.user.campus;
    const where: any = { status: { in: ['SUBMITTED', 'FORM_APPROVED'] } };
    if (campus && req.user.role !== 'DIRECTOR') {
      where.student = { campus };
    }

    const total = await prisma.grade.count({ where });
    res.json({ total });
  } catch (err) { next(err); }
});

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
  sessionId: true,
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
router.get('/', auth, async (req: any, res, next) => {
  try {
    const { subjectId, studentId, termId, status, armId, page = 1, limit = 100 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const role = req.user.role;

    // Strict debt blocking for students and parents
    if (role === 'STUDENT') {
      const canView = await engine.canViewResults(req.user.id, termId as string);
      if (!canView) {
        return res.status(403).json({ 
          error: 'Access Denied', 
          message: 'Your results are currently locked. Please ensure all school fees are fully paid to gain access.' 
        });
      }
    } else if (role === 'PARENT') {
      // If parent is viewing a specific student, check that student's debt
      if (studentId) {
        // First verify this student belongs to the parent
        const isWard = await prisma.user.findFirst({ where: { id: studentId as string, parentId: req.user.id } });
        if (!isWard) return res.status(403).json({ error: 'Unauthorized ward access' });
        
        const canView = await engine.canViewResults(studentId as string, termId as string);
        if (!canView) {
          return res.status(403).json({ 
            error: 'Access Denied', 
            message: 'Results for this student are currently locked due to outstanding fees.' 
          });
        }
      }
    }

    let where: any = {};

    if (role === 'STUDENT') {
      where = { studentId: req.user.id, status: 'PRINCIPAL_APPROVED' };
    } else if (role === 'PARENT') {
      const wards = await prisma.user.findMany({ where: { parentId: req.user.id }, select: { id: true } });
      const wardIds = wards.map((w) => w.id);
      
      if (studentId && !wardIds.includes(studentId as string)) {
         return res.status(403).json({ error: 'Unauthorized ward access' });
      }
      
      where = { 
        studentId: studentId ? (studentId as string) : { in: wardIds }, 
        status: 'PRINCIPAL_APPROVED' 
      };
    } else if (role === 'TEACHER' || role === 'FORM_TEACHER') {
      const subjects = await prisma.subject.findMany({
        where: { teacherId: req.user.id },
        select: { id: true },
      });
      where.subjectId = { in: subjects.map((s) => s.id) };
    }

    if (subjectId) where.subjectId = subjectId;
    if (studentId && role !== 'STUDENT' && role !== 'PARENT') where.studentId = studentId;
    if (termId) where.termId = termId;
    if (status && role !== 'STUDENT' && role !== 'PARENT') where.status = status;
    if (armId) where.student = { armId };

    const [grades, total] = await Promise.all([
      prisma.grade.findMany({
        where,
        select: GRADE_SELECT,
        orderBy: [{ student: { name: 'asc' } }],
        skip,
        take: parseInt(limit),
      }),
      prisma.grade.count({ where }),
    ]);

    res.json({ grades, total, page: parseInt(page), limit: parseInt(limit) });
  } catch (err) { next(err); }
});

// ─────────────────────────────────────────────────────────────────
// PUT /api/grades/upsert
// ─────────────────────────────────────────────────────────────────
router.put('/upsert', auth, TEACHER_PLUS, async (req: any, res, next) => {
  try {
    const { studentId, subjectId, termId, sessionId, firstCA, secondCA, thirdCA, fourthCA, fifthCA, exam, teacherComment } = req.body;

    if (!studentId || !subjectId) {
      return res.status(400).json({ error: 'studentId and subjectId are required.' });
    }

    const student = await prisma.user.findUnique({
      where: { id: studentId },
      include: { enrolledClass: true }
    });

    if (!student) return res.status(404).json({ error: 'Student not found.' });

    const config = engine.getAssessmentConfig(
      student.campus, 
      student.enrolledClass?.category, 
      student.enrolledClass?.name
    );

    const ca1 = parseFloat(firstCA) || 0;
    const ca2 = parseFloat(secondCA) || 0;
    const ca3 = parseFloat(thirdCA) || 0;
    const ca4 = parseFloat(fourthCA) || 0;
    const ca5 = parseFloat(fifthCA) || 0;
    const ex  = parseFloat(exam) || 0;

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
    if (role === 'TEACHER' || role === 'FORM_TEACHER') {
      const subject = await prisma.subject.findUnique({ where: { id: subjectId } });
      if (!subject || subject.teacherId !== req.user.id) {
        return res.status(403).json({ error: 'You can only enter grades for your own subjects.' });
      }
    }

    const existing = await prisma.grade.findUnique({
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
      teacherComment: autoRemarks.teacher,      // Auto-generated
      principalRemark: autoRemarks.principal,    // Auto-generated
      status: 'SUBMITTED'
    };

    const grade = await prisma.grade.upsert({
      where: {
        studentId_subjectId_termId: { studentId, subjectId, termId: termId || '' }
      },
      update: gradeData as any,
      create: { ...gradeData, studentId, subjectId } as any,
      select: GRADE_SELECT
    });

    res.json(grade);
  } catch (err) { next(err); }
});

// ─────────────────────────────────────────────────────────────────
// POST /api/grades/bulk – Save multiple grades (Excel mode)
// ─────────────────────────────────────────────────────────────────
router.post('/bulk', auth, TEACHER_PLUS, async (req: any, res, next) => {
  try {
    const { subjectId, termId, sessionId, grades } = req.body;

    if (!subjectId || !termId || !sessionId || !Array.isArray(grades)) {
      return res.status(400).json({ error: 'subjectId, termId, sessionId, and a grades array are required.' });
    }

    // Identify Campus and Config
    const subject = await prisma.subject.findUnique({
      where: { id: subjectId },
      include: { class: true }
    });
    if (!subject) return res.status(404).json({ error: 'Subject not found.' });

    // Teacher ownership check
    if (req.user.role === 'TEACHER' || req.user.role === 'FORM_TEACHER') {
      if (subject.teacherId !== req.user.id) {
        return res.status(403).json({ error: 'Not your subject.' });
      }
    }

    const config = engine.getAssessmentConfig(subject.class.campus, subject.class.category, subject.class.name);

    // Prepare Transactions
    const operations = grades.map((g: any) => {
      const { studentId, firstCA = 0, secondCA = 0, thirdCA = 0, fourthCA = 0, fifthCA = 0, exam = 0 } = g;

      // Local Validation
      const scores = [firstCA, secondCA, thirdCA, fourthCA, fifthCA, exam];
      for (let i = 0; i < config.maxScores.length; i++) {
        const val = i < 5 ? scores[i] : exam;
        const max = config.maxScores[i];
        if (val > max) throw new Error(`Student ${studentId}: ${config.labels[i]} exceeds ${max}`);
      }

      const result = engine.calculateScore({
        firstCA, secondCA, thirdCA, fourthCA, fifthCA, exam
      }, config);

      const autoRemarks = engine.generateReports(result.total);

      const gradeData = {
        studentId,
        subjectId,
        termId,
        sessionId,
        firstCA: parseFloat(firstCA) || 0,
        secondCA: parseFloat(secondCA) || 0,
        thirdCA: parseFloat(thirdCA) || 0,
        fourthCA: parseFloat(fourthCA) || 0,
        fifthCA: parseFloat(fifthCA) || 0,
        exam: parseFloat(exam) || 0,
        total: result.total,
        grade: result.grade,
        teacherComment: autoRemarks.teacher,
        principalRemark: autoRemarks.principal,
        status: 'DRAFT' // Bulk entry defaults to DRAFT for auto-save support
      };

      return prisma.grade.upsert({
        where: { studentId_subjectId_termId: { studentId, subjectId, termId } },
        update: gradeData as any,
        create: { ...gradeData } as any,
        select: GRADE_SELECT
      });
    });

    const results = await prisma.$transaction(operations);
    res.json({ success: true, count: results.length, grades: results });

  } catch (err: any) {
    if (err.message && err.message.includes('exceeds')) {
      return res.status(400).json({ error: err.message });
    }
    next(err);
  }
});

// ─────────────────────────────────────────────────────────────────
// POST /api/grades/submit-batch
// ─────────────────────────────────────────────────────────────────
router.post('/submit-batch', auth, TEACHER_PLUS, async (req: any, res, next) => {
  try {
    const { subjectId, termId } = req.body;
    if (!subjectId) return res.status(400).json({ error: 'subjectId is required.' });

    const role = req.user.role;
    if (role === 'TEACHER' || role === 'FORM_TEACHER') {
      const subject = await prisma.subject.findUnique({ where: { id: subjectId } });
      if (!subject || subject.teacherId !== req.user.id) {
        return res.status(403).json({ error: 'Not your subject.' });
      }
    }

    const { count } = await prisma.grade.updateMany({
      where: { subjectId, status: { in: ['DRAFT', 'RETURNED'] }, ...(termId && { termId }) },
      data: { status: 'SUBMITTED' },
    });

    audit(req.user.id, 'GRADES_SUBMITTED', 'Grade', subjectId,
      `${count} grades submitted for review by ${req.user.name}`, req.ip);

    res.json({ submitted: count });
  } catch (err) { next(err); }
});

// ─────────────────────────────────────────────────────────────────
// POST /api/grades/:id/approve
// ─────────────────────────────────────────────────────────────────
router.post('/:id/approve', auth, async (req: any, res, next) => {
  try {
    const role = req.user.role;
    if (!['DIRECTOR', 'PRINCIPAL', 'HEAD_TEACHER', 'VP_ADMIN', 'VP_ACADEMICS', 'ASST_HEAD_TEACHER', 'TEACHER', 'FORM_TEACHER'].includes(role)) {
      return res.status(403).json({ error: 'Only management, form masters or principals can approve grades.' });
    }

    const grade = await prisma.grade.findUnique({ where: { id: req.params.id } });
    if (!grade) return res.status(404).json({ error: 'Grade not found.' });

    let nextStatus;
    let updateData: any = {};

    if (grade.status === 'SUBMITTED') {
      if (role === 'TEACHER' || role === 'FORM_TEACHER') {
        const student = await prisma.user.findUnique({
          where: { id: grade.studentId },
          select: { enrolledClass: { select: { formMasterId: true } } },
        });
        if (student?.enrolledClass?.formMasterId !== req.user.id) {
          return res.status(403).json({ error: 'Only the form master for this class can approve at this stage.' });
        }
      }
      nextStatus = 'FORM_APPROVED';
      updateData.formMasterRemark = req.body.remark || null;
    } else if (grade.status === 'FORM_APPROVED') {
      if (!['DIRECTOR', 'PRINCIPAL', 'HEAD_TEACHER', 'VP_ADMIN'].includes(role)) {
        return res.status(403).json({ error: 'Only Principal, Head Teacher or Director can give final approval.' });
      }
      nextStatus = 'PRINCIPAL_APPROVED';
      updateData.principalRemark = req.body.remark || null;
    } else {
      return res.status(409).json({ error: `Grade status "${grade.status}" cannot be approved at this stage.` });
    }

    const updated = await prisma.$transaction(async (tx) => {
      // 1. Update the Grade status
      const upd = await tx.grade.update({
        where: { id: req.params.id },
        data: { status: nextStatus, ...updateData },
        select: GRADE_SELECT,
      });

      // 2. HOD Notification Logic for High Performance (>80%)
      if (nextStatus === 'PRINCIPAL_APPROVED' && upd.total >= 80) {
        const subjectWithDept = await tx.subject.findUnique({
          where: { id: upd.subjectId },
          include: { department: true }
        });
        
        if (subjectWithDept?.department?.hodId) {
          await tx.request.create({
            data: {
              level: 'K3',
              title: 'High Performance Alert',
              description: `Student ${upd.student.name} scored ${upd.total}% in ${subjectWithDept.name}. HOD recognition recommended.`,
              senderId: req.user.id,
              receiverId: subjectWithDept.department.hodId,
              status: 'PENDING'
            }
          });
        }
      }

      // 3. AUTOMATED PROMOTION LOGIC
      if (nextStatus === 'PRINCIPAL_APPROVED') {
        const student = await tx.user.findUnique({
          where: { id: upd.studentId },
          include: { enrolledClass: true }
        });

        if (student?.enrolledClass) {
          const sessionGrades = await tx.grade.findMany({
            where: { studentId: student.id, sessionId: upd.sessionId, status: 'PRINCIPAL_APPROVED' }
          });

          // Include the current grade we just approved in the promotion calculation
          const allGrades = [...sessionGrades, upd];
          const uniqueGrades: any = Array.from(new Map(allGrades.map(g => [g.subjectId, g])).values());

          const totalScore = uniqueGrades.reduce((acc, g) => acc + (g.total || 0), 0);
          const average = uniqueGrades.length > 0 ? totalScore / uniqueGrades.length : 0;

          if (average >= (student.enrolledClass.promotionCutoff || 50)) {
            const nextClass = await tx.class.findFirst({
              where: { 
                campus: student.campus,
                displayOrder: { gt: student.enrolledClass.displayOrder }
              },
              orderBy: { displayOrder: 'asc' }
            });

            if (nextClass) {
              await tx.user.update({
                where: { id: student.id },
                data: { classId: nextClass.id, armId: null }
              });
              await tx.auditLog.create({
                data: {
                  actorId: req.user.id,
                  action: 'STUDENT_PROMOTED',
                  entity: 'User',
                  entityId: student.id,
                  detail: `Auto-promoted to ${nextClass.name} (Avg: ${average.toFixed(2)}%)`,
                  ipAddress: req.ip
                }
              });
            }
          }
        }
      }

      // 4. Create Approval Audit Log
      await tx.auditLog.create({
        data: {
          actorId: req.user.id,
          action: 'GRADE_APPROVED',
          entity: 'Grade',
          entityId: grade.id,
          detail: `${req.user.name} approved grade → ${nextStatus}`,
          ipAddress: req.ip
        }
      });

      return upd;
    });

    res.json(updated);
  } catch (err) { next(err); }
});

// ─────────────────────────────────────────────────────────────────
// POST /api/grades/:id/return
// ─────────────────────────────────────────────────────────────────
router.post('/:id/return', auth, async (req: any, res, next) => {
  try {
    const role = req.user.role;
    if (!['DIRECTOR', 'PRINCIPAL', 'TEACHER', 'FORM_TEACHER'].includes(role)) {
      return res.status(403).json({ error: 'Not authorised.' });
    }

    const grade = await prisma.grade.findUnique({ where: { id: req.params.id } });
    if (!grade) return res.status(404).json({ error: 'Grade not found.' });

    if (!['SUBMITTED', 'FORM_APPROVED'].includes(grade.status)) {
      return res.status(409).json({ error: `Grade in status "${grade.status}" cannot be returned.` });
    }

    if (!req.body.reason?.trim()) {
      return res.status(400).json({ error: 'A return reason is required.' });
    }

    const updated = await prisma.grade.update({
      where: { id: req.params.id },
      data: { status: 'RETURNED', returnReason: req.body.reason.trim() },
      select: GRADE_SELECT,
    });

    audit(req.user.id, 'GRADE_RETURNED', 'Grade', grade.id,
      `Grade returned for correction: ${req.body.reason}`, req.ip);

    res.json(updated);
  } catch (err) { next(err); }
});

// ─────────────────────────────────────────────────────────────────
// GET /api/grades/pending-review
// ─────────────────────────────────────────────────────────────────
router.get('/pending-review', auth, async (req: any, res, next) => {
  try {
    const role = req.user.role;
    const isManagement = ['DIRECTOR', 'PRINCIPAL', 'HEAD_TEACHER', 'ASST_HEAD_TEACHER', 'VP_ADMIN', 'VP_ACADEMICS'].includes(role);
    const { termId, campus, page = 1, limit = 50, overrideFormMaster = 'false' } = req.query;
    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

    let where: any = {};

    if (isManagement) {
      // By default, management sees what Form Masters signed off on.
      // If override is enabled, they see everything submitted by subject teachers.
      if (overrideFormMaster === 'true') {
        where.status = { in: ['SUBMITTED', 'FORM_APPROVED'] };
      } else {
        where.status = 'FORM_APPROVED';
      }
    } else if (role === 'TEACHER' || role === 'FORM_TEACHER') {
      const formClass = await prisma.class.findFirst({
        where: { formMasterId: req.user.id },
        select: { id: true },
      });
      if (!formClass) return res.json({ grades: [], total: 0, page: 1, limit: parseInt(limit as string) });

      where = {
        status: 'SUBMITTED',
        student: { classId: formClass.id },
      };
    } else {
      return res.status(403).json({ error: 'Not authorised.' });
    }

    // Filter by campus if provided or if user is campus-restricted
    if (campus) {
      where.student = { ...where.student, campus: campus };
    } else if (role !== 'DIRECTOR' && req.user.campus) {
      where.student = { ...where.student, campus: req.user.campus };
    }

    if (termId) where.termId = termId;

    const [grades, total] = await Promise.all([
      prisma.grade.findMany({ where, select: GRADE_SELECT, skip, take: parseInt(limit), orderBy: { updatedAt: 'asc' } }),
      prisma.grade.count({ where }),
    ]);

    res.json({ grades, total, page: parseInt(page), limit: parseInt(limit) });
  } catch (err) { next(err); }
});

// ─────────────────────────────────────────────────────────────────
// GET /api/grades/summary/arm/:armId
// Term-level summary for an arm: per-subject averages, top/bottom performers.
// ─────────────────────────────────────────────────────────────────
router.get('/summary/arm/:armId', auth, MANAGEMENT, async (req: any, res, next) => {
  try {
    const { armId } = req.params;
    const { termId } = req.query;

    const where: any = {
      student: { armId },
      ...(termId && { termId }),
      status: 'PRINCIPAL_APPROVED',
    };

    const grades: any[] = await prisma.grade.findMany({
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
      if (!bySubject[sid]) bySubject[sid] = { name: g.subject.name, scores: [] };
      bySubject[sid].scores.push(g.total);
    }

    const subjectSummary = Object.values(bySubject).map((s: any) => {
      const avg = s.scores.reduce((a, b) => a + b, 0) / s.scores.length;
      return { name: s.name, count: s.scores.length, average: Math.round(avg * 10) / 10 };
    }).sort((a, b) => b.average - a.average);

    const byStudent = {};
    for (const g of grades) {
      if (!byStudent[g.student.id]) byStudent[g.student.id] = { name: g.student.name, scores: [] };
      byStudent[g.student.id].scores.push(g.total);
    }

    const studentRanking = Object.values(byStudent).map((s: any) => {
      const avg = s.scores.reduce((a, b) => a + b, 0) / s.scores.length;
      return { name: s.name, subjectCount: s.scores.length, average: Math.round(avg * 10) / 10 };
    }).sort((a, b) => b.average - a.average).map((s, i) => ({ ...s, position: i + 1 }));

    res.json({ subjectSummary, studentRanking, totalGrades: grades.length });
  } catch (err) { next(err); }
});

// ─────────────────────────────────────────────────────────────────
// GET /api/grades/campus-stats
// ─────────────────────────────────────────────────────────────────
router.get('/campus-stats', auth, MANAGEMENT, async (req: any, res, next) => {
  try {
    const { termId } = req.query;
    const termFilter = termId ? { termId } : {};

    const [submitted, formApproved, principalApproved, returned] = await Promise.all([
      prisma.grade.count({ where: { ...termFilter, status: 'SUBMITTED' } }),
      prisma.grade.count({ where: { ...termFilter, status: 'FORM_APPROVED' } }),
      prisma.grade.count({ where: { ...termFilter, status: 'PRINCIPAL_APPROVED' } }),
      prisma.grade.count({ where: { ...termFilter, status: 'RETURNED' } }),
    ]);

    const approvedGrades = await prisma.grade.findMany({
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
      if (!byStudent[sid]) byStudent[sid] = { scores: [], campus };
      byStudent[sid].scores.push(g.total);

      const sname = g.subject.name;
      if (!subjectPass[sname]) subjectPass[sname] = { pass: 0, total: 0 };
      subjectPass[sname].total++;
      if (g.total >= 50) subjectPass[sname].pass++;
    }

    const students: any = Object.values(byStudent);
    const totalStudents = students.length;
    const byCampus = { PRIMARY: { total: 0, ready: 0 }, SECONDARY: { total: 0, ready: 0 } };
    let atBenchmark = 0;
    for (const s of students) {
      const avg = s.scores.reduce((a, b) => a + b, 0) / s.scores.length;
      const campus = s.campus === 'PRIMARY' ? 'PRIMARY' : 'SECONDARY';
      byCampus[campus].total++;
      if (avg >= 50) { atBenchmark++; byCampus[campus].ready++; }
    }

    const subjectRates = Object.entries(subjectPass).map(([name, d]: [string, any]) => ({
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
  } catch (err) { next(err); }
});

// ─────────────────────────────────────────────────────────────────
// GET /api/grades/annual-report/:studentId
// Returns aggregated mean of results from 1st, 2nd, and 3rd terms.
// ─────────────────────────────────────────────────────────────────
router.get('/annual-report/:studentId', auth, async (req: any, res, next) => {
  try {
    const { studentId } = req.params;
    const { sessionId } = req.query;
    const role = req.user.role;

    // Security
    if (role === 'STUDENT' && studentId !== req.user.id) return res.status(403).json({ error: 'Not authorized' });

    const grades = await prisma.grade.findMany({
      where: {
        studentId,
        sessionId: sessionId as string,
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

    const report = Object.values(subjectMap).map((s: any) => {
      const scores = Object.values(s.terms).filter(v => v !== null) as number[];
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
    const thirdTerm = await prisma.term.findFirst({
        where: { sessionId: sessionId as string, name: 'THIRD' }
    });
    
    const isPublished = thirdTerm?.status === 'COMPLETED';

    res.json({ report, isPublished, termStatus: thirdTerm?.status });
  } catch (err) { next(err); }
});

export default router;
