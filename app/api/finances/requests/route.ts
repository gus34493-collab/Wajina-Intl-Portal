import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthUser, unauthorized, forbidden, serverError } from "@/lib/api-auth";

const FINANCE_ROLES = ["DIRECTOR", "PRINCIPAL", "BURSAR", "ACCOUNTS_OFFICER", "HEAD_TEACHER"];

export async function GET(req: NextRequest) {
  const user = await getAuthUser();
  if (!user) return unauthorized();
  if (!FINANCE_ROLES.includes(user.role as string)) return forbidden();

  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status") ?? "PENDING";
    const role = user.role as string;
    const campus = role === "DIRECTOR" ? searchParams.get("campus") : (user.campus as string);

    const where: any = { status: status.toUpperCase() };
    if (campus && campus !== "ALL") where.sender = { campus: campus as any };

    const [requests, total] = await Promise.all([
      prisma.request.findMany({
        where,
        orderBy: { createdAt: "desc" },
        include: { sender: { select: { name: true, role: true } } },
      }),
      prisma.request.count({ where }),
    ]);

    return NextResponse.json({ requests, total });
  } catch (err) {
    console.error("[finances/requests GET]", err);
    return serverError();
  }
}
