
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const email = 'director@wajinaschools.com';
  console.log(`Unlocking ${email}...`);
  await prisma.user.update({
    where: { email },
    data: { failedLoginAttempts: 0, lockedUntil: null }
  });
  console.log('✅ Account unlocked.');
}

main().catch(console.error).finally(() => prisma.$disconnect());
