const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        salary: false
      }
    });
    console.log(users.length);
  } catch (e) {
    console.error('Prisma Error:', e.message);
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
