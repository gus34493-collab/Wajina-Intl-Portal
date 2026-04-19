import express from 'express';
import prisma from '../prisma';
import { auth, requireRole } from '../middleware/auth';
import { audit } from '../middleware/audit';
import bcrypt from 'bcryptjs';
import { AdmissionsEmailService } from '../services/emailService';

const router = express.Router();
const MANAGEMENT = requireRole('DIRECTOR', 'PRINCIPAL', 'ADMIN_STAFF', 'HEAD_TEACHER', 'VP_ADMIN', 'VP_ACADEMICS', 'ASST_HEAD_TEACHER', 'BURSAR');
const ADMISSION_OFFICERS = requireRole('DIRECTOR', 'PRINCIPAL', 'ADMIN_STAFF', 'HEAD_TEACHER', 'VP_ADMIN');
const ACADEMIC_REVIEWERS = requireRole('DIRECTOR', 'VP_ACADEMICS', 'ASST_HEAD_TEACHER');
const FINANCIAL_GATEKEEPERS = requireRole('DIRECTOR', 'BURSAR');

// ── GET /api/admissions/stats – KPI counts for the dashboard ─────────────
router.get('/stats', auth, MANAGEMENT, async (req: any, res, next) => {
  try {
    const { sessionId, campus } = req.query;
    
    // Campus Locking
    const campusFilter = req.user.role === 'DIRECTOR' ? campus : req.user.campus;

    let targetSessionId = sessionId;
    if (!targetSessionId) {
      const currentSession = await prisma.academicSession.findFirst({
        where: { status: 'ACTIVE' },
        select: { id: true },
      });
      targetSessionId = currentSession?.id;
    }

    const where: any = {};
    if (targetSessionId) where.sessionId = targetSessionId;
    if (campusFilter) where.campus = campusFilter as any;

    const [total, qualified, offered, feeConfirmed, enrolled, scholarshipReview] = await Promise.all([
      prisma.admission.count({ where }),
      prisma.admission.count({ where: { ...where, status: { in: ['QUALIFIED', 'OFFERED', 'SCHOLARSHIP_REVIEW', 'FEE_CONFIRMED', 'ENROLLED'] } } }),
      prisma.admission.count({ where: { ...where, status: { in: ['OFFERED', 'SCHOLARSHIP_REVIEW', 'FEE_CONFIRMED', 'ENROLLED'] } } }),
      prisma.admission.count({ where: { ...where, status: { in: ['FEE_CONFIRMED', 'ENROLLED'] } } }),
      prisma.admission.count({ where: { ...where, status: 'ENROLLED' } }),
      prisma.admission.count({ where: { ...where, status: 'SCHOLARSHIP_REVIEW' } }),
    ]);

    const yieldPct = total > 0 ? ((enrolled / total) * 100).toFixed(1) : '0.0';

    res.json({ total, qualified, offered, feeConfirmed, enrolled, scholarshipReview, yieldPct });
  } catch (err: any) {
    next(err);
  }
});

// ── GET /api/admissions – list with filters ───────────────────────────────
router.get('/', auth, MANAGEMENT, async (req: any, res, next) => {
  try {
    const { status, campus, type, sessionId, page = 1, limit = 100 } = req.query;
    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

    // Campus Locking
    const campusFilter = req.user.role === 'DIRECTOR' ? campus : req.user.campus;

    const where: any = {};
    if (status) where.status = (status as string).toUpperCase();
    if (campusFilter) where.campus = campusFilter.toUpperCase() as any;
    if (type) where.type = (type as string).toUpperCase();
    if (sessionId) where.sessionId = sessionId as string;

    const [admissions, total] = await Promise.all([
      prisma.admission.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: parseInt(limit as string),
        include: { session: { select: { name: true } } },
      }),
      prisma.admission.count({ where }),
    ]);

    res.json({ admissions, total });
  } catch (err: any) {
    next(err);
  }
});

// ── POST /api/admissions – create new application ─────────────────────────
router.post('/', auth, ADMISSION_OFFICERS, async (req: any, res, next) => {
  try {
    const { applicantName, campus, targetClass, type, parentName, parentPhone, parentEmail, notes, sessionId } = req.body;

    if (!applicantName || !campus || !targetClass || !parentName || !parentPhone) {
      return res.status(400).json({ error: 'applicantName, campus, targetClass, parentName, and parentPhone are required' });
    }
    
    let targetSessionId = sessionId;
    if (!targetSessionId) {
      const currentSession = await prisma.academicSession.findFirst({
        where: { status: 'ACTIVE' },
        select: { id: true },
      });
      targetSessionId = currentSession?.id;
    }

    const { admission } = await prisma.$transaction(async (tx) => {
      const newAdmission = await tx.admission.create({
        data: {
          applicantName: applicantName.trim().slice(0, 150),
          campus: campus.toUpperCase() as any,
          targetClass: targetClass.trim().slice(0, 50),
          type: (type || 'NEW').toUpperCase() as any,
          parentName: parentName.trim().slice(0, 150),
          parentPhone: parentPhone.trim().slice(0, 30),
          parentEmail: parentEmail?.trim().slice(0, 150) || null,
          notes: notes?.trim().slice(0, 500) || null,
          sessionId: targetSessionId || null,
          status: 'APPLIED',
        },
      });

      await tx.auditLog.create({
        data: {
          actorId: req.user.id,
          action: 'ADMISSION_CREATED',
          entity: 'Admission',
          entityId: newAdmission.id,
          detail: `Applicant: ${applicantName}`,
          ipAddress: req.ip
        }
      });

      return { admission: newAdmission };
    });

    res.status(201).json({ admission });
  } catch (err: any) {
    next(err);
  }
});

