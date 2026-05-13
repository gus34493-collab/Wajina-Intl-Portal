import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const PASSWORD = "Wajina2026!";

const SEED_USERS = [
  { name: "Dr. Adeyemi Okonkwo",   email: "director@wajinainternational.com.ng",     role: "DIRECTOR",         campus: "PRIMARY"   },
  { name: "Mrs. Funmi Adebisi",    email: "principal@wajinainternational.com.ng",    role: "PRINCIPAL",        campus: "SECONDARY" },
  { name: "Mr. Chidi Eze",         email: "headteacher@wajinainternational.com.ng",  role: "HEAD_TEACHER",     campus: "PRIMARY"   },
  { name: "Mrs. Amaka Nwosu",      email: "asst.head@wajinainternational.com.ng",    role: "ASST_HEAD_TEACHER",campus: "PRIMARY"   },
  { name: "Mr. Emeka Obi",         email: "vpadmin@wajinainternational.com.ng",      role: "VP_ADMIN",         campus: "SECONDARY" },
  { name: "Dr. Ngozi Adaeze",      email: "vpacademics@wajinainternational.com.ng",  role: "VP_ACADEMICS",     campus: "SECONDARY" },
  { name: "Mr. Bola Adewale",      email: "hod@wajinainternational.com.ng",          role: "HOD",              campus: "SECONDARY" },
  { name: "Mrs. Titi Afolabi",     email: "hr@wajinainternational.com.ng",           role: "HR",               campus: "PRIMARY"   },
  { name: "Mr. Femi Bankole",      email: "dean@wajinainternational.com.ng",         role: "DEAN",             campus: "SECONDARY" },
  { name: "Mr. Seun Adeyemi",      email: "bursar@wajinainternational.com.ng",       role: "BURSAR",           campus: "PRIMARY"   },
  { name: "Mrs. Ngozi Okonjo",     email: "bursar.sec@wajinainternational.com.ng",   role: "BURSAR",           campus: "SECONDARY" },
  { name: "Mrs. Chibuzor Nkem",    email: "accounts@wajinainternational.com.ng",     role: "ACCOUNTS_OFFICER", campus: "PRIMARY"   },
  { name: "Mr. Tunde Ogundimu",    email: "formteacher@wajinainternational.com.ng",  role: "FORM_TEACHER",     campus: "SECONDARY", isFormMaster: true },
  { name: "Mrs. Yetunde Lawal",    email: "teacher@wajinainternational.com.ng",      role: "TEACHER",          campus: "PRIMARY"   },
  { name: "Mr. Kunle Adeniyi",     email: "parent@wajinainternational.com.ng",       role: "PARENT",           campus: "PRIMARY"   },
  { name: "Chisom Adeniyi",        email: "student@wajinainternational.com.ng",      role: "STUDENT",          campus: "PRIMARY"   },
] as const;

async function main() {
  console.log("🌱 Seeding Wajina Portal users...\n");
  const hash = await bcrypt.hash(PASSWORD, 12);

  for (const u of SEED_USERS) {
    await prisma.user.upsert({
      where: { email: u.email },
      update: { status: "ACTIVE" },
      create: {
        name: u.name,
        email: u.email,
        password: hash,
        role: u.role as any,
        campus: u.campus as any,
        status: "ACTIVE",
        isFormMaster: ("isFormMaster" in u && u.isFormMaster) ?? false,
      },
    });
    console.log(`  ✓  ${u.role.padEnd(22)} ${u.email}`);
  }

  console.log(`
╔═══════════════════════════════════════════════════════════╗
║              WAJINA PORTAL — SEED CREDENTIALS             ║
╠═══════════════════════════════════════════════════════════╣
║  Password (all accounts):  Wajina2026!                    ║
╠══════════════════════════╦════════════════════════════════╣
║  ROLE                    ║  EMAIL                         ║
╠══════════════════════════╬════════════════════════════════╣
║  DIRECTOR                ║  director@wajinainternational.com.ng        ║
║  PRINCIPAL               ║  principal@wajinainternational.com.ng       ║
║  HEAD_TEACHER            ║  headteacher@wajinainternational.com.ng     ║
║  ASST_HEAD_TEACHER       ║  asst.head@wajinainternational.com.ng       ║
║  VP_ADMIN                ║  vpadmin@wajinainternational.com.ng         ║
║  VP_ACADEMICS            ║  vpacademics@wajinainternational.com.ng     ║
║  HOD                     ║  hod@wajinainternational.com.ng             ║
║  HR                      ║  hr@wajinainternational.com.ng              ║
║  DEAN                    ║  dean@wajinainternational.com.ng            ║
║  BURSAR (PRIMARY)        ║  bursar@wajinainternational.com.ng          ║
║  BURSAR (SECONDARY)      ║  bursar.sec@wajinainternational.com.ng      ║
║  ACCOUNTS_OFFICER        ║  accounts@wajinainternational.com.ng        ║
║  FORM_TEACHER            ║  formteacher@wajinainternational.com.ng     ║
║  TEACHER                 ║  teacher@wajinainternational.com.ng         ║
║  PARENT                  ║  parent@wajinainternational.com.ng          ║
║  STUDENT                 ║  student@wajinainternational.com.ng         ║
╚══════════════════════════╩════════════════════════════════╝
`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
