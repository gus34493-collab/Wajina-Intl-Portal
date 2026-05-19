import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthUser, hasRole, unauthorized, forbidden, serverError } from "@/lib/api-auth";

export async function GET(_req: NextRequest) {
  const user = await getAuthUser();
  if (!user) return unauthorized();
  if (!hasRole(user, "PARENT")) return forbidden();

  try {
    const wardLinks = await prisma.studentParent.findMany({
      where: { parentId: user.id },
      select: {
        student: {
          select: {
            id: true,
            name: true,
            campus: true,
            enrolledClass: { select: { name: true } },
            enrolledArm: { select: { fullName: true, class: { select: { name: true } } } },
          },
        },
      },
      orderBy: { student: { name: "asc" } },
    });

    const wards = wardLinks.map((l) => l.student);
    if (!wards.length) return NextResponse.json({ wards: [] });

    const currentTerm = await prisma.term.findFirst({
      where: { isCurrent: true },
      select: { id: true, name: true, session: { select: { name: true } } },
    });

    const enriched = await Promise.all(
      wards.map(async (ward) => {
        const [invoices, payments] = await Promise.all([
          prisma.invoice.findMany({
            where: { studentId: ward.id },
            orderBy: [{ session: { startYear: "desc" } }, { term: { name: "asc" } }],
            select: {
              id: true,
              amount: true,
              amountPaid: true,
              status: true,
              category: true,
              dueDate: true,
              notes: true,
              term: { select: { name: true } },
              session: { select: { name: true } },
            },
          }),
          prisma.payment.findMany({
            where: { studentId: ward.id },
            orderBy: { createdAt: "desc" },
            select: {
              id: true,
              reference: true,
              amount: true,
              status: true,
              category: true,
              createdAt: true,
              termId: true,
            },
          }),
        ]);

        const totalOwed = invoices.reduce((sum, inv) => {
          if (inv.status === "PAID" || inv.status === "WAIVED") return sum;
          return sum + (inv.amount - inv.amountPaid);
        }, 0);

        const totalPaid = payments
          .filter((p) => p.status === "CONFIRMED")
          .reduce((sum, p) => sum + p.amount, 0);

        return {
          id: ward.id,
          name: ward.name,
          campus: ward.campus,
          class: ward.enrolledClass?.name ?? ward.enrolledArm?.class?.name ?? null,
          arm: ward.enrolledArm?.fullName ?? null,
          invoices: invoices.map((inv) => ({
            ...inv,
            balance: Math.max(0, inv.amount - inv.amountPaid),
            dueDate: inv.dueDate.toISOString(),
          })),
          payments: payments.map((p) => ({
            ...p,
            createdAt: p.createdAt.toISOString(),
          })),
          totalOwed,
          totalPaid,
          currentTermId: currentTerm?.id ?? null,
        };
      })
    );

    return NextResponse.json({
      wards: enriched,
      currentTerm: currentTerm
        ? { id: currentTerm.id, name: currentTerm.name, session: (currentTerm as any).session?.name }
        : null,
    });
  } catch (err) {
    console.error("[parent/payments GET]", err);
    return serverError();
  }
}
