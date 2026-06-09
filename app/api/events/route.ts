import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthUser, unauthorized, badRequest } from "@/lib/api-auth";

export async function GET(req: NextRequest) {
  const user = await getAuthUser();
  if (!user) return unauthorized();

  const { searchParams } = new URL(req.url);
  const termId = searchParams.get("termId");
  const campus = searchParams.get("campus");

  if (!termId) return badRequest("termId is required");

  try {
    const events = await prisma.schoolEvent.findMany({
      where: {
        termId,
        ...(campus && { campus: campus as any })
      },
      orderBy: { startDate: "asc" }
    });
    return NextResponse.json({ events });
  } catch (err) {
    console.error("[events GET]", err);
    return NextResponse.json({ error: "Failed to fetch events" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const user = await getAuthUser();
  if (!user) return unauthorized();

  try {
    const body = await req.json();
    const { title, description, startDate, endDate, type, campus, sessionId, termId } = body;

    if (!title || !startDate || !endDate || !termId || !sessionId) {
      return badRequest("Missing required fields");
    }

    const event = await prisma.schoolEvent.create({
      data: {
        title,
        description,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        type: type || "GENERAL",
        campus: campus as any,
        sessionId,
        termId
      }
    });

    return NextResponse.json({ event }, { status: 201 });
  } catch (err) {
    console.error("[events POST]", err);
    return NextResponse.json({ error: "Failed to create event" }, { status: 500 });
  }
}
