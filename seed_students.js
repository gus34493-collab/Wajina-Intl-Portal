/**
 * Seed 100+ students across all class levels with proper Nigerian names.
 * Also ensures all required classes (Primary 1-6, JSS 1-3, SSS 1-3),
 * subjects, and class arms exist.
 *
 * Safe to re-run — skips students whose emails already exist.
 * Run: node seed_students.js
 */
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

// ── Nigerian student names ──────────────────────────────────────────────────
const FIRST_NAMES = [
  'Amina', 'Chidi', 'Fatima', 'Obinna', 'Aisha', 'Emeka', 'Zainab', 'Tunde',
  'Halima', 'Ikenna', 'Khadija', 'Adeola', 'Maryam', 'Chukwuma', 'Hauwa',
  'Oluwaseun', 'Hafsat', 'Nnamdi', 'Bilkisu', 'Adebayo', 'Rahma', 'Chidera',
  'Safiya', 'Olumide', 'Rukayat', 'Ifeanyi', 'Hadiza', 'Ayomide', 'Jummai',
  'Chinedu', 'Asmau', 'Babajide', 'Suwaiba', 'Damilare', 'Farida', 'Ebuka',
  'Jamila', 'Femi', 'Barira', 'Gbenga', 'Laraba', 'Ike', 'Hassana', 'Jide',
  'Kaltume', 'Kunle', 'Ladidi', 'Musa', 'Nkechi', 'Onyeka', 'Patience',
  'Qasim', 'Rashida', 'Sola', 'Tochukwu', 'Uche', 'Victoria', 'Wale',
  'Xaviera', 'Yusuf', 'Zara', 'Adamu', 'Blessing', 'Chiamaka', 'Daniel',
  'Esther', 'Felix', 'Grace', 'Hassan', 'Ifeoma', 'Joseph', 'Kehinde',
  'Lateef', 'Mariam', 'Nneka', 'Ola', 'Peter', 'Quadri', 'Ruth', 'Samuel',
  'Taiwo', 'Udo', 'Vivian', 'Wasiu', 'Yetunde', 'Zubairu', 'Abdullahi',
  'Binta', 'Clement', 'Doris', 'Emmanuel', 'Folake', 'George', 'Happiness',
  'Ibrahim', 'Janet', 'Kenneth', 'Lami', 'Mohammed', 'Ngozi', 'Oscar',
  'Precious', 'Rilwan', 'Stella', 'Tosin', 'Umma'
];

const LAST_NAMES = [
  'Abubakar', 'Okonkwo', 'Ibrahim', 'Eze', 'Mohammed', 'Adeyemi', 'Bello',
  'Okafor', 'Danjuma', 'Nwosu', 'Suleiman', 'Adeleke', 'Garba', 'Igwe',
  'Abdullahi', 'Onyebuchi', 'Aliyu', 'Nwachukwu', 'Usman', 'Okoro',
  'Yusuf', 'Chukwu', 'Musa', 'Obi', 'Bashir', 'Agu', 'Shehu', 'Nnadi',
  'Ahmad', 'Ikechukwu', 'Lawal', 'Ekwueme', 'Haruna', 'Uzoma',
];

// ── Class definitions ───────────────────────────────────────────────────────
const CLASS_DEFS = [
  // Early Years
  { name: 'Creche', campus: 'PRIMARY', category: 'Early Years', order: -2 },
  { name: 'EYFC 1', campus: 'PRIMARY', category: 'Early Years', order: -1 },
  { name: 'EYFC 2', campus: 'PRIMARY', category: 'Early Years', order: 0 },
  // Primary
  { name: 'Primary 1', campus: 'PRIMARY', category: 'Primary', order: 1 },
  { name: 'Primary 2', campus: 'PRIMARY', category: 'Primary', order: 2 },
  { name: 'Primary 3', campus: 'PRIMARY', category: 'Primary', order: 3 },
  { name: 'Primary 4', campus: 'PRIMARY', category: 'Primary', order: 4 },
  { name: 'Primary 5', campus: 'PRIMARY', category: 'Primary', order: 5 },
  { name: 'Primary 6', campus: 'PRIMARY', category: 'Primary', order: 6 },
  // Junior Secondary
  { name: 'JSS 1', campus: 'SECONDARY', category: 'Junior', order: 10 },
  { name: 'JSS 2', campus: 'SECONDARY', category: 'Junior', order: 11 },
  { name: 'JSS 3', campus: 'SECONDARY', category: 'Junior', order: 12 },
  // Senior Secondary
  { name: 'SSS 1', campus: 'SECONDARY', category: 'Senior', order: 20 },
  { name: 'SSS 2', campus: 'SECONDARY', category: 'Senior', order: 21 },
  { name: 'SSS 3', campus: 'SECONDARY', category: 'Senior', order: 22 },
];

// ── Subjects per category ───────────────────────────────────────────────────
const SUBJECTS_BY_CATEGORY = {
  Primary: ['Mathematics', 'English Language', 'Basic Science', 'Social Studies', 'Civic Education'],
  Junior:  ['Mathematics', 'English Language', 'Basic Science', 'Basic Technology', 'Social Studies', 'Civic Education', 'French'],
  Senior:  ['Mathematics', 'English Language', 'Physics', 'Chemistry', 'Biology', 'Economics', 'Government', 'Literature'],
};

