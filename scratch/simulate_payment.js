const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('--- Simulating New Fee Payment ---');

  // 1. Find a Primary Student
  const student = await prisma.user.findFirst({
    where: { role: 'STUDENT', campus: 'PRIMARY' },
    select: { id: true, name: true, campus: true }
  });

  if (!student) {
    console.error('No Primary Student found. Run setup_test_data.js first.');
    return;
  }

  // 2. Find Latest Session
  const session = await prisma.academicSession.findFirst({
    orderBy: { year: 'desc' }
  });

  if (!session) {
    console.error('No Academic Session found.');
    return;
  }

  // 3. Create APPROVED Payment
  const amount = 75000;
  const reference = 'SIM-' + Math.random().toString(36).substring(2, 10).toUpperCase();
  const payment = await prisma.payment.create({
    data: {
      amount,
      reference,
      category: 'TUITION',
      status: 'APPROVED',
      studentId: student.id,
      sessionId: session.id
    }
  });

  console.log('SUCCESS: Simulated Payment Recorded.');
  console.log('- Student:', student.name);
  console.log('- Amount: ₦' + amount.toLocaleString());
  console.log('- Session:', session.name);
  console.log('- Payment ID:', payment.id);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
