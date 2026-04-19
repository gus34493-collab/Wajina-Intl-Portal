const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('--- Diagnosing Smart Headcount ---');

  // 1. Current Session
  let activeSession = await prisma.academicSession.findFirst({ where: { status: 'ACTIVE' } });
  if (!activeSession) {
    activeSession = await prisma.academicSession.findFirst({ orderBy: { year: 'desc' } });
    console.log('No ACTIVE session found. Falling back to latest:', activeSession.name, '(ID:', activeSession.id + ')');
  } else {
    console.log('Active Session:', activeSession.name, '(ID:', activeSession.id + ')');
  }

  // 2. Simulated student
  const student = await prisma.user.findFirst({
    where: { email: 'student.primary@wajinaschools.com' },
    include: {
        payments: true
    }
  });

  if (!student) {
    console.log('Demo student not found.');
  } else {
    console.log('Student:', student.name);
    console.log('- Created At:', student.createdAt);
    console.log('- Campus:', student.campus);
    console.log('- Total Payments:', student.payments.length);
    
    student.payments.forEach(p => {
        console.log(`  - Payment: ${p.amount} | Status: ${p.status} | Session: ${p.sessionId}`);
    });
  }

  // 3. Count matching query
  const campus = 'PRIMARY';
  const thresholdDate = new Date();
  thresholdDate.setDate(thresholdDate.getDate() - 21);
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const students = await prisma.user.findMany({
    where: {
      role: 'STUDENT',
      campus: campus,
    },
    include: {
      payments: {
        where: { sessionId: activeSession.id, status: 'APPROVED', category: 'TUITION' },
      },
      attendance: {
        where: { date: { gte: thresholdDate }, status: 'PRESENT' },
      }
    }
  });

  const activeCount = students.filter(s => {
    const isNew = s.createdAt >= thirtyDaysAgo;
    const hasPaid = s.payments.length > 0;
    const isPresent = s.attendance.length > 0;
    
    if (s.email === 'student.primary@wajinaschools.com') {
        console.log('--- Evaluation for Demo Student ---');
        console.log('  isNew:', isNew, '(CreatedAt:', s.createdAt, 'vs Threshold:', thirtyDaysAgo + ')');
        console.log('  hasPaid:', hasPaid, '(Payments in session:', s.payments.length + ')');
        console.log('  isPresent:', isPresent, '(Attendance count:', s.attendance.length + ')');
    }
    
    return isNew || hasPaid || isPresent;
  }).length;

  console.log('--- Final Result ---');
  console.log('Total Primary students found:', students.length);
  console.log('Active Count:', activeCount);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
