import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const PASSWORD = "Wajina2026!";

const SEED_USERS = [
  { name: "Dr. Adeyemi Okonkwo",   email: "director@wajina.edu.ng",     role: "DIRECTOR",         campus: "PRIMARY"   },
  { name: "Mrs. Funmi Adebisi",    email: "principal@wajina.edu.ng",    role: "PRINCIPAL",        campus: "SECONDARY" },
  { name: "Mr. Chidi Eze",         email: "headteacher@wajina.edu.ng",  role: "HEAD_TEACHER",     campus: "PRIMARY"   },
  { name: "Mrs. Amaka Nwosu",      email: "asst.head@wajina.edu.ng",    role: "ASST_HEAD_TEACHER",campus: "PRIMARY"   },
  { name: "Mr. Emeka Obi",         email: "vpadmin@wajina.edu.ng",      role: "VP_ADMIN",         campus: "SECONDARY" },
  { name: "Dr. Ngozi Adaeze",      email: "vpacademics@wajina.edu.ng",  role: "VP_ACADEMICS",     campus: "SECONDARY" },
  { name: "Mr. Bola Adewale",      email: "hod@wajina.edu.ng",          role: "HOD",              campus: "SECONDARY" },
  { name: "Mrs. Titi Afolabi",     email: "hr@wajina.edu.ng",           role: "HR",               campus: "PRIMARY"   },
  { name: "Mr. Femi Bankole",      email: "dean@wajina.edu.ng",         role: "DEAN",             campus: "SECONDARY" },
  { name: "Mr. Seun Adeyemi",      email: "bursar@wajina.edu.ng",       role: "BURSAR",           campus: "PRIMARY"   },
  { name: "Mrs. Ngozi Okonjo",     email: "bursar.sec@wajina.edu.ng",   role: "BURSAR",           campus: "SECONDARY" },
  { name: "Mrs. Chibuzor Nkem",    email: "accounts@wajina.edu.ng",     role: "ACCOUNTS_OFFICER", campus: "PRIMARY"   },
  { name: "Mr. Tunde Ogundimu",    email: "formteacher@wajina.edu.ng",  role: "FORM_TEACHER",     campus: "SECONDARY", isFormMaster: true },
  { name: "Mrs. Yetunde Lawal",    email: "teacher@wajina.edu.ng",      role: "TEACHER",          campus: "PRIMARY"   },
  { name: "Mr. Kunle Adeniyi",     email: "parent@wajina.edu.ng",       role: "PARENT",           campus: "PRIMARY"   },
  { name: "Chisom Adeniyi",        email: "student@wajina.edu.ng",      role: "STUDENT",          campus: "PRIMARY"   },
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
║  DIRECTOR                ║  director@wajina.edu.ng        ║
║  PRINCIPAL               ║  principal@wajina.edu.ng       ║
║  HEAD_TEACHER            ║  headteacher@wajina.edu.ng     ║
║  ASST_HEAD_TEACHER       ║  asst.head@wajina.edu.ng       ║
║  VP_ADMIN                ║  vpadmin@wajina.edu.ng         ║
║  VP_ACADEMICS            ║  vpacademics@wajina.edu.ng     ║
║  HOD                     ║  hod@wajina.edu.ng             ║
║  HR                      ║  hr@wajina.edu.ng              ║
║  DEAN                    ║  dean@wajina.edu.ng            ║
║  BURSAR (PRIMARY)        ║  bursar@wajina.edu.ng          ║
║  BURSAR (SECONDARY)      ║  bursar.sec@wajina.edu.ng      ║
║  ACCOUNTS_OFFICER        ║  accounts@wajina.edu.ng        ║
║  FORM_TEACHER            ║  formteacher@wajina.edu.ng     ║
║  TEACHER                 ║  teacher@wajina.edu.ng         ║
║  PARENT                  ║  parent@wajina.edu.ng          ║
║  STUDENT                 ║  student@wajina.edu.ng         ║
╚══════════════════════════╩════════════════════════════════╝
`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
