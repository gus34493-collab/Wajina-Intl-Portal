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
    const limit = parseInt(searchParams.get("limit") || "10");

    const [incidents, total] = await Promise.all([
      prisma.behaviourRecord.findMany({
        where: {
          campus: user.campus as any,
          severity: { in: ["MEDIUM", "HIGH", "CRITICAL"] },
        },
        orderBy: { createdAt: "desc" },
        take: limit,
        select: {
          id: true,
          description: true,
          category: true,
          severity: true,
          createdAt: true,
          student: { select: { name: true } },
        },
      }),
      prisma.behaviourRecord.count({
        where: {
          campus: user.campus as any,
          severity: { in: ["MEDIUM", "HIGH", "CRITICAL"] },
        },
      }),
    ]);

    const formatted = incidents.map(inc => ({
      title: `${inc.severity}: ${inc.category}`,
      student: inc.student,
      date: new Date(inc.createdAt).toLocaleDateString("en-GB"),
    }));

    return NextResponse.json({ incidents: formatted, total });
  } catch (err) {
    console.error("[discipline/incidents GET]", err);
    return serverError();
  }
}
