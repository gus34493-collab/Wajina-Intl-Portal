import express from 'express';
import prisma from '../prisma';
import { auth, requireRole, requireCampus } from '../middleware/auth';

const router = express.Router();
const PRINCIPAL_PLUS = requireRole('DIRECTOR', 'PRINCIPAL');
const FINANCE = requireRole('DIRECTOR', 'PRINCIPAL', 'ACCOUNTS_OFFICER', 'BURSAR');

async function audit(actorId: string, action: string, entity: string, entityId: string, detail: string, ip: string) {
  try {
    await prisma.auditLog.create({ 
      data: { actorId, action, entity, entityId, detail, ipAddress: ip } 
    });
  } catch (err) {
    console.error('[PaymentAudit Error]', err);
  }
}

// ── GET /api/payments ─────────────────────────────────────────────────────────
router.get('/', auth, FINANCE, async (req: any, res: any, next: any) => {
  try {
    const { campus, termId, category, page = 1, limit = 200 } = req.query;
    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

    const currentTerm = termId
      ? { id: termId }
      : await prisma.term.findFirst({ where: { isCurrent: true }, select: { id: true, name: true } });

    // Campus Enforcement
    const effectiveCampus = (req.user.role !== 'DIRECTOR' && req.user.campus) ? req.user.campus : campus;
    const whereStudent = { role: 'STUDENT', status: 'ACTIVE', ...(effectiveCampus && { campus: effectiveCampus }) };

    const payments = await prisma.payment.findMany({
      where: {
        ...(currentTerm && { termId: (currentTerm as any).id }),
        ...(category && { category: category as string }),
        student: whereStudent as any,
      },
      select: {
        id: true,
        reference: true,
        amount: true,
        status: true,
        termId: true,
        student: {
          select: {
            id: true,
            name: true,
            campus: true,
            enrolledClass: { select: { name: true } },
            enrolledArm: { select: { fullName: true, class: { select: { name: true } } } },
          },
        },
      },
      orderBy: { id: 'desc' },
      skip,
      take: parseInt(limit as string),
    });

    res.json({ payments, currentTerm: currentTerm || null });
  } catch (err) {
    next(err);
  }
});

