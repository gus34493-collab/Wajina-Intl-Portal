const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('🚀 Optimizing Database Performance...');
  
  try {
    const indexes = [
      'CREATE INDEX IF NOT EXISTS idx_payment_session_status ON "Payment"("sessionId", "status", "category")',
      'CREATE INDEX IF NOT EXISTS idx_audit_created ON "AuditLog"("createdAt")',
      'CREATE INDEX IF NOT EXISTS idx_request_status_level ON "Request"("status", "level")'
    ];

    for (const sql of indexes) {
      console.log(`  - Executing: ${sql.split(' ').slice(0, 4).join(' ')}...`);
      await prisma.$executeRawUnsafe(sql);
    }

    console.log('\n✅ Database optimized successfully.');
  } catch (err) {
    console.error('\n❌ Optimization failed:', err.message);
  }
}

main()
  .catch(err => console.error(err))
  .finally(() => prisma.$disconnect());
