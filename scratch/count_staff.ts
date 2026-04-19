import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function countActiveStaff() {
  try {
    const staffCount = await prisma.user.count({
      where: {
        status: 'ACTIVE',
        NOT: {
          role: {
            in: ['PARENT', 'STUDENT']
          }
        }
      }
    });

    const teacherCount = await prisma.user.count({
      where: {
        status: 'ACTIVE',
        role: 'TEACHER'
      }
    });

    const campusCounts = await prisma.user.groupBy({
      by: ['campus', 'role'],
      where: {
        status: 'ACTIVE',
        NOT: {
          role: {
            in: ['PARENT', 'STUDENT']
          }
        }
      },
      _count: {
        id: true
      }
    });

    console.log('Total Active Staff:', staffCount);
    console.log('Total Active Teachers:', teacherCount);
    console.log('Campus Breakdown:', JSON.stringify(campusCounts, null, 2));

  } catch (error) {
    console.error('Error counting staff:', error);
  } finally {
    await prisma.$disconnect();
  }
}

countActiveStaff();
