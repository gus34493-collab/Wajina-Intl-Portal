import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthUser, unauthorized, serverError } from "@/lib/api-auth";

export async function POST(_req: NextRequest) {
  const user = await getAuthUser();
  if (!user) return unauthorized();

  try {
    const updated = await prisma.user.update({
      where: { id: user.id },
      data: { consentGiven: false },
      select: { id: true, name: true, consentGiven: true },
    });
    return NextResponse.json({ message: "Consent withdrawn. Some features may be limited.", user: updated });
  } catch (err) {
    console.error("[privacy/withdraw-consent POST]", err);
    return serverError();
  }
}
