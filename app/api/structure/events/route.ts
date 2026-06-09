import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthUser, hasRole, unauthorized, forbidden, badRequest, serverError } from "@/lib/api-auth";

const ADMIN = ["DIRECTOR", "PRINCIPAL", "HEAD_TEACHER", "VP_ADMIN", "VP_ACADEMICS"] as const;

export async function GET(req: NextRequest) {
  const user = await getAuthUser();
  if (!user) return unauthorized();

  try {
    const { searchParams } = new URL(req.url);
    const sessionId = searchParams.get("sessionId");
    const termId = searchParams.get("termId");

    const events = await prisma.schoolEvent.findMany({
      where: {
        ...(sessionId && { sessionId }),
        ...(termId && { termId }),
        // If not DIRECTOR, only show events for this campus or ALL campuses (campus = null)
        ...(user.role !== "DIRECTOR" ? {
          OR: [
            { campus: user.campus as any },
            { campus: null }
          ]
        } : {})
      },
      orderBy: { startDate: "asc" }
    });

    return NextResponse.json({ events });
  } catch (err) {
    console.error("[structure/events GET]", err);
    return serverError();
  }
}

export async function POST(req: NextRequest) {
  const user = await getAuthUser();
  if (!user) return unauthorized();
  if (!hasRole(user, ...ADMIN)) return forbidden();

  try {
    const body = await req.json();
    const { title, description, startDate, endDate, type, campus, sessionId, termId } = body;

    if (!title || !startDate || !endDate || !sessionId || !termId) {
      return badRequest("Missing required fields for event creation");
    }

    const event = await prisma.schoolEvent.create({
      data: {
        title,
        description,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        type: type || "GENERAL",
        campus: user.role === "DIRECTOR" ? (campus || null) : user.campus,
        sessionId,
        termId
      }
    });

    return NextResponse.json({ event }, { status: 201 });
  } catch (err) {
    console.error("[structure/events POST]", err);
    return serverError();
  }
}
