const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const roleQuery = { in: "TEACHER,FORM_TEACHER,HEAD_TEACHER,PRINCIPAL,HOD,DEAN".split(',').map(r => r.trim()) };
  const where = { role: roleQuery };
  console.log('where:', where);
  const users = await prisma.user.findMany({ where, select: { name: true, role: true, campus: true } });
  console.log('Fetched users length:', users.length);
  console.log(users);
}

main().catch(console.error).finally(() => prisma.$disconnect());
