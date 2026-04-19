import express from 'express';
import bcrypt from 'bcryptjs';
import prisma from '../prisma';
import { auth, requireRole } from '../middleware/auth';
import { audit } from '../middleware/audit';

import multer from 'multer';
import path from 'path';
import fs from 'fs';

const router = express.Router();

// ── Multer Storage Configuration ─────────────────────────────────────────────
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = './public/uploads/profiles';
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req: any, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `profile-${req.user?.id || 'anon'}-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('Only images are allowed'));
  }
});

const ADMIN = requireRole('DIRECTOR', 'PRINCIPAL', 'HEAD_TEACHER', 'VP_ADMIN', 'HR');
const DIRECTOR_OR_HR = requireRole('DIRECTOR', 'HR');
const DIRECTOR_ONLY = requireRole('DIRECTOR');
const ACADEMIC_WORKSPACE = requireRole('DIRECTOR', 'PRINCIPAL', 'VP_ACADEMICS', 'HOD', 'HEAD_TEACHER', 'TEACHER', 'FORM_TEACHER');

const VALID_ROLES = [
  'DIRECTOR', 'PRINCIPAL', 'VP_ACADEMICS', 'VP_ADMIN', 'HOD', 
  'HEAD_TEACHER', 'ASST_HEAD_TEACHER', 'DEAN_STUDENTS', 
  'BURSAR', 'ACCOUNTS_OFFICER', 'HR', 'ADMIN_STAFF', 
  'FORM_TEACHER', 'TEACHER', 'PARENT', 'STUDENT'
];

// ── Shared user select (no password) ────────────────────────────────────────
const USER_SELECT = {
  id: true,
  email: true,
  name: true,
  role: true,
  status: true,
  phone: true,
  profilePhoto: true,
  salary: true,
  joinedAt: true,
  departmentId: true,
  campus: true,
  createdAt: true,
  updatedAt: true,
  enrolledArm: { select: { id: true, fullName: true, class: { select: { name: true, campus: true } } } },
  managedArms: { select: { id: true, fullName: true } },
};

// ── GET /api/users/staff ─────────────────────────────────────────────────────
router.get('/staff', auth, requireRole('DIRECTOR', 'HR', 'PRINCIPAL', 'VP_ADMIN'), async (req: any, res, next) => {
  try {
    const { campus, departmentId } = req.query;
    
    // STAFF roles are anything but STUDENT and PARENT
    const staffRoles = VALID_ROLES.filter(r => r !== 'STUDENT' && r !== 'PARENT');

    // HR/VP ADMIN/HT are restricted to their campus; Director sees all
    const campusFilter = req.user.role === 'DIRECTOR' ? campus : req.user.campus;

    const users = await prisma.user.findMany({
      where: {
        role: { in: staffRoles as any },
        ...(campusFilter && { campus: campusFilter as any }),
        ...(departmentId && { departmentId })
      },
      select: USER_SELECT as any,
      orderBy: { name: 'asc' }
    });

    res.json(users);
  } catch (err) { next(err); }
});

// ── GET /api/users ───────────────────────────────────────────────────────────
router.get('/', auth, ACADEMIC_WORKSPACE, async (req: any, res, next) => {
  try {
    const { role, status, search, campus, email, classId, page = 1, limit = 50 } = req.query;
    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

    // If seeker is not HR/DIRECTOR, hide salaries from the shared list
    const isPowerful = ['DIRECTOR', 'HR', 'BURSAR'].includes(req.user.role);
    const customSelect = { ...USER_SELECT };
    if (!isPowerful) {
      delete (customSelect as any).salary;
    }

    // Role-based scoping: Teachers and lower staff can ONLY see students
    const userRole = req.user.role;
    const isStaffOrTeacher = ['TEACHER', 'FORM_TEACHER', 'ADMIN_STAFF'].includes(userRole);
    
    let forcedRole = role;
    if (isStaffOrTeacher) forcedRole = 'STUDENT'; // Safety override: Staff/Teachers only query students here

    // Campus scoping
    const campusFilter = userRole === 'DIRECTOR' ? campus : req.user.campus;

    const where: any = {
      ...(forcedRole && { role: forcedRole }),
      ...(status && { status }),
      ...(campusFilter && { campus: campusFilter }),
      ...(email && { email: { equals: email as string, mode: 'insensitive' } }),
      ...(classId && { classId }),
      ...(armId && { armId }), // Fix for empty student lists
      ...(search && {
        OR: [
          { name: { contains: search as string, mode: 'insensitive' } },
          { email: { contains: search as string, mode: 'insensitive' } },
        ],
      }),
    };

    const [users, total] = await Promise.all([
      prisma.user.findMany({ where, select: customSelect as any, orderBy: { name: 'asc' }, skip, take: parseInt(limit as string) }),
      prisma.user.count({ where }),
    ]);

    res.json({ users, total, page: parseInt(page as string), limit: parseInt(limit as string) });
  } catch (err) { next(err); }
});

// ── PATCH /api/users/:id/salary ──────────────────────────────────────────────
router.patch('/:id/salary', auth, DIRECTOR_OR_HR, async (req: any, res, next) => {
  try {
    const { salary } = req.body;
    if (salary === undefined) return res.status(400).json({ error: 'salary is required' });

    const updated = await prisma.user.update({
      where: { id: req.params.id },
      data: { salary: parseFloat(salary) },
      select: { id: true, name: true, salary: true }
    });

    audit(req.user.id, 'SALARY_UPDATE', 'User', updated.id, `Salary updated for ${updated.name}`, req.ip);
    res.json(updated);
  } catch (err) { next(err); }
});

// ── GET /api/users/:id ───────────────────────────────────────────────────────
router.get('/:id', auth, async (req: any, res, next) => {
  try {
    // Users can view their own profile; admins can view anyone's
    if (req.user.id !== req.params.id && !['DIRECTOR', 'PRINCIPAL', 'HEAD_TEACHER', 'VP_ADMIN', 'HR'].includes(req.user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    const user = await prisma.user.findUnique({ where: { id: req.params.id }, select: USER_SELECT as any });
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (err) { next(err); }
});

// ── POST /api/users ──────────────────────────────────────────────────────────
router.post('/', auth, ADMIN, async (req: any, res, next) => {
  try {
    const { email, name, role, password, phone, armId } = req.body;

    if (!email || !name || !role || !password) {
      return res.status(400).json({ error: 'email, name, role, and password are required' });
    }
    if (!VALID_ROLES.includes(role)) {
      return res.status(400).json({ error: `Invalid role. Must be one of: ${VALID_ROLES.join(', ')}` });
    }
    if (password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters' });
    }
    // Principals can only create Teachers, Parents, Students
    if (req.user.role === 'PRINCIPAL' && ['DIRECTOR', 'PRINCIPAL'].includes(role)) {
      return res.status(403).json({ error: 'Principals cannot create Director or Principal accounts' });
    }

    const existing = await prisma.user.findUnique({ where: { email: email.toLowerCase().trim() } });
    if (existing) return res.status(409).json({ error: 'A user with this email already exists' });

    const hashed = await bcrypt.hash(password, 12);
    const user: any = await prisma.user.create({
      data: {
        email: email.toLowerCase().trim(),
        name: name.trim(),
        role,
        password: hashed,
        phone: phone || null,
        armId: armId || null,
        status: 'ACTIVE',
        failedLoginAttempts: 0,
        lockedUntil: null,
      },
      select: USER_SELECT as any,
    });

    audit(req.user.id, 'CREATE_USER', 'User', user.id, `${name} (${role})`, req.ip);
    res.status(201).json(user);
  } catch (err) { next(err); }
});

// ── PATCH /api/users/profile-photo ──────────────────────────────────────────
router.patch('/profile-photo', auth, upload.single('photo'), async (req: any, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

    const photoUrl = `/uploads/profiles/${req.file.filename}`;
    const user: any = await prisma.user.update({
      where: { id: req.user.id },
      data: { profilePhoto: photoUrl },
      select: USER_SELECT as any
    });

    audit(req.user.id, 'PROFILE_PHOTO_UPLOAD', 'User', user.id, `Uploaded new profile photo`, req.ip);
    res.json(user);
  } catch (err) { next(err); }
});

// ── PATCH /api/users/:id ─────────────────────────────────────────────────────
router.patch('/:id', auth, async (req: any, res, next) => {
  try {
    const isSelf = req.user.id === req.params.id;
    const isAdmin = ['DIRECTOR', 'PRINCIPAL'].includes(req.user.role);

    if (!isSelf && !isAdmin) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    const { name, phone, profilePhoto, armId, status, parentId } = req.body;

    // Validate profilePhoto: must be a relative path or https URL
    if (profilePhoto !== undefined && profilePhoto !== null && profilePhoto !== '') {
      const isUpload = profilePhoto.startsWith('/uploads/');
      const isRelative = /^\/[^/]/.test(profilePhoto);
      let isHttps = false;
      try { isHttps = new URL(profilePhoto).protocol === 'https:'; } catch (_) {}
      
      if (!isUpload && !isRelative && !isHttps) {
        return res.status(400).json({ error: 'profilePhoto must be a valid internal path or https:// URL' });
      }
    }

    // Validate parentId: target user must exist and have role PARENT
    if (isAdmin && parentId !== undefined && parentId !== null && parentId !== '') {
      const parentUser = await prisma.user.findUnique({ where: { id: parentId }, select: { role: true } });
      if (!parentUser) return res.status(400).json({ error: 'parentId does not refer to an existing user' });
      if (parentUser.role !== 'PARENT') return res.status(400).json({ error: 'parentId must refer to a user with role PARENT' });
    }

    // Only admins can change status / armId / parentId
    const data: any = {
      ...(name && { name: name.trim() }),
      ...(phone !== undefined && { phone: phone || null }),
      ...(profilePhoto !== undefined && { profilePhoto: profilePhoto || null }),
      ...(isAdmin && armId !== undefined && { armId: armId || null }),
      ...(isAdmin && status && { status }),
      ...(isAdmin && parentId !== undefined && { parentId: parentId || null }),
    };

    if (Object.keys(data).length === 0) {
      return res.status(400).json({ error: 'No valid fields to update' });
    }

    const user: any = await prisma.user.update({ where: { id: req.params.id }, data, select: USER_SELECT as any });
    audit(req.user.id, 'UPDATE_USER', 'User', user.id, user.name, req.ip);
    res.json(user);
  } catch (err) { next(err); }
});

// ── POST /api/users/:id/disable ──────────────────────────────────────────────
router.post('/:id/disable', auth, ADMIN, async (req: any, res, next) => {
  try {
    if (req.params.id === req.user.id) {
      return res.status(400).json({ error: 'You cannot disable your own account' });
    }

    const target = await prisma.user.findUnique({ where: { id: req.params.id }, select: { role: true, name: true } });
    if (!target) return res.status(404).json({ error: 'User not found' });

    if (['PRINCIPAL', 'HEAD_TEACHER'].includes(req.user.role) && ['DIRECTOR', 'PRINCIPAL', 'HEAD_TEACHER'].includes(target.role)) {
      return res.status(403).json({ error: 'Administrative accounts can only be managed by the Director' });
    }

    await prisma.user.update({ where: { id: req.params.id }, data: { status: 'DISABLED' } });
    audit(req.user.id, 'DISABLE_USER', 'User', req.params.id, target.name, req.ip);
    res.json({ message: 'User account disabled' });
  } catch (err) { next(err); }
});

// ── POST /api/users/:id/enable ───────────────────────────────────────────────
router.post('/:id/enable', auth, ADMIN, async (req: any, res, next) => {
  try {
    const target = await prisma.user.findUnique({ where: { id: req.params.id }, select: { role: true, name: true } });
    if (!target) return res.status(404).json({ error: 'User not found' });

    if (['PRINCIPAL', 'HEAD_TEACHER'].includes(req.user.role) && ['DIRECTOR', 'PRINCIPAL', 'HEAD_TEACHER'].includes(target.role)) {
      return res.status(403).json({ error: 'Administrative accounts can only be managed by the Director' });
    }

    await prisma.user.update({ where: { id: req.params.id }, data: { status: 'ACTIVE' } });
    audit(req.user.id, 'ENABLE_USER', 'User', req.params.id, target.name, req.ip);
    res.json({ message: 'User account enabled' });
  } catch (err) { next(err); }
});

// ── POST /api/users/:id/reset-password ───────────────────────────────────────
router.post('/:id/reset-password', auth, DIRECTOR_ONLY, async (req: any, res, next) => {
  try {
    const { newPassword } = req.body;
    if (!newPassword || newPassword.length < 8) {
      return res.status(400).json({ error: 'New password must be at least 8 characters' });
    }

    const target = await prisma.user.findUnique({ where: { id: req.params.id }, select: { name: true } });
    if (!target) return res.status(404).json({ error: 'User not found' });

    const hashed = await bcrypt.hash(newPassword, 12);
    await prisma.user.update({ where: { id: req.params.id }, data: { password: hashed, tokenVersion: { increment: 1 } } });
    audit(req.user.id, 'RESET_PASSWORD', 'User', req.params.id, target.name, req.ip);
    res.json({ message: 'Password reset successfully' });
  } catch (err) { next(err); }
});

// ── POST /api/users/:id/assign-arm ──────────────────────────────────────────
// Assign a class arm to teacher (managedArms) or student (enrolledArm)
router.post('/:id/assign-arm', auth, ADMIN, async (req: any, res, next) => {
  try {
    const { armId, asTeacher } = req.body;
    if (!armId) return res.status(400).json({ error: 'armId is required' });

    const target: any = await prisma.user.findUnique({ where: { id: req.params.id }, select: { role: true, name: true } });
    if (!target) return res.status(404).json({ error: 'User not found' });

    let user;
    if (asTeacher || target.role === 'TEACHER') {
      user = await prisma.user.update({
        where: { id: req.params.id },
        data: { managedArms: { connect: { id: armId } } },
        select: USER_SELECT as any,
      });
    } else {
      user = await prisma.user.update({
        where: { id: req.params.id },
        data: { armId },
        select: USER_SELECT as any,
      });
    }

    audit(req.user.id, 'ASSIGN_ARM', 'User', req.params.id, `${target.name} → arm ${armId}`, req.ip);
    res.json(user);
  } catch (err) { next(err); }
});

// ── DELETE /api/users/:id (Director only — hard delete) ──────────────────────
router.delete('/:id', auth, DIRECTOR_ONLY, async (req: any, res, next) => {
  try {
    if (req.params.id === req.user.id) {
      return res.status(400).json({ error: 'You cannot delete your own account' });
    }

    const target = await prisma.user.findUnique({ where: { id: req.params.id }, select: { name: true } });
    if (!target) return res.status(404).json({ error: 'User not found' });

    await prisma.user.delete({ where: { id: req.params.id } });
    audit(req.user.id, 'DELETE_USER', 'User', req.params.id, target.name, req.ip);
    res.json({ message: 'User permanently deleted' });
  } catch (err) { next(err); }
});

export default router;
