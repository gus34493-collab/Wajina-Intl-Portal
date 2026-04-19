
const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const ACCOUNTS = [
  { email: 'director@wajinaschools.com',           password: 'WajinaAdmin2026!'    },
  { email: 'head.teacher@wajinaschools.com',       password: 'HeadTeacher2026!'      },
  { email: 'principal.secondary@wajinaschools.com', password: 'Principal2026!'      },
  { email: 'teacher.primary@wajinaschools.com',    password: 'Teacher2026!'        },
  { email: 'teacher.secondary@wajinaschools.com',  password: 'Teacher2026!'        },
  { email: 'bursar.primary@wajinaschools.com',     password: 'Bursar2026!'         },
  { email: 'bursar.secondary@wajinaschools.com',   password: 'Bursar2026!'         },
  { email: 'accounts.primary@wajinaschools.com',   password: 'Accounts2026!'       },
  { email: 'accounts.secondary@wajinaschools.com', password: 'Accounts2026!'       },
  { email: 'parent.primary@wajinaschools.com',     password: 'Parent2026!'         },
  { email: 'parent.secondary@wajinaschools.com',   password: 'Parent2026!'         },
  { email: 'student.secondary@wajinaschools.com',  password: 'Student2026!'        },
];

async function sync() {
  console.log('Synchronizing Seed Passwords (Node JS)...');
  for (const account of ACCOUNTS) {
    try {
        const hashed = await bcrypt.hash(account.password, 12);
        await prisma.user.update({
          where: { email: account.email },
          data: { password: hashed, failedLoginAttempts: 0, lockedUntil: null }
        });
        console.log(`  ✅ Synced ${account.email}`);
    } catch (e) {
        console.log(`  ❌ Failed ${account.email}: ${e.message}`);
    }
  }
}

sync().catch(console.error).finally(() => prisma.$disconnect());
