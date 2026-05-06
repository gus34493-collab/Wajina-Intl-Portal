import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthUser, unauthorized, serverError } from "@/lib/api-auth";

export async function GET(_req: NextRequest) {
  const user = await getAuthUser();
  if (!user) return unauthorized();

  try {
    const [sessions, classes] = await Promise.all([
      prisma.academicSession.findMany({
        orderBy: { year: "desc" },
        include: { terms: { orderBy: { name: "asc" } } },
      }),
      prisma.class.findMany({
        where: { active: true },
        orderBy: [{ campus: "asc" }, { displayOrder: "asc" }],
        include: {
          arms: {
            include: {
              teacher: { select: { name: true } },
              _count: { select: { students: true } },
            },
            orderBy: { label: "asc" },
          },
        },
      }),
    ]);

    return NextResponse.json({ sessions, classes });
  } catch (err) {
    console.error("[structure/overview GET]", err);
    return serverError();
  }
}
