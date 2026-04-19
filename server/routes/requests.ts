import express from 'express';
import prisma from '../prisma';
import { auth, requireRole } from '../middleware/auth';
import { audit } from '../middleware/audit';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const router = express.Router();
const MANAGEMENT = requireRole('DIRECTOR', 'PRINCIPAL', 'HEAD_TEACHER', 'VP_ADMIN', 'VP_ACADEMICS', 'ASST_HEAD_TEACHER', 'DEAN_STUDENTS', 'ADMIN_STAFF', 'ACCOUNTS_OFFICER');

// ── Multer Storage Config ─────────────────────────────────────────────────────
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = 'uploads/submissions';
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage,
  fileFilter: (req, file, cb) => {
    const allowed = ['.pdf', '.doc', '.docx'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Only PDF and Word documents are allowed'));
    }
  },
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB Limit
});

// ── GET /api/requests/count – KPI summary counts ──────────────────────────
router.get('/count', auth, async (req: any, res, next) => {
  try {
    const campus = req.user.campus;
    const role = req.user.role;
    
    let where: any = {};
    if (role !== 'DIRECTOR' && campus) {
      where.OR = [
        { sender: { campus } },
        { receiverId: req.user.id }
      ];
    }

    const [pending, approved, denied, total] = await Promise.all([
      prisma.request.count({ where: { ...where, status: 'PENDING' } }),
      prisma.request.count({ where: { ...where, status: 'APPROVED' } }),
      prisma.request.count({ where: { ...where, status: 'DENIED' } }),
      prisma.request.count({ where }),
    ]);
    res.json({ pending, approved, denied, total });
  } catch (err) {
    next(err);
  }
});

// ── GET /api/requests – list all requests (management view) ───────────────
router.get('/', auth, MANAGEMENT, async (req: any, res, next) => {
  try {
    const { status, level, page = 1, limit = 200 } = req.query;
    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

    const campus = req.user.campus;
    const role = req.user.role;

    const where: any = {};
    if (status) where.status = status.toUpperCase();
    if (level) where.level = level.toUpperCase();
    
    // Campus Scope
    if (role !== 'DIRECTOR' && campus) {
      where.OR = [
        { sender: { campus } },
        { receiverId: req.user.id }
      ];
    }

    const [requests, total] = await Promise.all([
      prisma.request.findMany({
        where,
        include: {
          sender: { select: { id: true, name: true, role: true, campus: true } },
          receiver: { select: { id: true, name: true, role: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: parseInt(limit as string),
      }),
      prisma.request.count({ where }),
    ]);

    res.json({ requests, total });
  } catch (err) {
    next(err);
  }
});

// ── POST /api/requests – submit a new request (any authenticated user) ────
router.post('/', auth, async (req: any, res, next) => {
  try {
    const { level, title, description } = req.body;
    if (!level || !title || !description) {
      return res.status(400).json({ error: 'level, title, and description are required' });
    }
    const validLevels = ['K1', 'K2', 'K3'];
    if (!validLevels.includes(level)) {
      return res.status(400).json({ error: 'Invalid level. Must be K1, K2, or K3' });
    }

    const request = await prisma.request.create({
      data: {
        level,
        title: title.trim().slice(0, 200),
        description: description.trim().slice(0, 2000),
        status: 'PENDING',
        senderId: req.user.id,
      },
      include: { sender: { select: { id: true, name: true, role: true } } },
    });

    audit(req.user.id, 'REQUEST_SUBMITTED', 'Request', request.id, `Title: ${title}`, req.ip);
    res.status(201).json({ request });
  } catch (err) {
    next(err);
  }
});

// ── POST /api/requests/upload – submit a file-based request ───────────────────
router.post('/upload', auth, upload.single('file'), async (req: any, res, next) => {
  try {
    const { level, title, description, category } = req.body;
    if (!req.file) return res.status(400).json({ error: 'File is required' });
    if (!level || !title || !category) return res.status(400).json({ error: 'level, title, and category are required' });

    const request = await (prisma.request as any).create({
      data: {
        level,
        title: title.trim().slice(0, 200),
        description: (description || '').trim().slice(0, 2000),
        category,
        fileUrl: `/uploads/submissions/${req.file.filename}`,
        status: 'PENDING',
        senderId: req.user.id,
      },
      include: { sender: { select: { id: true, name: true, role: true } } },
    });

    audit(req.user.id, 'SUBMISSION_UPLOADED', 'Request', request.id, `Category: ${category} | Title: ${title}`, req.ip);
    res.status(201).json({ request });
  } catch (err: any) {
    next(err);
  }
});

// ── PATCH /api/requests/:id – approve, deny, or forward ──────────────────
router.patch('/:id', auth, MANAGEMENT, async (req: any, res, next) => {
  try {
    const { id } = req.params;
    const { action, reason } = req.body;

    const existing = await prisma.request.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ error: 'Request not found' });

    let data: any = {};
    if (action === 'approve') {
      if (req.user.role === 'ACCOUNTS_OFFICER') {
        data = { status: 'AWAITING_DIRECTOR', feedback: reason || 'Verified by Accounts. Awaiting final Director signature.' };
      } else if (req.user.role === 'DIRECTOR') {
        data = { status: 'APPROVED', feedback: reason || 'Authorized and Approved.' };
      } else {
        // Fallback for other management roles
        data = { status: 'APPROVED', feedback: reason || 'Approved' };
      }
    } else if (action === 'deny') {
      data = { status: 'DENIED', feedback: reason || 'No reason provided' };
    } else if (action === 'forward') {
      data = { isForwarded: true, receiverId: req.user.id };
    } else {
      return res.status(400).json({ error: 'action must be approve, deny, or forward' });
    }

    const updated = await prisma.request.update({
      where: { id },
      data,
      include: { sender: { select: { id: true, name: true, role: true } } },
    });

    audit(req.user.id, `REQUEST_${action.toUpperCase()}D`, 'Request', id, reason || '', req.ip);
    res.json({ request: updated });
  } catch (err) {
    next(err);
  }
});

export default router;
