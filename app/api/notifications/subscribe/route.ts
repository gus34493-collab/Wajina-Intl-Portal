import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthUser, unauthorized, badRequest, serverError, getIP } from "@/lib/api-auth";
import { audit } from "@/lib/audit";

export async function POST(req: NextRequest) {
  const user = await getAuthUser();
  if (!user) return unauthorized();

  try {
    const subscription = await req.json();
    if (!subscription || !subscription.endpoint) {
      return badRequest("Invalid push subscription data.");
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { pushSubscription: subscription as any },
    });

    audit(user.id, "PUSH_SUBSCRIBE", "User", user.id, "Subscribed for PWA push alerts", getIP(req));
    return NextResponse.json({ message: "Push subscription synchronized successfully" }, { status: 201 });
  } catch (err) {
    console.error("[notifications/subscribe POST]", err);
    return serverError();
  }
}
