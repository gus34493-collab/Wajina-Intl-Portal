import express from 'express';
import prisma from '../prisma';
import { auth, requireRole, requireCampus } from '../middleware/auth';
import { audit } from '../middleware/audit';

const router = express.Router();

// Role helpers
const STAFF        = requireRole('DIRECTOR', 'PRINCIPAL', 'TEACHER', 'FORM_TEACHER', 'ADMIN_STAFF');
const MANAGEMENT   = requireRole('DIRECTOR', 'PRINCIPAL');

const VALID_SEVERITIES = ['COMMENDATION', 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
const VALID_STATUSES   = ['OPEN', 'IN_REVIEW', 'RESOLVED', 'ESCALATED', 'CLOSED'];
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
//   TEACHER/FORM_TEACHER/ADMIN_STAFF → only records they filed
//   PARENT → only their wards' records
//   STUDENT → only their own records
router.get('/', auth, async (req: any, res, next) => {
  try {
    const { studentId, reporterId, category, severity, status, termId, sessionId, page = 1, limit = 50 } = req.query;
    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
    const role = req.user.role;

    let where: any = {};

    // Access scoping
    if (role === 'PARENT') {
      // Fetch ward IDs for this parent
      const wards = await prisma.user.findMany({ where: { parentId: req.user.id }, select: { id: true } });
      const wardIds = wards.map(w => w.id);
      where.studentId = { in: wardIds };
    } else if (role === 'STUDENT') {
      where.studentId = req.user.id;
    } else if (!['DIRECTOR', 'PRINCIPAL'].includes(role)) {
      // Teachers/staff see only records they reported
      where.reporterId = req.user.id;
    }
    
    // Campus Enforcement for Management (Principal) and Staff
    if (role !== 'DIRECTOR' && role !== 'PARENT' && req.user.campus) {
      where.student = { ...(where.student || {}), campus: req.user.campus };
    }

    // Optional additional filters
    if (studentId && ['DIRECTOR', 'PRINCIPAL'].includes(role)) where.studentId = studentId;
    if (reporterId && ['DIRECTOR', 'PRINCIPAL'].includes(role)) where.reporterId = reporterId;
    if (category)  where.category = category;
    if (severity && VALID_SEVERITIES.includes(severity as string)) where.severity = severity;
    if (status   && VALID_STATUSES.includes(status as string))     where.status   = status;
    if (termId)    where.termId    = termId;
    if (sessionId) where.sessionId = sessionId;

    const [records, total] = await Promise.all([
      prisma.behaviourRecord.findMany({
        where,
        select: RECORD_SELECT,
        orderBy: { date: 'desc' },
        skip,
        take: parseInt(limit as string),
      }),
      prisma.behaviourRecord.count({ where }),
    ]);

    res.json({ records, total, page: parseInt(page as string), limit: parseInt(limit as string) });
  } catch (err) { next(err); }
});

// ── GET /api/behaviour/:id ────────────────────────────────────────────────────
router.get('/:id', auth, async (req: any, res, next) => {
  try {
    const record = await prisma.behaviourRecord.findUnique({ where: { id: req.params.id }, select: RECORD_SELECT });
    if (!record) return res.status(404).json({ error: 'Record not found' });

    const role = req.user.role;
    // Check visibility
    if (role === 'STUDENT' && record.student.id !== req.user.id)       return res.status(403).json({ error: 'Access denied' });
    if (role === 'PARENT') {
      const wards = await prisma.user.findMany({ where: { parentId: req.user.id }, select: { id: true } });
      if (!wards.some(w => w.id === record.student.id)) return res.status(403).json({ error: 'Access denied' });
    }
    if (!['DIRECTOR', 'PRINCIPAL'].includes(role) && role !== 'PARENT' && role !== 'STUDENT') {
      if ((record.reporter as any).id !== req.user.id) return res.status(403).json({ error: 'Access denied' });
    }

    res.json(record);
  } catch (err) { next(err); }
});

// ── POST /api/behaviour ───────────────────────────────────────────────────────
router.post('/', auth, STAFF, async (req: any, res, next) => {
  try {
    const { studentId, date, category, severity, description, actionTaken, termId, sessionId } = req.body;

    if (!studentId || !date || !category || !severity || !description) {
      return res.status(400).json({ error: 'studentId, date, category, severity, and description are required' });
    }
    if (!VALID_SEVERITIES.includes(severity)) return res.status(400).json({ error: 'Invalid severity' });

    // Verify student exists and belongs to the same campus (if applicable)
    const student = await prisma.user.findUnique({ where: { id: studentId } });
    if (!student || student.role !== 'STUDENT') return res.status(404).json({ error: 'Student not found' });
    
    if (req.user.role !== 'DIRECTOR' && req.user.campus && student.campus !== req.user.campus) {
        return res.status(403).json({ error: 'Access Denied: Student belongs to another campus.' });
    }

    const record = await prisma.behaviourRecord.create({
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

    audit(req.user.id, 'BEHAVIOUR_CREATED', 'BehaviourRecord', record.id,
      `${severity} record filed for student ${student.name}`, req.ip);

    res.status(201).json(record);
  } catch (err) { next(err); }
});

// ── PATCH /api/behaviour/:id ──────────────────────────────────────────────────
// Reporters can update description/actionTaken while OPEN
// Form teachers can add formTeacherNote, update status to IN_REVIEW
// Management can update status, principalNote
router.patch('/:id', auth, async (req: any, res, next) => {
  try {
    const existing = await prisma.behaviourRecord.findUnique({ where: { id: req.params.id } });
    if (!existing) return res.status(404).json({ error: 'Record not found' });

    const role = req.user.role;
    const isManagement    = ['DIRECTOR', 'PRINCIPAL'].includes(role);
    const isReporter      = existing.reporterId === req.user.id;
    const canEdit         = isManagement || isReporter;

    if (!canEdit) return res.status(403).json({ error: 'Insufficient permissions' });

    // Fields each role can set
    const { description, actionTaken, formTeacherNote, principalNote, status } = req.body;

    const data: any = {};

    if (isReporter && existing.status === 'OPEN') {
      if (description  !== undefined) data.description  = description;
      if (actionTaken  !== undefined) data.actionTaken  = actionTaken;
    }
    if (formTeacherNote !== undefined) data.formTeacherNote = formTeacherNote;
    if (isManagement) {
      if (principalNote !== undefined) data.principalNote = principalNote;
      if (status && VALID_STATUSES.includes(status)) data.status = status;
    }

    if (Object.keys(data).length === 0) return res.status(400).json({ error: 'No valid fields to update' });

    const updated = await prisma.behaviourRecord.update({ where: { id: req.params.id }, data, select: RECORD_SELECT });

    audit(req.user.id, 'BEHAVIOUR_UPDATED', 'BehaviourRecord', existing.id,
      `Status: ${updated.status}`, req.ip);

    res.json(updated);
  } catch (err) { next(err); }
});

// ── DELETE /api/behaviour/:id ─────────────────────────────────────────────────
router.delete('/:id', auth, MANAGEMENT, async (req: any, res, next) => {
  try {
    const existing = await prisma.behaviourRecord.findUnique({ where: { id: req.params.id } });
    if (!existing) return res.status(404).json({ error: 'Record not found' });

    await prisma.behaviourRecord.delete({ where: { id: req.params.id } });

    audit(req.user.id, 'BEHAVIOUR_DELETED', 'BehaviourRecord', existing.id,
      `Record deleted`, req.ip);

    res.json({ message: 'Record deleted' });
  } catch (err) { next(err); }
});

// ── GET /api/behaviour/stats/summary ─────────────────────────────────────────
// Returns per-severity counts, optionally scoped to studentId or termId
// Management: full summary. Teachers: only records they reported.
router.get('/stats/summary', auth, STAFF, async (req: any, res, next) => {
  try {
    const { studentId, termId, sessionId } = req.query;
    const where: any = {
      ...(studentId && { studentId }),
      ...(termId    && { termId }),
      ...(sessionId && { sessionId }),
    };

    if (!['DIRECTOR', 'PRINCIPAL'].includes(req.user.role)) {
      where.reporterId = req.user.id;
    }

    const rows = await prisma.behaviourRecord.groupBy({
      by: ['severity'],
      where,
      _count: { id: true },
    });

    const counts: any = {};
    for (const r of rows) counts[r.severity] = r._count.id;
    res.json(counts);
  } catch (err) { next(err); }
});

export default router;
