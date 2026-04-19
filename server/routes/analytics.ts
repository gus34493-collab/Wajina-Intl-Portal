import express from 'express';
import * as analyticsService from '../services/analyticsService';
import { auth, requireRole } from '../middleware/auth';

const router = express.Router();
const MANAGEMENT = requireRole('DIRECTOR', 'PRINCIPAL', 'HEAD_TEACHER', 'VP_ADMIN', 'VP_ACADEMICS', 'ASST_HEAD_TEACHER', 'BURSAR');

/**
 * GET /api/analytics/snapshot
 * Main dashboard snapshot aggregate
 */
router.get('/snapshot', auth, MANAGEMENT, async (req: any, res, next) => {
  try {
    let campus = req.query.campus as string;
    const userRole = req.user.role;
    const userCampus = req.user.campus;

    // Security check: Non-Director management can only see their own campus
    if (userRole !== 'DIRECTOR' && userCampus) {
      campus = userCampus;
    }

    const [finance, academic, operational, weeklyFeeCompliance] = await Promise.all([
      analyticsService.getFinancialSnapshot(campus),
      analyticsService.getAcademicPulse(campus),
      analyticsService.getOperationalStats(campus),
      analyticsService.getWeeklyFeeCompliance(campus)
    ]);

    res.json({
      finance: {
        ...finance,
        weeklyFeeCompliance: weeklyFeeCompliance
      },
      academic,
      operational,
      timestamp: new Date().toISOString(),
      campus: campus || 'ALL'
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/analytics/subjects
 * Performance by specific subject
 */
router.get('/subjects', auth, MANAGEMENT, async (req: any, res, next) => {
    try {
        const campus = req.user.role === 'DIRECTOR' ? req.query.campus : req.user.campus;
        const data = await analyticsService.getSubjectAnalytics(campus as string);
        res.json({ subjects: data, campus: campus || 'ALL' });
    } catch (err) { next(err); }
});

/**
 * GET /api/analytics/retention
 * Retention calculation by class
 */
router.get('/retention', auth, MANAGEMENT, async (req: any, res, next) => {
    try {
        const campus = req.user.role === 'DIRECTOR' ? req.query.campus : req.user.campus;
        const data = await analyticsService.getRetentionAnalysis(campus as string);
        res.json({ retention: data, campus: campus || 'ALL' });
    } catch (err) { next(err); }
});

/**
 * GET /api/analytics/academics
 * Detailed academic compliance stats
 */
router.get('/academics', auth, MANAGEMENT, async (req: any, res, next) => {
    try {
        const campus = req.user.role === 'DIRECTOR' ? req.query.campus : req.user.campus;
        const data = await analyticsService.getDetailedAcademicStats(campus as string);
        res.json(data);
    } catch (err) { next(err); }
});

/**
 * GET /api/analytics/alerts
 * Critical academic submission alerts
 */
router.get('/alerts', auth, MANAGEMENT, async (req: any, res, next) => {
    try {
        const campus = req.user.role === 'DIRECTOR' ? req.query.campus : req.user.campus;
        const data = await analyticsService.getAcademicAlerts(campus as string);
        res.json(data);
    } catch (err) { next(err); }
});

export default router;