// ── POST /api/payments ────────────────────────────────────────────────────────
router.post('/', auth, FINANCE, async (req: any, res: any, next: any) => {
  try {
    const { studentId, studentName, amount, reference, channel, notes, termId, category = 'TUITION' } = req.body;

    if (!amount || amount <= 0) return res.status(400).json({ error: 'Amount must be greater than zero.' });
    if (!reference) return res.status(400).json({ error: 'Reference number is required.' });

    let resolvedStudentId = studentId;

    if (!resolvedStudentId && studentName) {
      const student = await prisma.user.findFirst({
        where: { role: 'STUDENT', name: { equals: studentName.trim(), mode: 'insensitive' } },
        select: { id: true },
      });
      if (student) resolvedStudentId = student.id;
    }

    if (!resolvedStudentId) {
      return res.status(400).json({ error: 'Could not identify student. Provide a valid studentId or exact student name.' });
    }

    let resolvedTermId = termId;
    if (!resolvedTermId) {
      const currentTerm = await prisma.term.findFirst({ where: { isCurrent: true }, select: { id: true } });
      if (currentTerm) resolvedTermId = currentTerm.id;
    }

    const existing = await prisma.payment.findUnique({ where: { reference } });
    if (existing) return res.status(409).json({ error: 'A payment with this reference number already exists.' });

    // ─────────────────────────────────────────────────────────────────────────
    // OVERPAYMENT PROTECTION (SESSION CEILING)
    // ─────────────────────────────────────────────────────────────────────────
    const student = await prisma.user.findUnique({
      where: { id: resolvedStudentId },
      select: { id: true, campus: true, classId: true }
    });

    if (!student) return res.status(404).json({ error: 'Student not found.' });

    const term = await prisma.term.findUnique({
      where: { id: resolvedTermId || '' },
      select: { sessionId: true }
    });
    
    if (!term) return res.status(400).json({ error: 'Valid term/session context required for payment validation.' });

    // 1. Calculate Expected Session Total for this student
    const feeConfigs = await prisma.feeConfig.findMany({
      where: { sessionId: term.sessionId }
    });

    const categories = [...new Set(feeConfigs.map(f => f.category))];
    let sessionExpectedTotal = 0;

    for (const cat of categories) {
      const catConfigs = feeConfigs.filter(f => f.category === cat);
      // Hierarchical match for SESSION-level fees (where termId is null)
      const sessionFee = 
        catConfigs.find(f => f.classId === student.classId && !f.termId) ||
        catConfigs.find(f => !f.classId && f.campus === student.campus && !f.termId) ||
        catConfigs.find(f => !f.classId && !f.campus && !f.termId);
      
      if (sessionFee) {
        sessionExpectedTotal += sessionFee.amount;
      } else {
        // Handle term-split fees: Sum all term-specific configs for this category
        const termFees = catConfigs.filter(f => 
          (f.classId === student.classId || (!f.classId && (f.campus === student.campus || !f.campus))) &&
          f.termId !== null
        );
        // We only take unique terms for this category to avoid double counting if multiple class/campus matches exist
        const uniqueTerms = [...new Set(termFees.map(f => f.termId))];
        for (const t of uniqueTerms) {
            const bestTermFee = 
                termFees.find(f => f.classId === student.classId && f.termId === t) ||
                termFees.find(f => !f.classId && f.campus === student.campus && f.termId === t) ||
                termFees.find(f => !f.classId && !f.campus && f.termId === t);
            if (bestTermFee) sessionExpectedTotal += bestTermFee.amount;
        }
      }
    }

    // 2. Sum Existing Session Payments
    const existingPayments = await prisma.payment.findMany({
      where: {
        studentId: resolvedStudentId,
        sessionId: term.sessionId,
        status: { in: ['SUCCESS', 'APPROVED'] }
      },
      select: { amount: true }
    });
    const alreadyPaid = existingPayments.reduce((sum, p) => sum + p.amount, 0);

    // 3. Enforcement
    const newAmount = parseFloat(amount);
    if (sessionExpectedTotal > 0 && (alreadyPaid + newAmount) > sessionExpectedTotal) {
      return res.status(400).json({
        error: `Action blocked: This payment would exceed the total institutional requirement (₦${sessionExpectedTotal.toLocaleString()}) for this session.`,
        details: { expected: sessionExpectedTotal, alreadyPaid, requested: newAmount }
      });
    }
    // ─────────────────────────────────────────────────────────────────────────

    // Atomic Transaction for Financial Integrity
    const { payment } = await prisma.$transaction(async (tx) => {
      // 1. Create the Payment record
      const newPayment = await tx.payment.create({
        data: {
          reference: reference.trim(),
          amount: parseFloat(amount),
          category: category,
          status: 'SUCCESS',
          studentId: resolvedStudentId,
          ...(resolvedTermId && { termId: resolvedTermId }),
        },
        select: {
          id: true, reference: true, amount: true, category: true, status: true,
          student: { select: { id: true, name: true, campus: true } },
        },
      });

      // 2. Create the Audit Log (Atomic)
      await tx.auditLog.create({
        data: {
          actorId: req.user.id,
          action: 'CREATE_PAYMENT',
          entity: 'Payment',
          entityId: newPayment.id,
          detail: `${channel || 'manual'}: ₦${amount} for student ${resolvedStudentId}${notes ? ' — ' + notes : ''}`,
          ipAddress: req.ip
        }
      });

      return { payment: newPayment };
    });

    res.status(201).json({ payment });
  } catch (err) {
    next(err);
  }
});

