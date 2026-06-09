const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  // Find students with grades
  const students = await prisma.user.findMany({
    where: { role: 'STUDENT' },
    select: { 
      id: true, name: true, campus: true,
      enrolledClass: { select: { name: true, category: true } },
      enrolledArm: { select: { fullName: true } },
    }
  });
  console.log('Students:', JSON.stringify(students, null, 2));

  // Find parent
  const parent = await prisma.user.findFirst({
    where: { role: 'PARENT' },
    select: { id: true, name: true, email: true }
  });
  console.log('Parent:', parent);

  // Check if there are any grades
  const gradeCount = await prisma.grade.count();
  console.log('Total grades:', gradeCount);

  if (students.length > 0) {
    const studentGrades = await prisma.grade.findMany({
      where: { studentId: students[0].id },
      select: { id: true, total: true, grade: true, status: true, subject: { select: { name: true } } },
      take: 5,
    });
    console.log('Sample grades for', students[0].name, ':', JSON.stringify(studentGrades, null, 2));
  }

  // Check parent-student links
  const links = await prisma.studentParent.findMany({
    select: { parentId: true, studentId: true, student: { select: { name: true } }, parent: { select: { name: true } } }
  });
  console.log('Parent-Student links:', JSON.stringify(links, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
