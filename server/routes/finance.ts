import express from 'express';
import * as financeController from '../controllers/financeController';
import { auth, requireRole } from '../middleware/auth';

const router = express.Router();

const FINANCE_ROLES = requireRole('ACCOUNTS_OFFICER', 'BURSAR', 'DIRECTOR');
const DIRECTOR_ONLY = requireRole('DIRECTOR');

// Approve a transaction
router.put('/approve/:transactionId', auth, FINANCE_ROLES, financeController.approveTransaction);

// Flag a transaction
router.put('/flag/:transactionId', auth, FINANCE_ROLES, financeController.flagTransaction);

// GET /api/finance/dashboard-stats - High performance aggregate stats
router.get('/dashboard-stats', auth, requireRole('DIRECTOR', 'PRINCIPAL', 'HEAD_TEACHER'), financeController.getDashboardStats);

// GET /api/finance/fees - List fee targets
router.get('/fees', auth, requireRole('DIRECTOR', 'BURSAR', 'PRINCIPAL', 'HEAD_TEACHER', 'ACCOUNTS_OFFICER'), financeController.getFeeConfigs);

// POST /api/finance/fees - Upsert fee target (DIRECTOR ONLY)
router.post('/fees', auth, DIRECTOR_ONLY, financeController.upsertFeeConfig);

// GET /api/finance/revenue-stats - Weekly revenue trend
router.get('/revenue-stats', auth, DIRECTOR_ONLY, financeController.getRevenueStats);

// GET /api/finance/student-balances - Get payment status for all students
router.get('/student-balances', auth, requireRole('DIRECTOR', 'BURSAR', 'PRINCIPAL', 'ACCOUNTS_OFFICER', 'HEAD_TEACHER', 'ASST_HEAD_TEACHER'), financeController.getStudentBalances);

export default router;
