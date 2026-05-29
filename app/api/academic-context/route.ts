import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthUser, unauthorized } from "@/lib/api-auth";
import type { TermStatus, SessionStatus } from "@prisma/client";

// Lightweight endpoint — any authenticated user can read the active session and term.
// Returns null fields when no session/term is active (e.g. before first session is created).
export async function GET() {
  const user = await getAuthUser();
  if (!user) return unauthorized();

  try {
    const session = await prisma.academicSession.findFirst({
      where: { status: "ACTIVE" as SessionStatus },
      select: {
        id: true,
        name: true,
        year: true,
        terms: {
          where: { OR: [{ status: "ACTIVE" as TermStatus }, { isCurrent: true }] },
          select: { id: true, name: true, sessionId: true, startDate: true, endDate: true },
          take: 1,
        },
      },
    });

    if (!session) {
      return NextResponse.json({ activeSession: null, activeTerm: null });
    }

    return NextResponse.json({
      activeSession: { id: session.id, name: session.name, year: session.year },
      activeTerm: session.terms[0] ?? null,
    });
  } catch (err) {
    console.error("[academic-context GET]", err);
    return NextResponse.json({ activeSession: null, activeTerm: null });
  }
}
