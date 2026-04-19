/**
 * Patch script to ensure Early Years (Creche & EYFC) exist and have fees.
 * Usage: node patch_early_years.js
 */
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function patch() {
    console.log('🚀 Patching Early Years Levels...');

    // 1. Get/Define Classes
    const earlyYearsClasses = [
        { name: 'Creche', campus: 'PRIMARY', category: 'Early Years', displayOrder: -2 },
        { name: 'EYFC 1', campus: 'PRIMARY', category: 'Early Years', displayOrder: -1 },
        { name: 'EYFC 2', campus: 'PRIMARY', category: 'Early Years', displayOrder: 0 },
    ];

    const session = await prisma.academicSession.findFirst({ where: { status: 'ACTIVE' } }) 
                  || await prisma.academicSession.findFirst({ orderBy: { year: 'desc' } });

    if (!session) throw new Error('No active academic session found.');

    for (const def of earlyYearsClasses) {
        let cls = await prisma.class.findFirst({ where: { name: def.name, campus: def.campus } });
        if (!cls) {
            cls = await prisma.class.create({ data: { ...def, active: true } });
            console.log(`  ✅ Created Class: ${cls.name}`);
        }

        // 2. Ensure Tuition Fee Config exists (Placeholders)
        const feeConfig = await prisma.feeConfig.findFirst({
            where: { classId: cls.id, category: 'TUITION', sessionId: session.id }
        });

        if (!feeConfig) {
            await prisma.feeConfig.create({
                data: {
                    classId: cls.id,
                    category: 'TUITION',
                    amount: 150000, // Default 150k
                    sessionId: session.id,
                    campus: 'PRIMARY'
                }
            });
            console.log(`  💰 Set Tuition for ${cls.name}: ₦150,000`);
        }
    }

    console.log('\n✅ Patch Complete.');
}

patch()
    .catch(err => { console.error('❌ Patch failed:', err); process.exit(1); })
    .finally(() => prisma.$disconnect());
