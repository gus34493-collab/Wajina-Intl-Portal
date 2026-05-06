import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthUser, unauthorized, forbidden, serverError } from "@/lib/api-auth";

export async function GET(req: NextRequest) {
  const user = await getAuthUser();
  if (!user) return unauthorized();
  if ((user.role as string) !== "DIRECTOR") return forbidden();

  try {
    const campus = new URL(req.url).searchParams.get("campus");

    let session = await prisma.academicSession.findFirst({ where: { status: "ACTIVE" } });
    if (!session) session = await prisma.academicSession.findFirst({ orderBy: { year: "desc" } });
    if (!session) return NextResponse.json({ labels: ["W1", "W2", "W3", "W4", "W5", "W6"], data: [0, 0, 0, 0, 0, 0] });

    const sixWeeksAgo = new Date();
    sixWeeksAgo.setDate(sixWeeksAgo.getDate() - 42);

    const payments = await prisma.payment.findMany({
      where: {
        status: "CONFIRMED", category: "TUITION", sessionId: session.id,
        createdAt: { gte: sixWeeksAgo },
        ...(campus && campus !== "ALL" && { student: { campus: campus as any } }),
      },
      select: { amount: true, createdAt: true },
    });

    const weeks = [0, 0, 0, 0, 0, 0];
    const now = new Date();
    for (const p of payments) {
      const diffDays = Math.floor((now.getTime() - new Date(p.createdAt).getTime()) / 86400000);
      const wi = Math.floor(diffDays / 7);
      if (wi >= 0 && wi < 6) weeks[5 - wi] += Number(p.amount);
    }

    return NextResponse.json({
      labels: ["Wk 1", "Wk 2", "Wk 3", "Wk 4", "Wk 5", "Wk 6"],
      data: weeks.map((w) => w / 1e6),
      totalRaw: weeks.reduce((a, b) => a + b, 0),
      sessionName: session.name,
    });
  } catch (err) {
    console.error("[finance/revenue-stats GET]", err);
    return serverError();
  }
}
