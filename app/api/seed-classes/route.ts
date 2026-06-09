import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

const classesToSeed = [
  { name: "Creche / Daycare", campus: "PRIMARY", category: "EARLY_YEARS", displayOrder: 1 },
  { name: "Playgroup / Pre-Nursery", campus: "PRIMARY", category: "EARLY_YEARS", displayOrder: 2 },
  { name: "Nursery 1", campus: "PRIMARY", category: "EARLY_YEARS", displayOrder: 3 },
  { name: "Nursery 2", campus: "PRIMARY", category: "EARLY_YEARS", displayOrder: 4 },
  { name: "Basic 1", campus: "PRIMARY", category: "PRIMARY", displayOrder: 5 },
  { name: "Basic 2", campus: "PRIMARY", category: "PRIMARY", displayOrder: 6 },
  { name: "Basic 3", campus: "PRIMARY", category: "PRIMARY", displayOrder: 7 },
  { name: "Basic 4", campus: "PRIMARY", category: "PRIMARY", displayOrder: 8 },
  { name: "Basic 5", campus: "PRIMARY", category: "PRIMARY", displayOrder: 9 },
  { name: "Basic 6", campus: "PRIMARY", category: "PRIMARY", displayOrder: 10 },
  { name: "Basic 7", campus: "SECONDARY", category: "JUNIOR_SECONDARY", displayOrder: 11 },
  { name: "Basic 8", campus: "SECONDARY", category: "JUNIOR_SECONDARY", displayOrder: 12 },
  { name: "Basic 9", campus: "SECONDARY", category: "JUNIOR_SECONDARY", displayOrder: 13 },
  { name: "SS 1", campus: "SECONDARY", category: "SENIOR_SECONDARY", displayOrder: 14 },
  { name: "SS 2", campus: "SECONDARY", category: "SENIOR_SECONDARY", displayOrder: 15 },
  { name: "SS 3", campus: "SECONDARY", category: "SENIOR_SECONDARY", displayOrder: 16 },
];

export async function GET() {
  let createdCount = 0;
  for (const cls of classesToSeed) {
    // @ts-ignore
    const exists = await prisma.class.findFirst({ where: { name: cls.name, campus: cls.campus } });
    if (!exists) {
      await prisma.class.create({
        data: {
          name: cls.name,
          // @ts-ignore
          campus: cls.campus,
          category: cls.category,
          displayOrder: cls.displayOrder,
          active: true
        }
      });
      createdCount++;
    }
  }
  return NextResponse.json({ success: true, createdCount });
}
