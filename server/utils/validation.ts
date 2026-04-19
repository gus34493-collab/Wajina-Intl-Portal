import { z } from 'zod';

/**
 * Leadership Intelligence Domain Schemas
 */

export const TermWeightSchema = z.object({
  term: z.enum(['FIRST', 'SECOND', 'THIRD']),
  weeks: z.number().int().min(1).max(20),
  profile: z.enum(['LINEAR', 'ACCELERATED', 'FRONT_LOADED']),
});

export const AcademicSessionUpdateSchema = z.object({
  name: z.string().min(5).max(50).optional(),
  totalWeeks: z.number().int().min(1).max(52).optional(),
  termWeights: z.array(TermWeightSchema).min(3).max(3).optional(),
  version: z.number().int(),
});

/**
 * Verify that term weight weeks sum up to something logical 
 * (Does not have to match totalWeeks exactly due to holidays/buffer, 
 * but should be within a reasonable threshold)
 */
export const validateSessionConsistency = (data: any) => {
  if (data.termWeights && data.totalWeeks) {
    const weightsTotal = data.termWeights.reduce((sum: number, tw: any) => sum + tw.weeks, 0);
    // Threshold: Academic weeks shouldn't exceed total session weeks by more than 4 (padding)
    if (weightsTotal > data.totalWeeks + 4) {
      throw new Error(`Inconsistent Data: Term weeks (${weightsTotal}) cannot significantly exceed total session weeks (${data.totalWeeks})`);
    }
  }
};
