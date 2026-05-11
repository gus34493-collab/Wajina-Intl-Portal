import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthUser, unauthorized, serverError } from "@/lib/api-auth";

export async function GET(_req: NextRequest) {
  const user = await getAuthUser();
  if (!user) return unauthorized();

  try {
    const campus = user.campus || "PRIMARY";
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Single GROUP BY instead of 7 serial counts
    const rows = await (prisma.attendance as any).groupBy({
      by: ["date"],
      where: {
        status: "PRESENT",
        date: { gte: sevenDaysAgo, lt: tomorrow },
        student: { campus: campus as any },
      },
      _count: { id: true },
    });

    const countByDate: Record<string, number> = {};
    for (const row of rows) {
      countByDate[new Date(row.date).toDateString()] = row._count.id;
    }

    const labels: string[] = [];
    const data: number[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      labels.push(d.toLocaleDateString("en-GB", { weekday: "short", day: "numeric" }));
      data.push(countByDate[d.toDateString()] ?? 0);
    }

    return NextResponse.json({ labels, data });
  } catch (err) {
    console.error("[attendance/trends GET]", err);
    return serverError();
  }
}
