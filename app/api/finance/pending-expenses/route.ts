import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthUser, unauthorized, forbidden, serverError } from "@/lib/api-auth";

const ALLOWED = ["DIRECTOR", "PRINCIPAL", "ACCOUNTS_OFFICER", "BURSAR"];

export async function GET(req: NextRequest) {
  const user = await getAuthUser();
  if (!user) return unauthorized();
  if (!ALLOWED.includes(user.role as string)) return forbidden();

  try {
    const { searchParams } = new URL(req.url);
    const limit = Math.min(parseInt(searchParams.get("limit") ?? "20"), 100);

    const payments = await prisma.payment.findMany({
      where: {
        status: "PENDING",
        ...(user.role !== "DIRECTOR" && user.campus && { campus: user.campus as any }),
      },
      orderBy: { createdAt: "desc" },
      take: limit,
      select: {
        id: true,
        reference: true,
        amount: true,
        category: true,
        campus: true,
        createdAt: true,
        student: { select: { name: true } },
      },
    });

    const expenses = payments.map((p) => ({
      id: p.id,
      reference: p.reference,
      description: p.category.replace(/_/g, " "),
      amount: p.amount,
      campus: p.campus,
      requestedBy: p.student.name,
      date: p.createdAt,
    }));

    return NextResponse.json({ expenses, total: expenses.length });
  } catch (err) {
    console.error("[finance/pending-expenses GET]", err);
    return serverError();
  }
}
