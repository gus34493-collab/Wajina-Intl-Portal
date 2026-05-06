import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthUser, unauthorized, serverError } from "@/lib/api-auth";

export async function POST(_req: NextRequest) {
  const user = await getAuthUser();
  if (!user) return unauthorized();

  try {
    const updated = await prisma.user.update({
      where: { id: user.id },
      data: { deletionRequestedAt: null },
      select: { id: true, name: true, email: true, deletionRequestedAt: true },
    });
    return NextResponse.json({ message: "Deletion request cancelled.", user: updated });
  } catch (err) {
    console.error("[gdpr/cancel-deletion POST]", err);
    return serverError();
  }
}
