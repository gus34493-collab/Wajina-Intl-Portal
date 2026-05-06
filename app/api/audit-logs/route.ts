import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthUser, unauthorized, forbidden, serverError } from "@/lib/api-auth";

export async function GET(req: NextRequest) {
  const user = await getAuthUser();
  if (!user) return unauthorized();
  if ((user.role as string) !== "DIRECTOR") return forbidden();

  try {
    const { searchParams } = new URL(req.url);
    const limit = Math.min(parseInt(searchParams.get("limit") ?? "100"), 500);
    const skip = parseInt(searchParams.get("skip") ?? "0");

    const logs = await prisma.auditLog.findMany({
      take: limit,
      skip,
      orderBy: { createdAt: "desc" },
      include: { actor: { select: { name: true, role: true } } },
    });

    return NextResponse.json({ logs });
  } catch (err) {
    console.error("[audit-logs GET]", err);
    return serverError();
  }
}
