/**
 * Patch to normalize Primary fees and test protection.
 */
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
    console.log('🚀 Normalizing Primary Fees (₦150k)...');
    
    const session = await prisma.academicSession.findFirst({ where: { status: 'ACTIVE' } });
    const primaryClasses = await prisma.class.findMany({ where: { campus: 'PRIMARY' } });

    for (const cls of primaryClasses) {
        const existing = await prisma.feeConfig.findFirst({
            where: {
                category: 'TUITION',
                campus: 'PRIMARY',
                classId: cls.id,
                termId: null,
                sessionId: session.id
            }
        });

        if (existing) {
            await prisma.feeConfig.update({
                where: { id: existing.id },
                data: { amount: 150000 }
            });
        } else {
            await prisma.feeConfig.create({
                data: {
                    category: 'TUITION',
                    amount: 150000,
                    campus: 'PRIMARY',
                    classId: cls.id,
                    sessionId: session.id
                }
            });
        }
        console.log(`  ✅ ${cls.name}: ₦150,000`);
    }

    console.log('\n✅ Data normalization complete.');
}

run().finally(() => prisma.$disconnect());
