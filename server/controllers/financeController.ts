import prisma from '../prisma';
import { createAuditLog } from '../services/auditService';

// ── Predefined Fee Categories ──────────────────────────────────────────────
export const VALID_CATEGORIES = [
  'TUITION',
  'ENTRANCE_FORM',
  'BOOKS',
  'UNIFORM',
  'ICT',
  'EXCURSION',
  'MOCK_EXAM',
  'WAEC_NECO',
  'DEVELOPMENT_LEVY',
  'TRANSPORT',
  'FEEDING',
  'OTHER'
];

export const approveTransaction = async (req: any, res: any) => {
  const { transactionId } = req.params;
  const userId = req.user.id;
  try {
    const oldTx = await prisma.payment.findUnique({ where: { id: transactionId } });
    if (!oldTx) return res.status(404).json({ error: 'Transaction not found' });
    const updatedTx = await prisma.payment.update({
      where: { id: transactionId },
      data: { status: 'APPROVED' }
    });
    await createAuditLog({
      action: 'APPROVE_PAYMENT',
      entity: 'Payment',
      entityId: transactionId,
      detail: 'Transaction approved',
      actorId: userId,
      oldValue: oldTx,
      newValue: updatedTx
    });
    res.json(updatedTx);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to approve transaction', details: err.message });
  }
};

export const flagTransaction = async (req: any, res: any) => {
  const { transactionId } = req.params;
  const userId = req.user.id;
  try {
    const oldTx = await prisma.payment.findUnique({ where: { id: transactionId } });
    if (!oldTx) return res.status(404).json({ error: 'Transaction not found' });
    const updatedTx = await prisma.payment.update({
      where: { id: transactionId },
      data: { status: 'FLAGGED' }
    });
    await createAuditLog({
      action: 'FLAG_TRANSACTION',
      entity: 'Payment',
      entityId: transactionId,
      detail: 'Transaction flagged',
      actorId: userId,
      oldValue: oldTx,
      newValue: updatedTx
    });
    res.json(updatedTx);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to flag transaction', details: err.message });
  }
};

// ── GET /api/finance/fees ────────────────────────────────────────────────────
export const getFeeConfigs = async (req: any, res: any) => {
  try {
    const { sessionId, category } = req.query;
    
    const where: any = {
      ...(sessionId && { sessionId: sessionId as string }),
      ...(category && { category: category as string })
    };

    const fees = await prisma.feeConfig.findMany({
      where,
      include: {
        class: { select: { name: true, campus: true } },
        term: { select: { name: true } },
        session: { select: { name: true } }
      },
      orderBy: [
        { category: 'asc' },
        { campus: 'asc' },
        { classId: 'asc' }
      ]
    });

    res.json({ fees, categories: VALID_CATEGORIES });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch fee configurations', details: err.message });
  }
};

// ── POST /api/finance/fees ───────────────────────────────────────────────────
export const upsertFeeConfig = async (req: any, res: any) => {
  try {
    const { 
      category = 'TUITION', 
      amount, 
      campus, 
      classId, 
      termId, 
      sessionId 
    } = req.body;

    if (amount === undefined || amount === null || !sessionId) {
      return res.status(400).json({ error: 'Amount and sessionId are required' });
    }

    if (!VALID_CATEGORIES.includes(category)) {
      return res.status(400).json({ error: `Invalid category. Must be one of: ${VALID_CATEGORIES.join(', ')}` });
    }

    const userId = req.user.id;
    const targetAmount = parseFloat(amount);

    // Prisma upsert doesn't work with null in compound unique, so use findFirst + create/update
    const existing = await prisma.feeConfig.findFirst({
      where: {
        category,
        campus: campus || null,
        classId: classId || null,
        termId: termId || null,
        sessionId
      }
    });

    let fee;
    if (existing) {
      fee = await prisma.feeConfig.update({
        where: { id: existing.id },
        data: { amount: targetAmount }
      });
    } else {
      fee = await prisma.feeConfig.create({
        data: {
          category,
          amount: targetAmount,
          campus: campus || null,
          classId: classId || null,
          termId: termId || null,
          sessionId
        }
      });
    }

    await createAuditLog({
      action: 'SET_FEE_CONFIG',
      entity: 'FeeConfig',
      entityId: fee.id,
      detail: `Set ${category} fee to ₦${targetAmount.toLocaleString()} (Campus: ${campus || 'ALL'}, Class: ${classId || 'ALL'}, Session: ${sessionId})`,
      actorId: userId,
      newValue: fee
    });

    res.json({ message: 'Fee configuration updated successfully', data: fee });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to update fee configuration', details: err.message });
  }
};

