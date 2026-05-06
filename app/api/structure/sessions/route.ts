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

export async function GET(_req: NextRequest) {
  const user = await getAuthUser();
  if (!user) return unauthorized();

  try {
    const sessions = await prisma.academicSession.findMany({
      orderBy: { year: "desc" },
      include: { terms: { orderBy: { name: "asc" } } },
    });
    return NextResponse.json(sessions);
  } catch (err) {
    console.error("[structure/sessions GET]", err);
    return serverError();
  }
}

export async function POST(req: NextRequest) {
  const user = await getAuthUser();
  if (!user) return unauthorized();
  if (!hasRole(user, ...ADMIN)) return forbidden();

  try {
    const { name, year, startDate, endDate, isDefault } = await req.json();
    if (!name || !year) return badRequest("name and year are required");

    if (isDefault) {
      await prisma.academicSession.updateMany({
        where: { isDefault: true },
        data: { isDefault: false },
      });
    }

    const session = await prisma.academicSession.create({
      data: {
        name,
        year: String(year),
        startDate: startDate ? new Date(startDate) : new Date(),
        endDate: endDate
          ? new Date(endDate)
          : new Date(new Date().setFullYear(new Date().getFullYear() + 1)),
        isDefault: !!isDefault,
        status: "UPCOMING",
      },
    });

    audit(user.id, "CREATE", "AcademicSession", session.id, name, getIP(req));
    return NextResponse.json(session, { status: 201 });
  } catch (err) {
    console.error("[structure/sessions POST]", err);
    return serverError();
  }
}
