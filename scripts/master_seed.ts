import { PrismaClient, Role, SchoolCampus, UserStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('--- Wajina Institutional Master Seed ---');

  // 1. Purge Existing (Optional but recommended for a clean master seed)
  // await prisma.user.deleteMany();
  // await prisma.academicSession.deleteMany();

  // 2. Setup Academic Session
  const session = await prisma.academicSession.upsert({
    where: { year: '2025/2026' },
    update: { status: 'ACTIVE', isDefault: true },
    create: {
      name: '2025/2026 Academic Session',
      year: '2025/2026',
      startDate: new Date('2025-09-01'),
      endDate: new Date('2026-07-31'),
      status: 'ACTIVE',
      isDefault: true,
    }
  });
  console.log('✅ Academic Session: 2025/2026 Active');

  // 3. User Accounts
  const ACCOUNTS = [
    { name: 'Dr. Wajina Admin',   role: Role.DIRECTOR,          email: 'director@wajina.com.ng',            password: 'WajinaAdmin2026!',    campus: SchoolCampus.SECONDARY },
    { name: 'Head Teacher (Pri)', role: Role.HEAD_TEACHER,       email: 'head.teacher@wajina.com.ng',        password: 'HeadTeacher2026!',      campus: SchoolCampus.PRIMARY },
    { name: 'Asst Head Teacher',  role: Role.ASST_HEAD_TEACHER,  email: 'asst.head@wajina.com.ng',           password: 'HeadTeacher2026!',      campus: SchoolCampus.PRIMARY },
    { name: 'Principal (Sec)',    role: Role.PRINCIPAL,          email: 'principal.secondary@wajina.com.ng', password: 'Principal2026!',      campus: SchoolCampus.SECONDARY },
    { name: 'VP Academic',        role: Role.VP_ACADEMICS,      email: 'vp.academic@wajina.com.ng',         password: 'VPAdmin2026!',        campus: SchoolCampus.SECONDARY },
    { name: 'VP Admin',           role: Role.VP_ADMIN,          email: 'vp.admin@wajina.com.ng',            password: 'VPAdmin2026!',        campus: SchoolCampus.SECONDARY },
    { name: 'HOD Science',        role: Role.HOD,               email: 'hod.science@wajina.com.ng',         password: 'HOD2026!',            campus: SchoolCampus.SECONDARY },
    { name: 'HR Manager',         role: Role.HR,                email: 'hr@wajina.com.ng',                  password: 'HRAdmin2026!',        campus: SchoolCampus.SECONDARY },
    { name: 'Dean of Students',   role: Role.DEAN,              email: 'dean@wajina.com.ng',                password: 'Dean2026!',           campus: SchoolCampus.SECONDARY },
    { name: 'Grace Peterson',     role: Role.TEACHER,            email: 'teacher.primary@wajina.com.ng',     password: 'Teacher2026!',        campus: SchoolCampus.PRIMARY },
    { name: 'Ahmed Danjuma',      role: Role.TEACHER,            email: 'teacher.secondary@wajina.com.ng',   password: 'Teacher2026!',        campus: SchoolCampus.SECONDARY },
    { name: 'Form Master Jo',     role: Role.FORM_TEACHER,       email: 'form.master@wajina.com.ng',         password: 'FormMaster2026!',     campus: SchoolCampus.SECONDARY },
    { name: 'Samuel Financial',   role: Role.BURSAR,             email: 'bursar.primary@wajina.com.ng',      password: 'Bursar2026!',         campus: SchoolCampus.PRIMARY },
    { name: 'Sarah Ledger',       role: Role.BURSAR,             email: 'bursar.secondary@wajina.com.ng',    password: 'Bursar2026!',         campus: SchoolCampus.SECONDARY },
    { name: 'Accounts Officer 1', role: Role.ACCOUNTS_OFFICER,   email: 'accounts.primary@wajina.com.ng',    password: 'Accounts2026!',       campus: SchoolCampus.PRIMARY },
    { name: 'Accounts Officer 2', role: Role.ACCOUNTS_OFFICER,   email: 'accounts.secondary@wajina.com.ng',  password: 'Accounts2026!',       campus: SchoolCampus.SECONDARY },
    { name: 'John Parent',        role: Role.PARENT,             email: 'parent.primary@wajina.com.ng',      password: 'Parent2026!',         campus: SchoolCampus.PRIMARY },
    { name: 'Jane Parent',        role: Role.PARENT,             email: 'parent.secondary@wajina.com.ng',    password: 'Parent2026!',         campus: SchoolCampus.SECONDARY },
    { name: 'David Student',      role: Role.STUDENT,            email: 'student.secondary@wajina.com.ng',   password: 'Student2026!',        campus: SchoolCampus.SECONDARY },
  ];

  for (const acc of ACCOUNTS) {
    const hashedPassword = await bcrypt.hash(acc.password, 12);
    
    await prisma.user.upsert({
      where: { email: acc.email },
      update: {
        name: acc.name,
        role: acc.role,
        password: hashedPassword,
        status: UserStatus.ACTIVE,
        campus: acc.campus,
      },
      create: {
        name: acc.name,
        email: acc.email,
        role: acc.role,
        password: hashedPassword,
        status: UserStatus.ACTIVE,
        campus: acc.campus,
      }
    });
    console.log(`✅ Provisioned Account: ${acc.role} - ${acc.email}`);
  }

  console.log('--- Master Seed Complete ---');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
