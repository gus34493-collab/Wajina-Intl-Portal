/**
 * Seed script — creates the initial staff accounts.
 * Run once with: node server/seed.js
 * Re-running is safe — existing accounts are skipped.
 */
import * as dotenv from 'dotenv';
dotenv.config();

import * as bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  datasources: { db: { url: process.env.DIRECT_URL || process.env.DATABASE_URL } },
});

const ACCOUNTS = [
  { email: 'director@wajinaschools.com',           name: 'School Director',            role: 'DIRECTOR',          campus: null,        password: 'WajinaAdmin2026!'    },
  { email: 'head.teacher@wajinaschools.com',  name: 'Primary Head Teacher',   role: 'HEAD_TEACHER',         campus: 'PRIMARY',   password: 'HeadTeacher2026!'      },
  { email: 'principal.secondary@wajinaschools.com',name: 'Secondary School Principal', role: 'PRINCIPAL',         campus: 'SECONDARY', password: 'Principal2026!'      },
  { email: 'teacher.primary@wajinaschools.com',    name: 'Demo Primary Teacher',       role: 'TEACHER',           campus: 'PRIMARY',   password: 'Teacher2026!'        },
  { email: 'teacher.secondary@wajinaschools.com',  name: 'Demo Secondary Teacher',     role: 'TEACHER',           campus: 'SECONDARY', password: 'Teacher2026!'        },
  { email: 'bursar.primary@wajinaschools.com',     name: 'Primary Campus Bursar',      role: 'BURSAR',            campus: 'PRIMARY',   password: 'Bursar2026!'         },
  { email: 'bursar.secondary@wajinaschools.com',   name: 'Secondary Campus Bursar',    role: 'BURSAR',            campus: 'SECONDARY', password: 'Bursar2026!'         },
  { email: 'hr.primary@wajinaschools.com',         name: 'Primary HR Officer',         role: 'HR',                campus: 'PRIMARY',   password: 'HR2026!'             },
  { email: 'hr.secondary@wajinaschools.com',       name: 'Secondary HR Officer',       role: 'HR',                campus: 'SECONDARY', password: 'HR2026!'             },
  { email: 'accounts.primary@wajinaschools.com',   name: 'Primary Accounts Officer',   role: 'ACCOUNTS_OFFICER',  campus: 'PRIMARY',   password: 'Accounts2026!'       },
  { email: 'accounts.secondary@wajinaschools.com', name: 'Secondary Accounts Officer', role: 'ACCOUNTS_OFFICER',  campus: 'SECONDARY', password: 'Accounts2026!'       },
  { email: 'parent.primary@wajinaschools.com',     name: 'Demo Primary Parent',        role: 'PARENT',            campus: 'PRIMARY',   password: 'Parent2026!'         },
  { email: 'parent.secondary@wajinaschools.com',   name: 'Demo Secondary Parent',      role: 'PARENT',            campus: 'SECONDARY', password: 'Parent2026!'         },
  { email: 'student.secondary@wajinaschools.com',  name: 'Demo Secondary Student',     role: 'STUDENT',           campus: 'SECONDARY', password: 'Student2026!'        },
  { email: 'final.year@wajinaschools.com',         name: 'Musa Wajina (Final Year)',   role: 'STUDENT',           campus: 'SECONDARY', password: 'Student2026!'        },
];

async function main() {
  console.log('Starting seed…\n');

  for (const account of ACCOUNTS) {
    const existing = await prisma.user.findUnique({ where: { email: account.email } });
    if (existing) {
      console.log(`  SKIP  ${account.email} (already exists)`);
      continue;
    }

    const hashed = await bcrypt.hash(account.password, 12);
    await prisma.user.create({
      data: {
        email:    account.email,
        name:     account.name,
        role:     account.role as any,
        campus:   account.campus as any,
        password: hashed,
        status:   'ACTIVE',
      },
    });
    console.log(`  ✅ ${account.role.padEnd(18)} ${account.email}  /  ${account.password}`);
  }

  console.log('\nSeed complete. Change default passwords before going live.');
}

main()
  .catch((err) => { console.error('Seed failed:', err); process.exit(1); })
  .finally(() => prisma.$disconnect());
