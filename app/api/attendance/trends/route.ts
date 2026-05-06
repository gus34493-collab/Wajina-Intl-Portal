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

    const labels: string[] = [];
    const data: number[] = [];

    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const start = new Date(d);
      const end = new Date(d);
      end.setDate(end.getDate() + 1);

      const count = await prisma.attendance.count({
        where: { status: "PRESENT", date: { gte: start, lt: end }, student: { campus: campus as any } },
      });

      labels.push(d.toLocaleDateString("en-GB", { weekday: "short", day: "numeric" }));
      data.push(count);
    }

    return NextResponse.json({ labels, data });
  } catch (err) {
    console.error("[attendance/trends GET]", err);
    return serverError();
  }
}