async function main() {
  console.log('🚀 Starting full student seed...\n');

  // ── 1. Ensure session & term ──────────────────────────────────────────
  let session = await prisma.academicSession.findFirst({ where: { status: 'ACTIVE' } });
  if (!session) {
    session = await prisma.academicSession.findFirst({ orderBy: { year: 'desc' } });
  }
  if (!session) {
    session = await prisma.academicSession.create({
      data: { name: '2025/2026 Academic Session', year: '2025', status: 'ACTIVE', isDefault: true, startDate: new Date('2025-09-01'), endDate: new Date('2026-07-31') }
    });
    console.log('  Created session:', session.name);
  }

  let term = await prisma.term.findFirst({ where: { sessionId: session.id } });
  if (!term) {
    term = await prisma.term.create({
      data: { sessionId: session.id, name: 'FIRST', isCurrent: true, status: 'CURRENT', startDate: new Date('2025-09-01'), endDate: new Date('2025-12-20') }
    });
    console.log('  Created term:', term.name);
  }

  // ── 2. Get or verify a teacher exists ─────────────────────────────────
  const teachers = await prisma.user.findMany({ where: { role: 'TEACHER' }, select: { id: true, campus: true } });
  if (teachers.length === 0) throw new Error('No teachers in DB. Run seed.ts first.');
  const primaryTeacher = teachers.find(t => t.campus === 'PRIMARY') || teachers[0];
  const secondaryTeacher = teachers.find(t => t.campus === 'SECONDARY') || teachers[0];
  console.log(`  Teachers: ${teachers.length} found\n`);

  // ── 3. Create all classes ─────────────────────────────────────────────
  const classMap = {}; // name -> class record
  for (const def of CLASS_DEFS) {
    let cls = await prisma.class.findFirst({ where: { name: def.name, campus: def.campus } });
    if (!cls) {
      cls = await prisma.class.create({
        data: { name: def.name, campus: def.campus, category: def.category, displayOrder: def.order, active: true }
      });
      console.log(`  ✅ Created class: ${def.name} (${def.campus})`);
    } else {
      console.log(`  ─  Class exists: ${def.name}`);
    }
    classMap[def.name] = cls;
  }

  // ── 4. Create subjects for each class ─────────────────────────────────
  console.log('');
  let subjectsCreated = 0;
  for (const def of CLASS_DEFS) {
    const cls = classMap[def.name];
    const subjectNames = SUBJECTS_BY_CATEGORY[def.category] || [];
    const teacherId = def.campus === 'PRIMARY' ? primaryTeacher.id : secondaryTeacher.id;

    for (const subName of subjectNames) {
      const exists = await prisma.subject.findFirst({ where: { name: subName, classId: cls.id } });
      if (!exists) {
        await prisma.subject.create({ data: { name: subName, classId: cls.id, teacherId } });
        subjectsCreated++;
      }
    }
  }
  console.log(`  📚 Subjects: ${subjectsCreated} created (existing skipped)\n`);

  // ── 5. Create 120 students distributed across classes ─────────────────
  const hashed = await bcrypt.hash('Student2026!', 12);
  const classNames = CLASS_DEFS.map(d => d.name);
  let created = 0, skipped = 0;

  for (let i = 0; i < 120; i++) {
    const firstName = FIRST_NAMES[i % FIRST_NAMES.length];
    const lastName = LAST_NAMES[i % LAST_NAMES.length];
    const fullName = `${firstName} ${lastName}`;
    const email = `student.${firstName.toLowerCase()}.${lastName.toLowerCase()}.${i}@wajinaschools.com`;
    const className = classNames[i % classNames.length];
    const cls = classMap[className];

    const exists = await prisma.user.findUnique({ where: { email } });
    if (exists) { skipped++; continue; }

    await prisma.user.create({
      data: {
        email,
        name: fullName,
        role: 'STUDENT',
        campus: cls.campus,
        classId: cls.id,
        password: hashed,
        status: 'ACTIVE',
      }
    });
    created++;
  }

  console.log(`  👨‍🎓 Students: ${created} created, ${skipped} already existed`);

  // ── Summary ───────────────────────────────────────────────────────────
  const totalStudents = await prisma.user.count({ where: { role: 'STUDENT' } });
  const totalClasses = await prisma.class.count({ where: { active: true } });
  const totalSubjects = await prisma.subject.count();

  console.log(`\n── SUMMARY ──────────────────────`);
  console.log(`  Total Students : ${totalStudents}`);
  console.log(`  Total Classes  : ${totalClasses}`);
  console.log(`  Total Subjects : ${totalSubjects}`);
  console.log(`  Session        : ${session.name} (${session.id})`);
  console.log(`  Term           : ${term.name} (${term.id})`);
  console.log(`\n✅ Seed complete.`);
}

main()
  .catch(err => { console.error('❌ Seed failed:', err); process.exit(1); })
  .finally(() => prisma.$disconnect());
