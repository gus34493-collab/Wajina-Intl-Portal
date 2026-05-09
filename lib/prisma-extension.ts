import { PrismaClient, Prisma } from '@prisma/client';

export const xprisma = (prisma: PrismaClient) => {
  return prisma.$extends({
    query: {
      $allModels: {
        async $allOperations({ model, operation, args, query }) {
          return query(args);
        },
      },
    },
  });
};

export async function withTenantContext<T>(
  prisma: any,
  user: { campus?: string | null; role: string },
  fn: (tx: any) => Promise<T>
): Promise<T> {
  const campus = user.campus || 'PRIMARY';
  const role = user.role;

  return await prisma.$transaction(async (tx: any) => {
    // set_config() is parameterized — safe against injection unlike $executeRawUnsafe with interpolation.
    // Third arg `true` = transaction-local (equivalent to SET LOCAL).
    await tx.$executeRaw(Prisma.sql`SELECT set_config('app.campus', ${campus}, true)`);
    await tx.$executeRaw(Prisma.sql`SELECT set_config('app.role', ${role}, true)`);
    return await fn(tx);
  });
}
