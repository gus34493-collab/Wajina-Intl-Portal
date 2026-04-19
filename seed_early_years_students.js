/**
 * Seed demo students for Early Years (Creche & EYFC).
 */
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const bcrypt = require('bcryptjs');

async function seed() {
    console.log('👨‍🎓 Seeding Early Years Students...');
    const hashed = await bcrypt.hash('Student2026!', 12);
    
    const eyClasses = await prisma.class.findMany({
        where: { name: { in: ['Creche', 'EYFC 1', 'EYFC 2'] } }
    });

    for (const cls of eyClasses) {
        for (let i = 1; i <= 3; i++) {
            const name = `${cls.name} Student ${i}`;
            const email = `ey.${cls.name.replace(' ','').toLowerCase()}.${i}@wajinaschools.com`;
            
            const exists = await prisma.user.findUnique({ where: { email } });
            if (!exists) {
                await prisma.user.create({
                    data: {
                        email,
                        name,
                        role: 'STUDENT',
                        password: hashed,
                        campus: 'PRIMARY',
                        classId: cls.id,
                        status: 'ACTIVE'
                    }
                });
            }
        }
        console.log(`  ✅ Added 3 students to ${cls.name}`);
    }
    console.log('\n✅ Seeding complete.');
}

seed().finally(() => prisma.$disconnect());
