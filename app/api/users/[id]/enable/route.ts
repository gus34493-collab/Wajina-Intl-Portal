import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthUser, unauthorized, forbidden, notFound, serverError, getIP } from "@/lib/api-auth";
import { audit } from "@/lib/audit";

const ADMIN_ROLES = ["DIRECTOR", "PRINCIPAL", "HEAD_TEACHER", "VP_ADMIN", "HR"];
const DIRECTOR_ONLY_TARGETS = ["DIRECTOR", "PRINCIPAL", "HEAD_TEACHER"];

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthUser();
  if (!user) return unauthorized();
  if (!ADMIN_ROLES.includes(user.role as string)) return forbidden();
  const { id } = await params;

  try {
    const target = await prisma.user.findUnique({ where: { id: id }, select: { role: true, name: true } });
    if (!target) return notFound("User not found.");

    const actorRole = user.role as string;
    if (!["DIRECTOR"].includes(actorRole) && DIRECTOR_ONLY_TARGETS.includes(target.role)) {
      return forbidden();
    }

    await prisma.user.update({ where: { id: id }, data: { status: "ACTIVE" } });
    audit(user.id, "ENABLE_USER", "User", id, target.name, getIP(req));
    return NextResponse.json({ message: "User account enabled." });
  } catch (err) {
    console.error("[users/[id]/enable POST]", err);
    return serverError();
  }
}
