const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('--- DB Investigation ---');
  
  const studentCount = await prisma.user.count({ where: { role: 'STUDENT' } });
  console.log('Total Students (Role=STUDENT):', studentCount);
  
  const activeCount = await prisma.user.count({ where: { role: 'STUDENT', status: 'ACTIVE' } });
  console.log('Active Students (Role=STUDENT, Status=ACTIVE):', activeCount);
  
  const statuses = await prisma.user.groupBy({
    by: ['status'],
    where: { role: 'STUDENT' },
    _count: { _all: true }
  });
  console.log('Student Status Breakdown:', JSON.stringify(statuses));

  const payments = await prisma.payment.count();
  console.log('Total Payments:', payments);
  
  const sessions = await prisma.academicSession.findMany();
  console.log('All Sessions:', JSON.stringify(sessions));

  const session = await prisma.academicSession.findFirst({ where: { status: 'ACTIVE' } }) 
               || await prisma.academicSession.findFirst({ orderBy: { year: 'desc' } });
  console.log('Target Session for Stats:', session?.name || 'NONE', '(ID:', session?.id, ')');

  const pendingRequests = await prisma.request.count({ where: { status: 'PENDING' } });
  console.log('Pending Requests:', pendingRequests);
}

main().finally(() => prisma.$disconnect());
