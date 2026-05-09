
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function check() {
  const users = await prisma.user.findMany({
    select: { email: true, status: true, role: true }
  });
  console.log('Total Users:', users.length);
  console.log(JSON.stringify(users, null, 2));
}

check().catch(console.error).finally(() => prisma.$disconnect());