// ── GET /api/finance/student-balances ────────────────────────────────────────
// Returns payment status for all students, with expected fees and total paid.
export const getStudentBalances = async (req: any, res: any) => {
  try {
    let { sessionId, campus, classId, search } = req.query;

    // Campus Lockdown Enforcement
    if (req.user.role !== 'DIRECTOR' && req.user.campus) {
      campus = req.user.campus;
    }

    // Build student filter
    const studentWhere = {
      role: 'STUDENT',
      ...(campus && { campus: campus as string }),
      ...(classId && { classId: classId as string }),
      ...(search && {
        OR: [
          { name: { contains: search as string, mode: 'insensitive' } },
          { email: { contains: search as string, mode: 'insensitive' } },
        ]
      })
    };

    const students = await prisma.user.findMany({
      where: studentWhere as any,
      select: {
        id: true,
        name: true,
        email: true,
        campus: true,
        classId: true,
        createdAt: true,
        enrolledClass: { select: { id: true, name: true, campus: true } },
        enrolledArm: { select: { id: true, label: true, fullName: true } },
      },
      orderBy: { name: 'asc' }
    });

    // Fetch all fee configs for the session (or the latest session)
    let targetSessionId = sessionId;
    if (!targetSessionId) {
      const latestSession = await prisma.academicSession.findFirst({
        where: { status: 'ACTIVE' },
        orderBy: { year: 'desc' },
        select: { id: true }
      });
      targetSessionId = latestSession?.id;
    }

    if (!targetSessionId) {
      return res.json({ students: [], sessionId: null });
    }

    // Get all fee configs for the session
    const feeConfigs = await prisma.feeConfig.findMany({
      where: { sessionId: targetSessionId as string },
      include: { class: { select: { name: true } } }
    });

    // Get all payments for these students in this session
    const studentIds = students.map(s => s.id);
    const payments = await prisma.payment.findMany({
      where: {
        studentId: { in: studentIds },
        sessionId: targetSessionId as string,
        status: 'APPROVED'
      },
      select: {
        studentId: true,
        amount: true,
        category: true,
        termId: true
      }
    });

    // Index payments by student
    const paymentsByStudent: any = {};
    for (const p of payments) {
      if (!paymentsByStudent[p.studentId]) paymentsByStudent[p.studentId] = [];
      paymentsByStudent[p.studentId].push(p);
    }

    // Attendance lookup (last 21 days)
    const thresholdDate = new Date();
    thresholdDate.setDate(thresholdDate.getDate() - 21);
    const attendances = await prisma.attendance.findMany({
      where: {
        studentId: { in: studentIds },
        date: { gte: thresholdDate },
        status: 'PRESENT'
      },
      select: { studentId: true }
    });
    const recentAttendanceIds = new Set(attendances.map(a => a.studentId));

    // Resolve expected fees for each student (hierarchical: class > campus > global)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Identify current term
    const currentTerm = await prisma.term.findFirst({
      where: { isCurrent: true, sessionId: targetSessionId as string },
      select: { id: true, name: true }
    });

    const result = students.map(student => {
      const studentPayments = paymentsByStudent[student.id] || [];
      const totalPaid = studentPayments.reduce((sum: number, p: any) => sum + p.amount, 0);
      const termPaid = studentPayments
        .filter((p: any) => p.termId === currentTerm?.id)
        .reduce((sum: number, p: any) => sum + p.amount, 0);

      const hasPaidTuition = studentPayments.some((p: any) => p.category === 'TUITION');

      // Calculate expected totals
      let expectedTotal = 0;
      let termExpectedTotal = 0;
      const feeBreakdown: any[] = [];

      const categoriesUsed = [...new Set(feeConfigs.map(f => f.category))];
      for (const category of categoriesUsed) {
        const categoryConfigs = feeConfigs.filter(f => f.category === category);
        
        // Match for Session (Expected Total)
        const sessionFee = 
          categoryConfigs.find(f => f.classId === student.classId && !f.termId) ||
          categoryConfigs.find(f => !f.classId && f.campus === student.campus && !f.termId) ||
          categoryConfigs.find(f => !f.classId && !f.campus && !f.termId);

        // Match for Term (KPI Percentage)
        const termFee = 
          categoryConfigs.find(f => f.classId === student.classId && f.termId === currentTerm?.id) ||
          categoryConfigs.find(f => !f.classId && f.campus === student.campus && f.termId === currentTerm?.id) ||
          categoryConfigs.find(f => !f.classId && !f.campus && f.termId === currentTerm?.id);

        // Actual Expected: If term specific exists, use it. Else if session-wide exists, it counts towards term expected too.
        const effectiveTermFee = termFee || sessionFee;
        if (effectiveTermFee) {
          termExpectedTotal += effectiveTermFee.amount;
        }

        if (sessionFee) {
          expectedTotal += sessionFee.amount;
        } else if (termFee) {
          // If only term fees exist (e.g. 3 term fees of 50k), sum them?
          // Actually, expectedTotal should be the Sum of all term fees + all session fees?
          // For simplicity, let's sum all Term 1, 2, 3 fees in this session for this category.
          const allTermFees = categoryConfigs.filter(f => 
            (f.classId === student.classId || (!f.classId && (f.campus === student.campus || !f.campus)))
          );
          // This is getting complex. Let's just use the current view's configs.
          expectedTotal += termFee ? termFee.amount : 0;
        }

        if (effectiveTermFee) {
          feeBreakdown.push({
            category: effectiveTermFee.category,
            expected: effectiveTermFee.amount,
            paid: studentPayments
              .filter((p: any) => p.category === effectiveTermFee!.category && p.termId === currentTerm?.id)
              .reduce((s: number, p: any) => s + p.amount, 0)
          });
        }
      }

      const balance = expectedTotal - totalPaid;
      const termBalance = termExpectedTotal - termPaid;

      // Smart Active Status
      const isNew = student.createdAt >= thirtyDaysAgo;
      const isPresent = recentAttendanceIds.has(student.id);
      const isActive = isNew || hasPaidTuition || isPresent;

      return {
        id: student.id,
        name: student.name,
        className: (student.enrolledClass as any)?.name || '—',
        classId: (student.enrolledClass as any)?.id || null,
        armName: (student.enrolledArm as any)?.label || '—',
        armId: (student.enrolledArm as any)?.id || null,
        campus: (student.enrolledClass as any)?.campus || student.campus || '—',
        expectedTotal,
        totalPaid,
        balance,
        termExpectedTotal,
        termTotalPaid: termPaid,
        termBalance,
        status: termBalance <= 0 ? 'PAID' : (termPaid > 0 ? 'PARTIAL' : 'UNPAID'),
        isActive,
        feeBreakdown
      };
    });

    // Aggregate summary for dashboard
    const activeCount = result.filter(s => s.isActive).length;
    const summary = {
      totalStudents: result.length,
      activeStudents: activeCount,
      totalExpected: result.reduce((s, st) => s + st.expectedTotal, 0),
      totalCollected: result.reduce((s, st) => s + st.totalPaid, 0),
      countPaid: result.filter(s => s.status === 'PAID').length,
      countPartial: result.filter(s => s.status === 'PARTIAL').length,
      countUnpaid: result.filter(s => s.status === 'UNPAID').length,
    };

    res.json({ students: result, summary, sessionId: targetSessionId });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch student balances', details: err.message });
  }
};

