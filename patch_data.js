const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('🩹 Patching Database Data...');
  
  // 1. Set the latest session to ACTIVE
  const latestSession = await prisma.academicSession.findFirst({
    orderBy: { year: 'desc' }
  });
  
  if (latestSession) {
    if (latestSession.status !== 'ACTIVE') {
      await prisma.academicSession.update({
        where: { id: latestSession.id },
        data: { status: 'ACTIVE' }
      });
      console.log(`✅ Set session "${latestSession.name}" to ACTIVE.`);
    } else {
      console.log(`ℹ️ Session "${latestSession.name}" is already ACTIVE.`);
    }
  }

  // 2. Ensure all payments have a sessionId (backfill if missing)
  if (latestSession) {
    const updated = await prisma.payment.updateMany({
      where: { sessionId: null },
      data: { sessionId: latestSession.id }
    });
    if (updated.count > 0) {
      console.log(`✅ Backfilled sessionId for ${updated.count} payments.`);
    }
  }

  console.log('✅ Data patch complete.');
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