// ── GET /api/payments/fee-status ─────────────────────────────────────────────
router.get('/fee-status', auth, FINANCE, async (req: any, res: any, next: any) => {
  try {
    const { campus, classId, armId, status, search, page = 1, limit = 50 } = req.query;
    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

    const currentTerm = await prisma.term.findFirst({
      where: { isCurrent: true },
      select: { id: true, name: true, session: { select: { name: true } } },
    });

    const effectiveCampus = (req.user.role !== 'DIRECTOR' && req.user.campus) ? req.user.campus : (campus as any);

    const studentWhere = {
      role: 'STUDENT',
      status: 'ACTIVE',
      ...(effectiveCampus && { campus: effectiveCampus }),
      ...(classId && { classId: classId as string }),
      ...(armId && { armId: armId as string }),
      ...(search && {
        OR: [
          { name: { contains: search as string, mode: 'insensitive' } },
          { id: { contains: search as string, mode: 'insensitive' } },
        ],
      }),
    };

    const [students, total] = await Promise.all([
      prisma.user.findMany({
        where: studentWhere as any,
        select: {
          id: true,
          name: true,
          campus: true,
          enrolledArm: {
            select: {
              id: true,
              label: true,
              fullName: true,
              class: { select: { id: true, name: true, campus: true } },
            },
          },
          enrolledClass: { select: { id: true, name: true, campus: true } },
          payments: currentTerm
            ? {
                where: { termId: currentTerm.id },
                select: { id: true, reference: true, amount: true, status: true },
                orderBy: { id: 'desc' },
                take: 1,
              }
            : {
                select: { id: true, reference: true, amount: true, status: true },
                orderBy: { id: 'desc' },
                take: 1,
              },
        },
        orderBy: { name: 'asc' },
        skip,
        take: parseInt(limit as string),
      }),
      prisma.user.count({ where: studentWhere as any }),
    ]);

    const annotated = students.map((s: any) => {
      const latestPayment = s.payments[0] || null;
      const paid = latestPayment?.status === 'SUCCESS';
      return {
        id: s.id,
        name: s.name,
        campus: s.campus,
        class: s.enrolledClass || s.enrolledArm?.class || null,
        arm: s.enrolledArm || null,
        paymentStatus: paid ? 'PAID' : 'UNPAID',
        paymentAmount: latestPayment?.amount || null,
        paymentReference: latestPayment?.reference || null,
      };
    });

    const filtered = status ? annotated.filter((s: any) => s.paymentStatus === status) : annotated;

    const allStudents = await prisma.user.findMany({
      where: studentWhere as any,
      select: {
        payments: currentTerm
          ? { where: { termId: currentTerm.id }, select: { status: true }, take: 1 }
          : { select: { status: true }, take: 1 },
      },
    });

    let paidCount = 0;
    let unpaidCount = 0;
    for (const s of allStudents) {
      const payment = s.payments[0];
      if (payment?.status === 'SUCCESS') paidCount++;
      else unpaidCount++;
    }

    res.json({
      students: filtered,
      total: status ? filtered.length : total,
      page: parseInt(page as string),
      limit: parseInt(limit as string),
      currentTerm: currentTerm
        ? { id: currentTerm.id, name: currentTerm.name, session: (currentTerm as any).session.name }
        : null,
      summary: { total: allStudents.length, paid: paidCount, unpaid: unpaidCount },
    });
  } catch (err) {
    next(err);
  }
});

// ── GET /api/payments/fee-status/by-class ───────────────────────────────────
router.get('/fee-status/by-class', auth, FINANCE, async (req: any, res: any, next: any) => {
  try {
    const { campus } = req.query;

    const currentTerm = await prisma.term.findFirst({
      where: { isCurrent: true },
      select: { id: true },
    });

    const students = await prisma.user.findMany({
      where: {
        role: 'STUDENT',
        status: 'ACTIVE',
        ...(campus && { campus: campus as any }),
      },
      select: {
        id: true,
        enrolledArm: {
          select: {
            id: true,
            label: true,
            fullName: true,
            class: { select: { id: true, name: true } },
          },
        },
        enrolledClass: { select: { id: true, name: true } },
        payments: currentTerm
          ? { where: { termId: currentTerm.id }, select: { status: true }, take: 1 }
          : { select: { status: true }, take: 1 },
      },
    });

    const classMap: Record<string, any> = {};
    for (const s of (students as any[])) {
      const cls = s.enrolledClass || s.enrolledArm?.class;
      const arm = s.enrolledArm;
      if (!cls) continue;
      if (!classMap[cls.id]) classMap[cls.id] = { id: cls.id, name: cls.name, arms: {}, paid: 0, unpaid: 0 };
      const paid = s.payments[0]?.status === 'SUCCESS';
      if (paid) classMap[cls.id].paid++;
      else classMap[cls.id].unpaid++;

      if (arm) {
        if (!classMap[cls.id].arms[arm.id]) {
          classMap[cls.id].arms[arm.id] = { id: arm.id, name: arm.label, fullName: arm.fullName, paid: 0, unpaid: 0 };
        }
        if (paid) classMap[cls.id].arms[arm.id].paid++;
        else classMap[cls.id].arms[arm.id].unpaid++;
      }
    }

    const result = Object.values(classMap).map((c: any) => ({
      ...c,
      arms: Object.values(c.arms),
    }));

    result.sort((a, b) => a.name.localeCompare(b.name));
    res.json({ classes: result });
  } catch (err) {
    next(err);
  }
});

export default router;
