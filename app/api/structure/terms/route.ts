import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import {
  getAuthUser,
  hasRole,
  unauthorized,
  forbidden,
  badRequest,
  serverError,
  getIP,
} from "@/lib/api-auth";
import { audit } from "@/lib/audit";

const ADMIN = ["DIRECTOR", "PRINCIPAL", "HEAD_TEACHER", "VP_ADMIN"] as const;

export async function GET(req: NextRequest) {
  const user = await getAuthUser();
  if (!user) return unauthorized();

  try {
    const { searchParams } = new URL(req.url);
    const sessionId = searchParams.get("sessionId");

    const terms = await prisma.term.findMany({
      where: sessionId ? { sessionId } : undefined,
      orderBy: [{ session: { year: "desc" } }, { name: "asc" }],
      include: { session: { select: { name: true, year: true } } },
    });

    return NextResponse.json(terms);
  } catch (err) {
    console.error("[structure/terms GET]", err);
    return serverError();
  }
}

export async function POST(req: NextRequest) {
  const user = await getAuthUser();
  if (!user) return unauthorized();
  if (!hasRole(user, ...ADMIN)) return forbidden();

  try {
    const { sessionId, name, startDate, endDate, isCurrent } = await req.json();
    if (!sessionId || !name) return badRequest("sessionId and name are required");

    if (isCurrent) {
      await prisma.term.updateMany({ where: { isCurrent: true }, data: { isCurrent: false } });
    }

    const term = await prisma.term.create({
      data: {
        sessionId,
        name,
        startDate: startDate ? new Date(startDate) : new Date(),
        endDate: endDate
          ? new Date(endDate)
          : new Date(new Date().setMonth(new Date().getMonth() + 4)),
        isCurrent: !!isCurrent,
        status: "UPCOMING",
      },
      include: { session: { select: { name: true } } },
    });

    audit(user.id, "CREATE", "Term", term.id, `${name} - ${term.session.name}`, getIP(req));
    return NextResponse.json(term, { status: 201 });
  } catch (err) {
    console.error("[structure/terms POST]", err);
    return serverError();
  }
}
