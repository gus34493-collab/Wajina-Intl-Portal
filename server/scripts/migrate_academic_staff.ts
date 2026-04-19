import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('--- Phase 1: Data Migration ---');
  
  // 1. Find all users with ACADEMIC_STAFF role (if they still exist in the DB)
  // Since we haven't synced the schema yet, the DB still has ACADEMIC_STAFF
  // But wait, if I run this after db push, it might fail if the DB rejects the unknown role.
  // So I should run this BEFORE db push using a raw query to be safe.
  
  try {
    // 1. Update Users
    const userResult = await prisma.$executeRaw`
      UPDATE "User" 
      SET role = 'FORM_TEACHER'::"Role" 
      WHERE role = 'ACADEMIC_STAFF'::"Role"
    `;
    console.log(`Updated ${userResult} users from ACADEMIC_STAFF to FORM_TEACHER.`);

    // 2. Update Complaints
    const complaintResult = await prisma.$executeRaw`
      UPDATE "Complaint" 
      SET "targetRole" = 'FORM_TEACHER'::"ComplaintTargetRole" 
      WHERE "targetRole" = 'ACADEMIC_STAFF'::"ComplaintTargetRole"
    `;
    console.log(`Updated ${complaintResult} complaints from ACADEMIC_STAFF to FORM_TEACHER.`);

  } catch (err) {
    console.error('Migration failed:', err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
