import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthUser, unauthorized, forbidden, serverError } from "@/lib/api-auth";

export async function GET(req: NextRequest) {
  const user = await getAuthUser();
  if (!user) return unauthorized();

  const ALLOWED = ["DEAN", "PRINCIPAL", "DIRECTOR"];
  if (!ALLOWED.includes(user.role)) return forbidden();

  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status") || undefined;
    const limit = parseInt(searchParams.get("limit") || "10");

    const [complaints, total] = await Promise.all([
      prisma.complaint.findMany({
        where: {
          campus: user.campus as any,
          ...(status && { status: status as any }),
        },
        orderBy: { createdAt: "desc" },
        take: limit,
        select: {
          id: true,
          subject: true,
          status: true,
          createdAt: true,
          parent: { select: { name: true } },
        },
      }),
      prisma.complaint.count({
        where: {
          campus: user.campus as any,
          ...(status && { status: status as any }),
        },
      }),
    ]);

    const formatted = complaints.map(c => ({
      title: c.subject,
      sender: c.parent,
      status: c.status,
      date: new Date(c.createdAt).toLocaleDateString("en-GB"),
    }));

    return NextResponse.json({ complaints: formatted, total });
  } catch (err) {
    console.error("[discipline/complaints GET]", err);
    return serverError();
  }
}
