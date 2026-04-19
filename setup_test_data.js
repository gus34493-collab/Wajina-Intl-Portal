const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const bcrypt = require('bcryptjs');

async function setup() {
  console.log('--- Setting up Test Data ---');

  // 1. Ensure Session & Term exist
  let session = await prisma.academicSession.findFirst({ where: { isDefault: true } });
  if (!session) {
    session = await prisma.academicSession.create({
      data: { name: '2025/26 Test Session', year: '2025', isDefault: true, startDate: new Date(), endDate: new Date() }
    });
  }

  let term = await prisma.term.findFirst({ where: { isCurrent: true, sessionId: session.id } });
  if (!term) {
    term = await prisma.term.create({
      data: { sessionId: session.id, name: 'FIRST', isCurrent: true, startDate: new Date(), endDate: new Date() }
    });
  }

  // 2. Ensure Primary Class & Subject
  let pClass = await prisma.class.findFirst({ where: { campus: 'PRIMARY' } });
  if (!pClass) {
    pClass = await prisma.class.create({
      data: { name: 'Primary 1', campus: 'PRIMARY', category: 'PRIMARY', displayOrder: 1 }
    });
  }

  const teacher = await prisma.user.findFirst({ where: { role: 'TEACHER' } });
  if (!teacher) throw new Error('No teacher found in DB. Please run seed.ts');

  let pSubject = await prisma.subject.findFirst({ where: { classId: pClass.id } });
  if (!pSubject) {
    pSubject = await prisma.subject.create({
      data: { name: 'Mathematics (Pri)', classId: pClass.id, teacherId: teacher.id }
    });
  }

  // 3. Ensure Secondary Cohorts (Junior & Senior)
  // Junior
  let jClass = await prisma.class.findFirst({ where: { name: 'JSS 1' } });
  if (!jClass) {
    jClass = await prisma.class.create({
      data: { name: 'JSS 1', campus: 'SECONDARY', category: 'Junior', displayOrder: 10 }
    });
  }

  let jSubject = await prisma.subject.findFirst({ where: { classId: jClass.id } });
  if (!jSubject) {
    jSubject = await prisma.subject.create({
      data: { name: 'Mathematics (Junior)', classId: jClass.id, teacherId: teacher.id }
    });
  }

  // Senior
  let sClass = await prisma.class.findFirst({ where: { name: 'SSS 1' } });
  if (!sClass) {
    sClass = await prisma.class.create({
      data: { name: 'SSS 1', campus: 'SECONDARY', category: 'Senior', displayOrder: 20 }
    });
  }

  let sSubject = await prisma.subject.findFirst({ where: { classId: sClass.id } });
  if (!sSubject) {
    sSubject = await prisma.subject.create({
      data: { name: 'Physics (Senior)', classId: sClass.id, teacherId: teacher.id }
    });
  }

  // 4. Ensure Students
  // Primary Student
  let pStudent = await prisma.user.findFirst({ where: { role: 'STUDENT', campus: 'PRIMARY' } });
  if (!pStudent) {
    const hashed = await bcrypt.hash('Student2026!', 12);
    pStudent = await prisma.user.create({
      data: {
        email: 'student.primary@wajinaschools.com',
        name: 'Demo Primary Student',
        role: 'STUDENT',
        campus: 'PRIMARY',
        password: hashed,
        status: 'ACTIVE',
        classId: pClass.id
      }
    });
  }

  // Junior Student
  let jStudent = await prisma.user.findFirst({ where: { email: 'student.junior@wajinaschools.com' } });
  if (!jStudent) {
    const hashed = await bcrypt.hash('Student2026!', 12);
    jStudent = await prisma.user.create({
      data: {
        email: 'student.junior@wajinaschools.com',
        name: 'Demo Junior Student',
        role: 'STUDENT',
        campus: 'SECONDARY',
        password: hashed,
        status: 'ACTIVE',
        classId: jClass.id
      }
    });
  }

  // Senior Student
  let srStudent = await prisma.user.findFirst({ where: { email: 'student.senior@wajinaschools.com' } });
  if (!srStudent) {
    const hashed = await bcrypt.hash('Student2026!', 12);
    srStudent = await prisma.user.create({
      data: {
        email: 'student.senior@wajinaschools.com',
        name: 'Demo Senior Student',
        role: 'STUDENT',
        campus: 'SECONDARY',
        password: hashed,
        status: 'ACTIVE',
        classId: sClass.id
      }
    });
  }

  console.log('--- Setup Complete ---');
  console.log('Session ID:', session.id);
  console.log('Term ID:', term.id);
  console.log('Primary Student:', pStudent.email);
  console.log('Junior Student:', jStudent.email);
  console.log('Senior Student:', srStudent.email);
}

setup().catch(console.error).finally(() => prisma.$disconnect());
