import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthUser, unauthorized, forbidden, serverError } from "@/lib/api-auth";

const ALLOWED = ["DIRECTOR", "PRINCIPAL", "BURSAR", "ACCOUNTS_OFFICER"];

export async function GET(req: NextRequest) {
  const user = await getAuthUser();
  if (!user) return unauthorized();
  if (!ALLOWED.includes(user.role as string)) return forbidden();

  try {
    const role = user.role as string;
    const campus = role === "DIRECTOR"
      ? new URL(req.url).searchParams.get("campus")
      : (user.campus as string);

    let session = await prisma.academicSession.findFirst({ where: { status: "ACTIVE" } });
    if (!session) session = await prisma.academicSession.findFirst({ orderBy: { year: "desc" } });
    if (!session) return NextResponse.json({ summary: { paid: 0, total: 0, outstanding: 0 }, campus: campus ?? "ALL" });

    const studentFilter: any = { role: "STUDENT", status: "ACTIVE" };
    if (campus && campus !== "ALL") studentFilter.campus = campus as any;

    const [collected, feeConfigs, studentGroups] = await Promise.all([
      prisma.payment.aggregate({
        where: { sessionId: session.id, status: "CONFIRMED", category: "TUITION", student: studentFilter },
        _sum: { amount: true },
      }),
      prisma.feeConfig.findMany({ where: { sessionId: session.id, category: "TUITION" } }),
      prisma.user.groupBy({ by: ["classId", "campus"], where: studentFilter, _count: { _all: true } }),
    ]);

    let total = 0;
    for (const group of studentGroups) {
      const config =
        feeConfigs.find((c) => c.classId === group.classId) ||
        feeConfigs.find((c) => c.campus === (group.campus as any) && !c.classId) ||
        feeConfigs.find((c) => !c.campus && !c.classId);
      if (config) total += Number(config.amount) * group._count._all;
    }

    const paid = Number((collected._sum as any).amount) || 0;
    return NextResponse.json({ summary: { paid, total, outstanding: total - paid }, campus: campus ?? "ALL" });
  } catch (err) {
    console.error("[finance/stats GET]", err);
    return serverError();
  }
}
