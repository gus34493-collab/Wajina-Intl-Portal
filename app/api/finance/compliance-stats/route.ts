import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthUser, unauthorized, forbidden, serverError } from "@/lib/api-auth";

const ALLOWED = ["DIRECTOR", "PRINCIPAL", "HEAD_TEACHER", "ASST_HEAD_TEACHER", "BURSAR", "ACCOUNTS_OFFICER"];

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
    if (!session) return NextResponse.json({ summary: { paid: 0, unpaid: 0, partPaid: 0, total: 0 } });

    const students = await prisma.user.findMany({
      where: {
        role: "STUDENT", status: "ACTIVE",
        ...(campus && campus !== "ALL" && { campus: campus as any }),
      },
      select: {
        id: true, classId: true, campus: true,
        payments: { where: { sessionId: session.id, status: "CONFIRMED", category: "TUITION" }, select: { amount: true } },
      },
    });

    const feeConfigs = await prisma.feeConfig.findMany({ where: { sessionId: session.id, category: "TUITION" } });

    let paidCount = 0, unpaidCount = 0, partPaidCount = 0;
    for (const s of students) {
      const totalPaid = s.payments.reduce((sum, p) => sum + Number(p.amount), 0);
      const config =
        feeConfigs.find((c) => c.classId === s.classId) ||
        feeConfigs.find((c) => c.campus === (s.campus as any) && !c.classId) ||
        feeConfigs.find((c) => !c.campus && !c.classId);
      const expected = config ? Number(config.amount) : 0;
      if (totalPaid <= 0) unpaidCount++;
      else if (expected > 0 && totalPaid >= expected) paidCount++;
      else partPaidCount++;
    }

    return NextResponse.json({
      summary: { paid: paidCount, unpaid: unpaidCount, partPaid: partPaidCount, total: students.length },
      campus: campus ?? "ALL",
      sessionName: session.name,
    });
  } catch (err) {
    console.error("[finance/compliance-stats GET]", err);
    return serverError();
  }
}