// ── PATCH /api/admissions/:id – update status & automation ────────────────
router.patch('/:id', auth, MANAGEMENT, async (req: any, res, next) => {
  try {
    const { id } = req.params;
    const { status, notes, entranceScore, classId, armId } = req.body;
    const userRole = req.user.role;

    const existing = await prisma.admission.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ error: 'Admission not found' });

    const result = await prisma.$transaction(async (tx) => {
      // 1. Handle Scoring & Thresholds
      let finalStatus = status;
      const score = entranceScore !== undefined ? parseFloat(entranceScore) : null;

      if (score !== null) {
        if (score >= 90) {
          finalStatus = 'SCHOLARSHIP_REVIEW';
        } else if (score >= 50) {
          finalStatus = 'OFFERED';
        } else {
          finalStatus = 'REJECTED';
        }
      }

      // 2. Handle Automated Email on Fee Confirmation
      if (finalStatus === 'FEE_CONFIRMED' && existing.status !== 'FEE_CONFIRMED') {
        // Trigger email asynchronously (non-blocking)
        AdmissionsEmailService.sendExamDetails(existing.parentEmail || '', existing.applicantName).catch(console.error);
      }
      // 3. Handle Auto-Offer Notifications
      if (finalStatus === 'OFFERED' && existing.status !== 'OFFERED') {
        const notifyRoles = ['DIRECTOR'];
        if (['JUNIOR_SECONDARY', 'SENIOR_SECONDARY'].includes(existing.campus)) notifyRoles.push('PRINCIPAL');
        if (existing.campus === 'PRIMARY') notifyRoles.push('HEAD_TEACHER');

        const receivers = await tx.user.findMany({
          where: {
            role: { in: notifyRoles as any },
            OR: [
              { role: 'DIRECTOR' },
              { campus: existing.campus }
            ]
          },
          select: { id: true }
        });

        await tx.request.createMany({
          data: receivers.map(r => ({
            title: `Auto-Offer Issued: ${existing.applicantName}`,
            description: `Applicant scored ${entranceScore}%. System has automatically issued an admission offer.`,
            level: 'K3',
            status: 'PENDING',
            senderId: req.user.id,
            receiverId: r.id,
          }))
        });
      }

      // 2. Perform the update
      const updated = await tx.admission.update({
        where: { id },
        data: {
          ...(finalStatus && { status: finalStatus.toUpperCase() as any }),
          ...(notes !== undefined && { notes: notes?.trim().slice(0, 500) || null }),
          ...(entranceScore !== undefined && { entranceScore: parseFloat(entranceScore) }),
          ...(classId && { classId }),
          ...(armId && { armId }),
        },
      });

      // 3. Audit Log
      await tx.auditLog.create({
        data: {
          actorId: req.user.id,
          action: 'ADMISSION_UPDATED',
          entity: 'Admission',
          entityId: id,
          detail: `Status: ${finalStatus || existing.status}`,
          ipAddress: req.ip
        }
      });

      return updated;
    });

    res.json({ admission: result });
  } catch (err: any) {
    next(err);
  }
});

// ── PATCH /api/admissions/logistics – Update global email message ────────
router.patch('/logistics', auth, requireRole('DIRECTOR', 'ADMIN_STAFF'), async (req: any, res, next) => {
  try {
    const { message } = req.body;
    if (message === undefined) return res.status(400).json({ error: 'message is required' });

    const updated = await (prisma.globalConfig as any).upsert({
      where: { id: 'SCHOOL_CONFIG' },
      update: { admissionExamLogistics: message },
      create: { id: 'SCHOOL_CONFIG', admissionExamLogistics: message },
    });

    audit(req.user.id, 'CONFIG_UPDATED', 'GlobalConfig', 'SCHOOL_CONFIG', `Updated Admission Exam Logistics`, req.ip);
    res.json({ message: 'Logistics updated successfully', updated });
  } catch (err) {
    next(err);
  }
});

export default router;
