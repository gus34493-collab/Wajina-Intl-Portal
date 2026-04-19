
const PORT = 3001;
const BASE_URL = `http://localhost:${PORT}/api/auth`;

const ACCOUNTS = [
  { role: 'DIRECTOR',           email: 'director@wajinaschools.com',            password: 'WajinaAdmin2026!'    },
  { role: 'HEAD_TEACHER',       email: 'head.teacher@wajinaschools.com',        password: 'HeadTeacher2026!'      },
  { role: 'PRINCIPAL',          email: 'principal.secondary@wajinaschools.com', password: 'Principal2026!'      },
  { role: 'TEACHER (Pri)',      email: 'teacher.primary@wajinaschools.com',     password: 'Teacher2026!'        },
  { role: 'TEACHER (Sec)',      email: 'teacher.secondary@wajinaschools.com',   password: 'Teacher2026!'        },
  { role: 'BURSAR (Pri)',       email: 'bursar.primary@wajinaschools.com',      password: 'Bursar2026!'         },
  { role: 'BURSAR (Sec)',       email: 'bursar.secondary@wajinaschools.com',    password: 'Bursar2026!'         },
  { role: 'ACCOUNTS (Pri)',     email: 'accounts.primary@wajinaschools.com',    password: 'Accounts2026!'       },
  { role: 'ACCOUNTS (Sec)',     email: 'accounts.secondary@wajinaschools.com',  password: 'Accounts2026!'       },
  { role: 'PARENT (Pri)',       email: 'parent.primary@wajinaschools.com',      password: 'Parent2026!'         },
  { role: 'PARENT (Sec)',       email: 'parent.secondary@wajinaschools.com',    password: 'Parent2026!'         },
  { role: 'STUDENT (Sec)',      email: 'student.secondary@wajinaschools.com',   password: 'Student2026!'        },
];

async function verifyAuth() {
  console.log('--- Wajina Authentication Verification Suite ---\n');
  console.log(`${'ROLE'.padEnd(20)} | ${'EMAIL'.padEnd(40)} | ${'STATUS'}`);
  console.log('-'.repeat(80));

  for (const account of ACCOUNTS) {
    try {
      const response = await fetch(`${BASE_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: account.email,
          password: account.password
        })
      });

      const data = await response.json();

      if (response.ok && data.role) {
        console.log(`${account.role.padEnd(20)} | ${account.email.padEnd(40)} | ✅ SUCCESS`);
      } else {
        console.log(`${account.role.padEnd(20)} | ${account.email.padEnd(40)} | ❌ FAILED (${data.error || response.statusText})`);
      }
    } catch (error) {
      console.log(`${account.role.padEnd(20)} | ${account.email.padEnd(40)} | ❌ FAILED (${error.message})`);
    }
  }
}

verifyAuth();
