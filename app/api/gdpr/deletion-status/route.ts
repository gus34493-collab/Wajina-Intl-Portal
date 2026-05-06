import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthUser, unauthorized, serverError } from "@/lib/api-auth";

export async function GET(_req: NextRequest) {
  const user = await getAuthUser();
  if (!user) return unauthorized();

  try {
    const record = await prisma.user.findUnique({
      where: { id: user.id },
      select: { id: true, name: true, deletionRequestedAt: true },
    });
    return NextResponse.json({
      deletionRequested: !!record?.deletionRequestedAt,
      requestedAt: record?.deletionRequestedAt ?? null,
    });
  } catch (err) {
    console.error("[gdpr/deletion-status GET]", err);
    return serverError();
  }
}
