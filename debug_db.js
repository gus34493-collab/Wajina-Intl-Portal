const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  const sessions = await prisma.academicSession.findMany();
  console.log('SESSIONS:', JSON.stringify(sessions, null, 2));

  const terms = await prisma.term.findMany();
  console.log('TERMS:', JSON.stringify(terms, null, 2));

  const student = await prisma.user.findFirst({ 
    where: { email: 'student.secondary@wajinaschools.com' },
    include: { payments: true }
  });
  console.log('STUDENT PAYMENTS:', JSON.stringify(student?.payments || [], null, 2));
}

check().catch(console.error).finally(() => prisma.$disconnect());
