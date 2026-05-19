import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthUser, unauthorized, forbidden, serverError } from "@/lib/api-auth";

const MANAGEMENT = ["DIRECTOR", "PRINCIPAL", "HEAD_TEACHER", "ASST_HEAD_TEACHER", "VP_ADMIN", "VP_ACADEMICS"];

export async function GET(_req: NextRequest) {
  const user = await getAuthUser();
  if (!user) return unauthorized();

  try {
    const sessions = await prisma.academicSession.findMany({
      orderBy: { startDate: "desc" },
      include: { terms: { orderBy: { startDate: "asc" } } },
    });
    return NextResponse.json({ sessions });
  } catch (err) {
    console.error("[sessions GET]", err);
    return serverError();
  }
}

export async function POST(req: NextRequest) {
  const user = await getAuthUser();
  if (!user) return unauthorized();
  if (!MANAGEMENT.includes(user.role as string)) return forbidden();

  try {
    const { name, year, startDate, endDate } = await req.json();
    if (!name || !year || !startDate || !endDate) {
      return NextResponse.json({ error: "name, year, startDate, and endDate are required." }, { status: 400 });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    const span = end.getTime() - start.getTime();
    const third = span / 3;

    const t1End = new Date(start.getTime() + third);
    const t2Start = new Date(t1End.getTime() + 86_400_000);
    const t2End = new Date(start.getTime() + 2 * third);
    const t3Start = new Date(t2End.getTime() + 86_400_000);

    const session = await prisma.academicSession.create({
      data: {
        name,
        year,
        startDate: start,
        endDate: end,
        lastUpdatedBy: user.id,
        terms: {
          create: [
            { name: "FIRST",  startDate: start,   endDate: t1End },
            { name: "SECOND", startDate: t2Start,  endDate: t2End },
            { name: "THIRD",  startDate: t3Start,  endDate: end   },
          ],
        },
      },
      include: { terms: { orderBy: { startDate: "asc" } } },
    });

    return NextResponse.json({ session }, { status: 201 });
  } catch (err: any) {
    if (err?.code === "P2002") {
      return NextResponse.json({ error: "A session for this academic year already exists." }, { status: 409 });
    }
    console.error("[sessions POST]", err);
    return serverError();
  }
}
