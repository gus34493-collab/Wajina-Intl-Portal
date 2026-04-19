import { Router } from 'express';
import prisma from '../prisma';
import bcrypt from 'bcryptjs';
import { auth } from '../middleware/auth';
import { audit } from '../middleware/audit';

const router = Router();


// ── GET /api/hr/counts – Dashboard Stats ───────────────────────────────────
router.get('/counts', auth, async (req: any, res, next) => {
  try {
    const allowedRoles = ['HEAD_TEACHER', 'PRINCIPAL', 'DIRECTOR', 'VP_ADMIN', 'HR'];
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Unauthorized: HR access required' });
    }

    const { campus } = req.query;
    const campusFilter = req.user.role === 'DIRECTOR' ? campus : req.user.campus;

    const [activeStaff, pendingOnboarding] = await Promise.all([
      prisma.user.count({
        where: {
          role: { notIn: ['STUDENT', 'PARENT'] },
          status: 'ACTIVE',
          ...(campusFilter && { campus: campusFilter as any })
        }
      }),
      prisma.user.count({
        where: {
          role: { notIn: ['STUDENT', 'PARENT'] },
          status: 'PENDING',
          ...(campusFilter && { campus: campusFilter as any })
        }
      })
    ]);

    res.json({ activeStaff, pendingOnboarding });
  } catch (err) {
    next(err);
  }
});

// ── GET /api/hr/staff – List academic staff for appraisal ────────────────────
router.get('/staff', auth, async (req: any, res, next) => {
  try {
    // Only Head Teachers, Principals, or Directors can view staff list for appraisal
    const allowedRoles = ['HEAD_TEACHER', 'PRINCIPAL', 'DIRECTOR', 'VP_ADMIN'];
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Unauthorized: HR access required' });
    }

    const { campus } = req.query;
    // Scoping: HT can only see their campus; Director sees all
    const campusFilter = req.user.role === 'DIRECTOR' ? campus : req.user.campus;

    const staff = await prisma.user.findMany({
      where: {
        role: { in: ['TEACHER', 'FORM_TEACHER', 'ADMIN_STAFF', 'HOD', 'PRINCIPAL'] },
        ...(campusFilter && { campus: campusFilter as any })
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        campus: true,
        status: true,
        appraisalsReceived: {
          orderBy: { createdAt: 'desc' },
          take: 1
        }
      }
    });

    res.json({ staff });
  } catch (err) {
    next(err);
  }
});

// ── POST /api/hr/appraisals – Submit a new appraisal ─────────────────────────
router.post('/appraisals', auth, async (req: any, res, next) => {
  try {
    const { teacherId, punctuality, lessonPlanning, studentEngagement, professionalism, comments } = req.body;

    if (!teacherId) return res.status(400).json({ error: 'Teacher ID is required' });

    const appraisal = await prisma.teacherAppraisal.create({
      data: {
        teacherId,
        evaluatorId: req.user.id,
        punctuality: parseInt(punctuality) || 0,
        lessonPlanning: parseInt(lessonPlanning) || 0,
        studentEngagement: parseInt(studentEngagement) || 0,
        professionalism: parseInt(professionalism) || 0,
        comments: (comments || '').trim(),
        status: 'SUBMITTED'
      },
      include: {
        teacher: { select: { name: true } }
      }
    });

    audit(req.user.id, 'STAFF_APPRAISAL_SUBMITTED', 'User', teacherId, `Appraisal for ${appraisal.teacher.name} sumitted. Status: SUBMITTED`, req.ip);
    
    res.status(201).json({ appraisal });
  } catch (err) {
    next(err);
  }
});

