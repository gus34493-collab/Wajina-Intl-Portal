const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const count = await prisma.user.count({
    where: { role: { in: ['TEACHER', 'FORM_TEACHER', 'HEAD_TEACHER', 'PRINCIPAL', 'HOD', 'DEAN'] } }
  });
  const users = await prisma.user.findMany({ select: { name: true, role: true } });
  console.log('Count:', count);
  console.log('All Users:', users);
}

main().catch(console.error).finally(() => prisma.$disconnect());
