import { Router } from 'express';
import prisma from '../prisma';
const checkRole = require('../middleware/rbac');
import { AcademicSessionUpdateSchema, validateSessionConsistency } from '../utils/validation';

const router = Router();

// Roles allowed to contribute to session planning
const LEADERSHIP_ROLES = [
  'DIRECTOR', 
  'PRINCIPAL', 
  'VP_ADMIN', 
  'VP_ACADEMICS', 
  'HEAD_TEACHER', 
  'ASST_HEAD_TEACHER'
];

/**
 * Roles allowed to edit Core Institutional Metadata (Name, totalWeeks)
 */
const CORE_ADMIN_ROLES = ['DIRECTOR', 'PRINCIPAL', 'HEAD_TEACHER'];

/**
 * GET current session metadata
 */
router.get('/active', checkRole(LEADERSHIP_ROLES), async (req, res) => {
  const session = await prisma.academicSession.findFirst({
    where: { status: 'ACTIVE' }
  });
  res.json(session);
});

/**
 * UPDATE academic session (With Optimistic Concurrency Control)
 */
router.put('/:id', 
  checkRole(LEADERSHIP_ROLES),
  async (req: any, res: any) => {
    try {
      // 1. Structural Validation (Zod)
      const parseResult = AcademicSessionUpdateSchema.safeParse(req.body);
      if (!parseResult.success) {
        return res.status(400).json({ error: 'VALIDATION_FAILED', details: parseResult.error.format() });
      }

      const { id } = req.params;
      const { version, name, totalWeeks, termWeights } = parseResult.data;

      // 2. Field-Level RBAC (Senior Reviewer Requirement)
      const userRole = req.user?.role;
      const isCoreAdmin = CORE_ADMIN_ROLES.includes(userRole);

      if (!isCoreAdmin && (name !== undefined || totalWeeks !== undefined)) {
        return res.status(403).json({ 
          error: 'FORBIDDEN', 
          message: 'Insufficient Permissions: Only Directors, Principals, or Head Teachers can modify core institutional metadata (Name/Duration).' 
        });
      }

      // 3. Consistency Logic
      try {
        validateSessionConsistency(parseResult.data);
      } catch (err: any) {
        return res.status(400).json({ error: 'INCONSISTENT_DATA', message: err.message });
      }

      // 4. Optimistic Locking
      const updated = await prisma.academicSession.updateMany({
        where: { id, version },
        data: {
          name,
          totalWeeks,
          termWeights: termWeights as any,
          version: { increment: 1 },
          lastUpdatedBy: req.user?.name || 'Unknown'
        }
      });

      if (updated.count === 0) {
        return res.status(409).json({ 
          error: 'CONFLICT', 
          message: 'The session was updated by another administrator. Please refresh before saving.' 
        });
      }

      const freshSession = await prisma.academicSession.findUnique({ where: { id } });
      res.json(freshSession);
    } catch (error) {
      console.error('[SessionRoute] Hardened Update Error:', error);
      res.status(500).json({ error: 'Failed to update academic session.' });
    }
});

export default router;
