import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthUser, unauthorized, serverError, getIP } from "@/lib/api-auth";
import { audit } from "@/lib/audit";

export async function POST(req: NextRequest) {
  const user = await getAuthUser();
  if (!user) return unauthorized();

  try {
    const updated = await prisma.user.update({
      where: { id: user.id },
      data: { deletionRequestedAt: new Date() },
      select: { id: true, name: true, email: true, deletionRequestedAt: true },
    });

    audit(user.id, "DELETION_REQUESTED", "User", user.id, "GDPR right to erasure requested", getIP(req));

    return NextResponse.json({
      message: "Deletion request submitted. An administrator will process your request within 30 days.",
      user: updated,
    });
  } catch (err) {
    console.error("[gdpr/request-deletion POST]", err);
    return serverError();
  }
}
