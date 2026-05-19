import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const sessions = await prisma.academicSession.findMany({
    include: { terms: true },
    orderBy: { createdAt: "desc" },
  });

  if (sessions.length === 0) {
    console.log("⚠  NO ACADEMIC SESSIONS EXIST IN DB");
  } else {
    sessions.forEach(s => {
      console.log(`Session: ${s.name} — ${s.status}`);
      s.terms.forEach(t => console.log(`  Term: ${t.name} isCurrent=${t.isCurrent}`));
    });
  }

  const feeConfig = await prisma.admissionConfig.count().catch(() => 0);
  console.log("\nAdmission configs:", feeConfig);
}

main().catch(e => console.error(e)).finally(() => prisma.$disconnect());
