import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthUser, unauthorized, forbidden, badRequest, serverError } from "@/lib/api-auth";

const ALLOWED = ["DIRECTOR", "PRINCIPAL", "BURSAR", "ACCOUNTS_OFFICER"];

export async function GET(req: NextRequest) {
  const user = await getAuthUser();
  if (!user) return unauthorized();
  if (!ALLOWED.includes(user.role as string)) return forbidden();

  try {
    const role = user.role as string;
    const { searchParams } = new URL(req.url);
    const termId = searchParams.get("termId");
    const armId = searchParams.get("armId");
    const campusParam = searchParams.get("campus");

    if (!termId) return badRequest("termId is required.");

    const campus = role === "DIRECTOR" ? campusParam : (user.campus as string);

    const term = await prisma.term.findUnique({
      where: { id: termId },
      select: { id: true, sessionId: true },
    });
    if (!term) return badRequest("Invalid termId.");

    const students = await prisma.user.findMany({
      where: {
        role: "STUDENT",
        status: "ACTIVE",
        ...(campus && campus !== "ALL" && { campus: campus as any }),
        ...(armId && { armId }),
      },
      select: { id: true, name: true, classId: true, campus: true },
      orderBy: { name: "asc" },
    });

    if (!students.length) return NextResponse.json({ termId, students: [] });

    const feeConfigs = await prisma.feeConfig.findMany({
      where: {
        category: "TUITION",
        sessionId: term.sessionId,
        OR: [{ termId: term.id }, { termId: null }],
      },
    });

    const paymentsAgg = await prisma.payment.groupBy({
      by: ["studentId"],
      where: {
        studentId: { in: students.map((s) => s.id) },
        termId: term.id,
        status: "CONFIRMED",
        category: "TUITION",
      },
      _sum: { amount: true },
    });

    const paidByStudent = new Map<string, number>();
    for (const row of paymentsAgg) {
      paidByStudent.set(row.studentId, Number(row._sum.amount ?? 0));
    }

    const pickConfig = (classId: string | null, campusVal: any) => {
      return (
        feeConfigs.find((c) => c.classId === classId && c.termId === term.id) ??
        feeConfigs.find((c) => c.classId === classId && !c.termId) ??
        feeConfigs.find((c) => !c.classId && c.campus === campusVal && c.termId === term.id) ??
        feeConfigs.find((c) => !c.classId && c.campus === campusVal && !c.termId) ??
        feeConfigs.find((c) => !c.classId && !c.campus && c.termId === term.id) ??
        feeConfigs.find((c) => !c.classId && !c.campus && !c.termId) ??
        null
      );
    };

    const result = students.map((s) => {
      const config = pickConfig(s.classId ?? null, s.campus);
      const feeOwed = config ? Number(config.amount) : 0;
      const totalPaid = paidByStudent.get(s.id) ?? 0;
      const balance = feeOwed - totalPaid;
      const status =
        feeOwed > 0 && totalPaid >= feeOwed ? "PAID"
        : totalPaid > 0 ? "PARTIAL"
        : "UNPAID";
      return { studentId: s.id, name: s.name, feeOwed, totalPaid, balance, status };
    });

    return NextResponse.json({ termId: term.id, students: result });
  } catch (err) {
    console.error("[finance/student-balances GET]", err);
    return serverError();
  }
}