// ── GET /api/hr/appraisals/:teacherId – Get history for a teacher ──────────────
router.get('/appraisals/:teacherId', auth, async (req: any, res, next) => {
  try {
    const { teacherId } = req.params;
    const appraisals = await prisma.teacherAppraisal.findMany({
      where: { teacherId },
      include: {
        evaluator: { select: { name: true, role: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({ appraisals });
  } catch (err) {
    next(err);
  }
});

// ── POST /api/hr/onboard – Quick staff onboarding ────────────────────────────
router.post('/onboard', auth, async (req: any, res, next) => {
  try {
    const { name, email, role, campus } = req.body;
    
    // Only HT and above
    if (!['DIRECTOR', 'PRINCIPAL', 'HEAD_TEACHER', 'VP_ADMIN'].includes(req.user.role)) {
      return res.status(403).json({ error: 'Unauthorized for staff onboarding' });
    }

    if (!name || !email || !role) {
      return res.status(400).json({ error: 'Name, Email, and Role are required' });
    }

    const existing = await prisma.user.findUnique({ where: { email: email.toLowerCase().trim() } });
    if (existing) return res.status(409).json({ error: 'User already exists' });

    const password = 'Wajina2026!'; // Default temporary password
    const hashed = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: {
        name: name.trim(),
        email: email.toLowerCase().trim(),
        role: role as any,
        password: hashed,
        status: 'ACTIVE',
        campus: (campus || req.user.campus) as any,
      },
      select: { id: true, name: true, role: true, campus: true }
    });

    audit(req.user.id, 'STAFF_ONBOARDED', 'User', user.id, `New staff onboarded: ${user.name} as ${user.role} for ${user.campus}`, req.ip);
    res.status(201).json({ user, temporaryPassword: password });
  } catch (err) {
    next(err);
  }
});

// ── PATCH /api/hr/staff/:id/role – Manage staff role ──────────────────────────
router.patch('/staff/:id/role', auth, async (req: any, res, next) => {
  try {
    const { role } = req.body;
    if (!role) return res.status(400).json({ error: 'Role is required' });

    // Scoping check... (HT can only manage their campus)
    const target = await prisma.user.findUnique({ where: { id: req.params.id } });
    if (!target) return res.status(404).json({ error: 'Staff not found' });

    if (req.user.role !== 'DIRECTOR' && target.campus !== req.user.campus) {
      return res.status(403).json({ error: 'Unauthorized: Staff is in a different campus' });
    }

    const updated = await prisma.user.update({
      where: { id: req.params.id },
      data: { role: role as any },
      select: { id: true, name: true, role: true }
    });

    audit(req.user.id, 'STAFF_ROLE_UPDATED', 'User', updated.id, `Role changed to ${role} for ${updated.name}`, req.ip);
    res.json({ user: updated });
  } catch (err) {
    next(err);
  }
});

// ── POST /api/hr/staff/:id/offboard – Safe staff termination ───────────────
router.post('/staff/:id/offboard', auth, async (req: any, res, next) => {
  try {
    const { id } = req.params;

    // Permissions check
    const allowedRoles = ['DIRECTOR', 'PRINCIPAL', 'HEAD_TEACHER', 'VP_ADMIN'];
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Unauthorized: HR permissions required' });
    }

    const target = await prisma.user.findUnique({ where: { id } });
    if (!target) return res.status(404).json({ error: 'Staff member not found' });

    // Scoping check
    if (req.user.role !== 'DIRECTOR' && target.campus !== req.user.campus) {
      return res.status(403).json({ error: 'Unauthorized: Staff is in a different campus' });
    }

    if (id === req.user.id) {
      return res.status(400).json({ error: 'You cannot offboard yourself' });
    }

    // ── Safe Cleanup Transaction ──
    // We disable login and clear active associations, but keep the user record for historical data integrity (grades/attendance)
    await prisma.$transaction([
      // 1. Unassign from Classes (Form Master)
      prisma.class.updateMany({
        where: { formMasterId: id },
        data: { formMasterId: null }
      }),
      // 2. Unassign from Arms (Class Teacher)
      prisma.classArm.updateMany({
        where: { teacherId: id },
        data: { teacherId: null }
      }),
      // 3. Unassign from Department (HOD)
      prisma.department.updateMany({
        where: { hodId: id },
        data: { hodId: null }
      }),
      // 4. Disable User Login
      prisma.user.update({
        where: { id },
        data: { status: 'DISABLED' }
      })
    ]);

    audit(req.user.id, 'STAFF_OFFBOARDED', 'User', id, `Staff offboarded and duties cleared for ${target.name}`, req.ip);
    
    res.json({ message: 'Staff successfully offboarded and login revoked. Historical data preserved.' });
  } catch (err) {
    next(err);
  }
});

export default router;
