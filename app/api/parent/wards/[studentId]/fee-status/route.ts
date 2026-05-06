import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthUser, hasRole, unauthorized, forbidden, serverError } from "@/lib/api-auth";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ studentId: string }> }
) {
  const user = await getAuthUser();
  if (!user) return unauthorized();
  if (!hasRole(user, "PARENT")) return forbidden();

  const { studentId } = await params;

  const link = await prisma.studentParent.findFirst({
    where: { studentId, parentId: user.id },
    select: { student: { select: { id: true, name: true, classId: true, campus: true } } },
  });
  if (!link) return forbidden("This student is not linked to your account.");
  const ward = link.student;

  try {
    const [payments, currentTerm] = await Promise.all([
      prisma.payment.findMany({
        where: { studentId },
        select: { id: true, reference: true, amount: true, status: true, category: true, termId: true, sessionId: true },
        orderBy: { id: "desc" },
      }),
      prisma.term.findFirst({ where: { isCurrent: true }, select: { id: true, name: true, sessionId: true } }),
    ]);

    const confirmed = payments.filter((p) => p.status === "CONFIRMED");
    const totalPaid = confirmed.reduce((a, p) => a + Number(p.amount), 0);
    const totalPending = payments
      .filter((p) => p.status === "PENDING")
      .reduce((a, p) => a + Number(p.amount), 0);

    let currentTermBalance = null;
    if (currentTerm) {
      const feeConfigs = await prisma.feeConfig.findMany({
        where: { category: "TUITION", sessionId: currentTerm.sessionId },
      });
      const feeConfig =
        feeConfigs.find((c) => c.classId === ward.classId && c.termId === currentTerm.id) ??
        feeConfigs.find((c) => c.classId === ward.classId && !c.termId) ??
        feeConfigs.find((c) => !c.classId && c.campus === (ward.campus as any) && c.termId === currentTerm.id) ??
        feeConfigs.find((c) => !c.classId && c.campus === (ward.campus as any) && !c.termId) ??
        feeConfigs.find((c) => !c.classId && !c.campus && c.termId === currentTerm.id) ??
        feeConfigs.find((c) => !c.classId && !c.campus && !c.termId) ??
        null;

      const feeOwed = feeConfig ? Number(feeConfig.amount) : 0;
      const termPaid = payments
        .filter((p) => p.status === "CONFIRMED" && p.category === "TUITION" && p.termId === currentTerm.id)
        .reduce((a, p) => a + Number(p.amount), 0);
      const balance = feeOwed - termPaid;
      const paymentStatus =
        feeOwed > 0 && termPaid >= feeOwed ? "PAID"
        : termPaid > 0 ? "PARTIAL"
        : "UNPAID";

      currentTermBalance = { termId: currentTerm.id, termName: currentTerm.name, feeOwed, termPaid, balance, paymentStatus };
    }

    return NextResponse.json({
      student: { id: ward.id, name: ward.name },
      payments,
      totalPaid,
      totalPending,
      latestStatus: payments[0]?.status ?? null,
      currentTermBalance,
    });
  } catch (err) {
    console.error("[parent/wards/:studentId/fee-status GET]", err);
    return serverError();
  }
}
