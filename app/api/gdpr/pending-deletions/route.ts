import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthUser, hasRole, unauthorized, forbidden, serverError } from "@/lib/api-auth";

export async function GET(_req: NextRequest) {
  const user = await getAuthUser();
  if (!user) return unauthorized();
  if (!hasRole(user, "DIRECTOR")) return forbidden();

  try {
    const users = await prisma.user.findMany({
      where: { deletionRequestedAt: { not: null } },
      select: {
        id: true, name: true, email: true, role: true,
        deletionRequestedAt: true, createdAt: true,
      },
      orderBy: { deletionRequestedAt: "asc" },
    });
    return NextResponse.json({ pendingDeletions: users, count: users.length });
  } catch (err) {
    console.error("[gdpr/pending-deletions GET]", err);
    return serverError();
  }
}
