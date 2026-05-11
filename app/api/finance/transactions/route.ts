import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthUser, unauthorized, forbidden, serverError } from "@/lib/api-auth";

const ALLOWED = ["DIRECTOR", "PRINCIPAL", "BURSAR", "ACCOUNTS_OFFICER"];

export async function GET(req: NextRequest) {
  const user = await getAuthUser();
  if (!user) return unauthorized();
  if (!ALLOWED.includes(user.role as string)) return forbidden();

  try {
    const { searchParams } = new URL(req.url);
    const limit = Math.min(parseInt(searchParams.get("limit") ?? "10"), 50);
    const campus =
      user.role === "DIRECTOR"
        ? searchParams.get("campus")
        : (user.campus as string);

    const payments = await prisma.payment.findMany({
      where: {
        ...(campus && campus !== "ALL" && { campus: campus as any }),
      },
      orderBy: { createdAt: "desc" },
      take: limit,
      select: {
        id: true,
        reference: true,
        amount: true,
        status: true,
        category: true,
        createdAt: true,
        student: { select: { name: true } },
      },
    });

    const transactions = payments.map((p) => ({
      id: p.reference,
      label: p.category.replace(/_/g, " "),
      member: p.student.name,
      amount:
        p.status === "CONFIRMED"
          ? `+ ₦${p.amount.toLocaleString()}`
          : `₦${p.amount.toLocaleString()}`,
      date: new Date(p.createdAt).toLocaleString("en-GB", {
        day: "numeric",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
      }),
      isIncome: p.status === "CONFIRMED",
    }));

    return NextResponse.json({ transactions });
  } catch (err) {
    console.error("[finance/transactions GET]", err);
    return serverError();
  }
}
