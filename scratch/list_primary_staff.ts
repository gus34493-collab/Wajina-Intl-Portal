import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function listPrimaryStaff() {
  try {
    const staff = await prisma.user.findMany({
      where: {
        status: 'ACTIVE',
        campus: 'PRIMARY',
        NOT: {
          role: {
            in: ['PARENT', 'STUDENT']
          }
        }
      },
      select: {
        name: true,
        email: true,
        role: true,
        status: true
      },
      orderBy: {
        role: 'asc'
      }
    });

    console.log(JSON.stringify(staff, null, 2));

  } catch (error) {
    console.error('Error listing primary staff:', error);
  } finally {
    await prisma.$disconnect();
  }
}

listPrimaryStaff();
