import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthUser, hasRole, unauthorized, forbidden, serverError } from "@/lib/api-auth";

const LEADERSHIP = ["DIRECTOR", "PRINCIPAL", "VP_ADMIN", "VP_ACADEMICS", "HEAD_TEACHER", "ASST_HEAD_TEACHER"] as const;

export async function GET(_req: NextRequest) {
  const user = await getAuthUser();
  if (!user) return unauthorized();
  if (!hasRole(user, ...LEADERSHIP)) return forbidden();

  try {
    const session = await prisma.academicSession.findFirst({ where: { status: "ACTIVE" } });
    return NextResponse.json(session);
  } catch (err) {
    console.error("[session/active GET]", err);
    return serverError();
  }
}
