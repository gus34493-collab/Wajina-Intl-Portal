
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function unlockDirector() {
  console.log('Unlocking director@wajinaschools.com...');
  try {
    const user = await prisma.user.update({
      where: { email: 'director@wajinaschools.com' },
      data: {
        failedLoginAttempts: 0,
        lockedUntil: null,
        status: 'ACTIVE'
      }
    });
    console.log('Successfully unlocked Director account:', user.email);
  } catch (err) {
    console.error('Failed to unlock Director account:', err);
  } finally {
    await prisma.$disconnect();
  }
}

unlockDirector();