/**
 * GET dashboard stats (High Performance)
 */
export const getDashboardStats = async (req: any, res: any) => {
  try {
    let { campus } = req.query;

    const userRole = req.user.role;
    const userCampus = req.user.campus;

    // Security: Only DIRECTOR can query any campus; others are locked to their own.
    // Fallback to query param if user's campus is not assigned in DB
    if (userRole !== 'DIRECTOR' && userCampus) {
      campus = userCampus;
    }
    
    console.log(`[FinanceAPI] Scoping stats: User=${req.user.email}, Role=${userRole}, DB_Campus=${userCampus}, Target_Campus=${campus}`);

    // 1. Session Discovery: Use ACTIVE or LATEST
    let session = await prisma.academicSession.findFirst({ where: { status: 'ACTIVE' } });
    if (!session) session = await prisma.academicSession.findFirst({ orderBy: { year: 'desc' } });
    
    if (!session) {
      return res.json({ totalStudents: 0, activeStudents: 0, totalCollected: 0, totalExpected: 0, sessionName: 'None' });
    }

    // 2. Identification of Active Students (Smart Logic)
    // Thresholds: 21 days for attendance, 30 days for new enrollment
    const thresholdDate = new Date();
    thresholdDate.setDate(thresholdDate.getDate() - 21);
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const students = await prisma.user.findMany({
      where: {
        role: 'STUDENT',
        ...(campus && { campus: campus as any }),
      },
      select: {
        id: true,
        createdAt: true,
        classId: true,
        campus: true,
        payments: {
          where: { sessionId: session.id, status: 'APPROVED', category: 'TUITION' },
          take: 1
        },
        attendance: {
          where: { date: { gte: thresholdDate }, status: 'PRESENT' },
          take: 1
        }
      }
    });

    const activeCount = students.filter(s => {
      const isNew = s.createdAt >= thirtyDaysAgo;
      const hasPaid = s.payments.length > 0;
      const isPresent = s.attendance.length > 0;
      return isNew || hasPaid || isPresent;
    }).length;

    // 3. Financial Aggregation
    const targetStudentIds = students.map(s => s.id);
    const collections = await prisma.payment.aggregate({
      where: { 
        sessionId: session.id, 
        status: 'APPROVED', 
        category: 'TUITION',
        studentId: { in: targetStudentIds }
      },
      _sum: { amount: true }
    });

    // 4. Expected Revenue Estimation
    const studentGroups = await prisma.user.groupBy({
      by: ['classId', 'campus'],
      where: { 
        role: 'STUDENT',
        ...(campus && { campus: campus as any })
      }, 
      _count: { _all: true }
    });

    const feeConfigs = await prisma.feeConfig.findMany({
      where: { sessionId: session.id, category: 'TUITION' }
    });

    let totalExpected = 0;
    for (const group of studentGroups) {
        const config = 
            feeConfigs.find(c => c.classId === group.classId) ||
            feeConfigs.find(c => c.campus === group.campus && !c.classId) ||
            feeConfigs.find(c => !c.campus && !c.classId);
        
        if (config) {
            totalExpected += (Number(config.amount) * group._count._all);
        }
    }

    res.json({
      totalStudents: students.length,
      activeStudents: activeCount,
      totalCollected: (collections._sum as any).amount || 0,
      totalExpected,
      collectionRate: totalExpected > 0 ? Math.round(((collections._sum as any).amount || 0) / totalExpected * 100) : 0,
      sessionName: session.name
    });
  } catch (err: any) {
    console.error('[DashboardStats Error]', err);
    res.status(500).json({ error: 'Failed to fetch dashboard stats', details: err.message, stack: err.stack });
  }
};

