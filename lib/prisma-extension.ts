import { PrismaClient } from '@prisma/client';

export const xprisma = (prisma: PrismaClient) => {
  return prisma.$extends({
    query: {
      $allModels: {
        async $allOperations({ model, operation, args, query }) {
          // This extension is a placeholder for session-scoped RLS injection
          // In a real serverless env (like Supabase/Neon), we would use a 
          // transaction-level 'SET LOCAL app.campus = ...'
          return query(args);
        },
      },
    },
  });
};

/**
 * INSTITUTIONAL MULTI-TENANT WRAPPER
 * This ensures that every database transaction is scoped to the current user's campus.
 */
export async function withTenantContext<T>(
  prisma: any,
  user: { campus?: string | null; role: string },
  fn: (tx: any) => Promise<T>
): Promise<T> {
  const campus = user.campus || 'PRIMARY';
  const role = user.role;

  return await prisma.$transaction(async (tx: any) => {
    // These session variables are used by the database RLS policies
    await tx.$executeRawUnsafe(`SET LOCAL app.campus = '${campus}'`);
    await tx.$executeRawUnsafe(`SET LOCAL app.role = '${role}'`);
    return await fn(tx);
  });
}
