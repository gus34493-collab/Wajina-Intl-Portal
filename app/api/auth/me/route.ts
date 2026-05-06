import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthUser, unauthorized, notFound, serverError } from "@/lib/api-auth";

export async function GET(_req: NextRequest) {
  const user = await getAuthUser();
  if (!user) return unauthorized();

  try {
    const record = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        id: true, email: true, name: true, role: true, status: true,
        phone: true, profilePhoto: true, consentGiven: true, consentDate: true, campus: true,
        enrolledArm: { select: { id: true, fullName: true, class: { select: { name: true, campus: true } } } },
      },
    });
    if (!record) return notFound("User not found.");
    return NextResponse.json(record);
  } catch (err) {
    console.error("[auth/me GET]", err);
    return serverError();
  }
}