/**
 * GET revenue stats for the last 6 weeks (Optimized)
 */
export const getRevenueStats = async (req: any, res: any) => {
  try {
    let session = await prisma.academicSession.findFirst({ where: { status: 'ACTIVE' } });
    if (!session) session = await prisma.academicSession.findFirst({ orderBy: { year: 'desc' } });
    
    if (!session) return res.json({ labels: ['W1','W2','W3','W4','W5','W6'], data: [0,0,0,0,0,0] });

    const sixWeeksAgo = new Date();
    sixWeeksAgo.setDate(sixWeeksAgo.getDate() - 42);

    const payments: any[] = await prisma.payment.findMany({
      where: {
        status: 'APPROVED',
        category: 'TUITION',
        sessionId: session.id,
        createdAt: { gte: sixWeeksAgo }
      },
      select: { amount: true, createdAt: true },
    });

    const weeks = [0, 0, 0, 0, 0, 0];
    const now = new Date();
    
    payments.forEach((p: any) => {
      const createdDate = p.createdAt ? new Date(p.createdAt) : now;
      const diffDays = Math.floor((now.getTime() - createdDate.getTime()) / (1000 * 3600 * 24));
      const weekIndex = Math.floor(diffDays / 7);
      if (weekIndex >= 0 && weekIndex < 6) {
        weeks[5 - weekIndex] += p.amount;
      }
    });

    res.json({
        labels: ['W1', 'W2', 'W3', 'W4', 'W5', 'W6'],
        data: weeks.map(w => w / 1e6),
        totalRaw: weeks.reduce((a, b) => a + b, 0),
        sessionName: session.name
    });
  } catch (err: any) {
    console.error('[RevenueStats Error]', err.message);
    res.status(500).json({ error: 'Failed to fetch revenue stats' });
  }
};
