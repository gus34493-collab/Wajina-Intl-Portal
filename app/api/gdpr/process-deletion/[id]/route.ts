import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import {
  getAuthUser, hasRole, unauthorized, forbidden, badRequest, notFound, serverError, getIP,
} from "@/lib/api-auth";
import { audit } from "@/lib/audit";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthUser();
  if (!user) return unauthorized();
  if (!hasRole(user, "DIRECTOR")) return forbidden();

  const { id } = await params;

  try {
    const target = await prisma.user.findUnique({
      where: { id },
      select: { id: true, name: true, email: true, role: true, deletionRequestedAt: true },
    });
    if (!target) return notFound("User not found.");
    if (target.id === user.id) return badRequest("You cannot delete your own account.");

    await prisma.$transaction([
      // Revoke all active refresh tokens so no existing session can be rotated
      prisma.refreshToken.updateMany({
        where: { userId: target.id, revoked: false },
        data: { revoked: true },
      }),
      // Anonymise PII fields — pushSubscription contains a Web Push endpoint + keys
      prisma.user.update({
        where: { id: target.id },
        data: {
          email: `deleted_${target.id}@deleted.local`,
          name: "Deleted User",
          phone: null,
          profilePhoto: null,
          pushSubscription: null,
          status: "DISABLED",
          deletionRequestedAt: null,
        },
      }),
    ]);

    audit(user.id, "USER_ANONYMISED", "User", target.id, `GDPR erasure processed for ${target.name}`, getIP(req));
    return NextResponse.json({ message: `User "${target.name}" has been anonymised and disabled.` });
  } catch (err) {
    console.error("[gdpr/process-deletion/:id POST]", err);
    return serverError();
  }
}
