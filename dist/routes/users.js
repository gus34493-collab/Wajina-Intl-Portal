"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const prisma_1 = __importDefault(require("../prisma"));
const auth_1 = require("../middleware/auth");
const audit_1 = require("../middleware/audit");
const router = express_1.default.Router();
const ADMIN = (0, auth_1.requireRole)('DIRECTOR', 'PRINCIPAL', 'HEAD_TEACHER', 'VP_ADMIN', 'HR');
const DIRECTOR_OR_HR = (0, auth_1.requireRole)('DIRECTOR', 'HR');
const DIRECTOR_ONLY = (0, auth_1.requireRole)('DIRECTOR');
const VALID_ROLES = [
    'DIRECTOR', 'PRINCIPAL', 'VP_ACADEMICS', 'VP_ADMIN', 'HOD',
    'HEAD_TEACHER', 'ASST_HEAD_TEACHER', 'DEAN_STUDENTS',
    'BURSAR', 'ACCOUNTS_OFFICER', 'HR', 'ADMIN_STAFF',
    'ACADEMIC_STAFF', 'TEACHER', 'PARENT', 'STUDENT'
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
    createdAt: true,
    updatedAt: true,
    enrolledArm: { select: { id: true, fullName: true, class: { select: { name: true, campus: true } } } },
    managedArms: { select: { id: true, fullName: true } },
};
// ── GET /api/users/staff ─────────────────────────────────────────────────────
router.get('/staff', auth_1.auth, DIRECTOR_OR_HR, async (req, res, next) => {
    try {
        const { campus, departmentId } = req.query;
        // STAFF roles are anything but STUDENT and PARENT
        const staffRoles = VALID_ROLES.filter(r => r !== 'STUDENT' && r !== 'PARENT');
        const users = await prisma_1.default.user.findMany({
            where: {
                role: { in: staffRoles },
                ...(campus && { campus: campus }),
                ...(departmentId && { departmentId })
            },
            select: USER_SELECT,
            orderBy: { name: 'asc' }
        });
        res.json(users);
    }
    catch (err) {
        next(err);
    }
});
// ── GET /api/users ───────────────────────────────────────────────────────────
router.get('/', auth_1.auth, ADMIN, async (req, res, next) => {
    try {
        const { role, status, search, campus, email, page = 1, limit = 50 } = req.query;
        const skip = (parseInt(page) - 1) * parseInt(limit);
        // If seeker is not HR/DIRECTOR, hide salaries from the shared list
        const isPowerful = ['DIRECTOR', 'HR'].includes(req.user.role);
        const customSelect = { ...USER_SELECT };
        if (!isPowerful) {
            delete customSelect.salary;
        }
        const where = {
            ...(role && { role }),
            ...(status && { status }),
            ...(campus && { campus }),
            ...(email && { email: { equals: email, mode: 'insensitive' } }),
            ...(search && {
                OR: [
                    { name: { contains: search, mode: 'insensitive' } },
                    { email: { contains: search, mode: 'insensitive' } },
                ],
            }),
        };
        const [users, total] = await Promise.all([
            prisma_1.default.user.findMany({ where, select: customSelect, orderBy: { name: 'asc' }, skip, take: parseInt(limit) }),
            prisma_1.default.user.count({ where }),
        ]);
        res.json({ users, total, page: parseInt(page), limit: parseInt(limit) });
    }
    catch (err) {
        next(err);
    }
});
// ── PATCH /api/users/:id/salary ──────────────────────────────────────────────
router.patch('/:id/salary', auth_1.auth, DIRECTOR_OR_HR, async (req, res, next) => {
    try {
        const { salary } = req.body;
        if (salary === undefined)
            return res.status(400).json({ error: 'salary is required' });
        const updated = await prisma_1.default.user.update({
            where: { id: req.params.id },
            data: { salary: parseFloat(salary) },
            select: { id: true, name: true, salary: true }
        });
        (0, audit_1.audit)(req.user.id, 'SALARY_UPDATE', 'User', updated.id, `Salary updated for ${updated.name}`, req.ip);
        res.json(updated);
    }
    catch (err) {
        next(err);
    }
});
// ── GET /api/users/:id ───────────────────────────────────────────────────────
router.get('/:id', auth_1.auth, async (req, res, next) => {
    try {
        // Users can view their own profile; admins can view anyone's
        if (req.user.id !== req.params.id && !['DIRECTOR', 'PRINCIPAL', 'HEAD_TEACHER', 'VP_ADMIN', 'HR'].includes(req.user.role)) {
            return res.status(403).json({ error: 'Insufficient permissions' });
        }
        const user = await prisma_1.default.user.findUnique({ where: { id: req.params.id }, select: USER_SELECT });
        if (!user)
            return res.status(404).json({ error: 'User not found' });
        res.json(user);
    }
    catch (err) {
        next(err);
    }
});
// ── POST /api/users ──────────────────────────────────────────────────────────
router.post('/', auth_1.auth, ADMIN, async (req, res, next) => {
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
        const existing = await prisma_1.default.user.findUnique({ where: { email: email.toLowerCase().trim() } });
        if (existing)
            return res.status(409).json({ error: 'A user with this email already exists' });
        const hashed = await bcryptjs_1.default.hash(password, 12);
        const user = await prisma_1.default.user.create({
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
            select: USER_SELECT,
        });
        (0, audit_1.audit)(req.user.id, 'CREATE_USER', 'User', user.id, `${name} (${role})`, req.ip);
        res.status(201).json(user);
    }
    catch (err) {
        next(err);
    }
});
// ── PATCH /api/users/:id ─────────────────────────────────────────────────────
router.patch('/:id', auth_1.auth, async (req, res, next) => {
    try {
        const isSelf = req.user.id === req.params.id;
        const isAdmin = ['DIRECTOR', 'PRINCIPAL'].includes(req.user.role);
        if (!isSelf && !isAdmin) {
            return res.status(403).json({ error: 'Insufficient permissions' });
        }
        const { name, phone, profilePhoto, armId, status, parentId } = req.body;
        // Validate profilePhoto: must be a relative path or https URL, never javascript: or data:
        if (profilePhoto !== undefined && profilePhoto !== null && profilePhoto !== '') {
            const isRelative = /^\/[^/]/.test(profilePhoto);
            let isHttps = false;
            try {
                isHttps = new URL(profilePhoto).protocol === 'https:';
            }
            catch (_) { }
            if (!isRelative && !isHttps) {
                return res.status(400).json({ error: 'profilePhoto must be a relative path or an https:// URL' });
            }
        }
        // Validate parentId: target user must exist and have role PARENT
        if (isAdmin && parentId !== undefined && parentId !== null && parentId !== '') {
            const parentUser = await prisma_1.default.user.findUnique({ where: { id: parentId }, select: { role: true } });
            if (!parentUser)
                return res.status(400).json({ error: 'parentId does not refer to an existing user' });
            if (parentUser.role !== 'PARENT')
                return res.status(400).json({ error: 'parentId must refer to a user with role PARENT' });
        }
        // Only admins can change status / armId / parentId
        const data = {
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
        const user = await prisma_1.default.user.update({ where: { id: req.params.id }, data, select: USER_SELECT });
        (0, audit_1.audit)(req.user.id, 'UPDATE_USER', 'User', user.id, user.name, req.ip);
        res.json(user);
    }
    catch (err) {
        next(err);
    }
});
// ── POST /api/users/:id/disable ──────────────────────────────────────────────
router.post('/:id/disable', auth_1.auth, ADMIN, async (req, res, next) => {
    try {
        if (req.params.id === req.user.id) {
            return res.status(400).json({ error: 'You cannot disable your own account' });
        }
        const target = await prisma_1.default.user.findUnique({ where: { id: req.params.id }, select: { role: true, name: true } });
        if (!target)
            return res.status(404).json({ error: 'User not found' });
        if (req.user.role === 'PRINCIPAL' && ['DIRECTOR', 'PRINCIPAL'].includes(target.role)) {
            return res.status(403).json({ error: 'Principals cannot disable Director or Principal accounts' });
        }
        await prisma_1.default.user.update({ where: { id: req.params.id }, data: { status: 'DISABLED' } });
        (0, audit_1.audit)(req.user.id, 'DISABLE_USER', 'User', req.params.id, target.name, req.ip);
        res.json({ message: 'User account disabled' });
    }
    catch (err) {
        next(err);
    }
});
// ── POST /api/users/:id/enable ───────────────────────────────────────────────
router.post('/:id/enable', auth_1.auth, ADMIN, async (req, res, next) => {
    try {
        const target = await prisma_1.default.user.findUnique({ where: { id: req.params.id }, select: { name: true } });
        if (!target)
            return res.status(404).json({ error: 'User not found' });
        await prisma_1.default.user.update({ where: { id: req.params.id }, data: { status: 'ACTIVE' } });
        (0, audit_1.audit)(req.user.id, 'ENABLE_USER', 'User', req.params.id, target.name, req.ip);
        res.json({ message: 'User account enabled' });
    }
    catch (err) {
        next(err);
    }
});
// ── POST /api/users/:id/reset-password ───────────────────────────────────────
router.post('/:id/reset-password', auth_1.auth, DIRECTOR_ONLY, async (req, res, next) => {
    try {
        const { newPassword } = req.body;
        if (!newPassword || newPassword.length < 8) {
            return res.status(400).json({ error: 'New password must be at least 8 characters' });
        }
        const target = await prisma_1.default.user.findUnique({ where: { id: req.params.id }, select: { name: true } });
        if (!target)
            return res.status(404).json({ error: 'User not found' });
        const hashed = await bcryptjs_1.default.hash(newPassword, 12);
        await prisma_1.default.user.update({ where: { id: req.params.id }, data: { password: hashed, tokenVersion: { increment: 1 } } });
        (0, audit_1.audit)(req.user.id, 'RESET_PASSWORD', 'User', req.params.id, target.name, req.ip);
        res.json({ message: 'Password reset successfully' });
    }
    catch (err) {
        next(err);
    }
});
// ── POST /api/users/:id/assign-arm ──────────────────────────────────────────
// Assign a class arm to teacher (managedArms) or student (enrolledArm)
router.post('/:id/assign-arm', auth_1.auth, ADMIN, async (req, res, next) => {
    try {
        const { armId, asTeacher } = req.body;
        if (!armId)
            return res.status(400).json({ error: 'armId is required' });
        const target = await prisma_1.default.user.findUnique({ where: { id: req.params.id }, select: { role: true, name: true } });
        if (!target)
            return res.status(404).json({ error: 'User not found' });
        let user;
        if (asTeacher || target.role === 'TEACHER') {
            user = await prisma_1.default.user.update({
                where: { id: req.params.id },
                data: { managedArms: { connect: { id: armId } } },
                select: USER_SELECT,
            });
        }
        else {
            user = await prisma_1.default.user.update({
                where: { id: req.params.id },
                data: { armId },
                select: USER_SELECT,
            });
        }
        (0, audit_1.audit)(req.user.id, 'ASSIGN_ARM', 'User', req.params.id, `${target.name} → arm ${armId}`, req.ip);
        res.json(user);
    }
    catch (err) {
        next(err);
    }
});
// ── DELETE /api/users/:id (Director only — hard delete) ──────────────────────
router.delete('/:id', auth_1.auth, DIRECTOR_ONLY, async (req, res, next) => {
    try {
        if (req.params.id === req.user.id) {
            return res.status(400).json({ error: 'You cannot delete your own account' });
        }
        const target = await prisma_1.default.user.findUnique({ where: { id: req.params.id }, select: { name: true } });
        if (!target)
            return res.status(404).json({ error: 'User not found' });
        await prisma_1.default.user.delete({ where: { id: req.params.id } });
        (0, audit_1.audit)(req.user.id, 'DELETE_USER', 'User', req.params.id, target.name, req.ip);
        res.json({ message: 'User permanently deleted' });
    }
    catch (err) {
        next(err);
    }
});
exports.default = router;
