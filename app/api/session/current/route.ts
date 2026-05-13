import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthUser, unauthorized } from "@/lib/api-auth";

// Lightweight read-only endpoint — any authenticated user can see the current session/term.
// Used by DashboardShell to display a read-only context pill across all dashboards.
export async function GET() {
  const user = await getAuthUser();
  if (!user) return unauthorized();

  try {
    const session = await prisma.academicSession.findFirst({
      where: { status: "ACTIVE" },
      include: {
        terms: {
          where: { isCurrent: true },
          select: { name: true },
        },
      },
    });

    if (!session) return NextResponse.json(null);

    return NextResponse.json({
      sessionName: session.name,
      termName: session.terms[0]?.name ?? null,
    });
  } catch (err) {
    console.error("[session/current GET]", err);
    return NextResponse.json(null);
  }
}
