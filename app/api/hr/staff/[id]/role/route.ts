import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import {
  getAuthUser, unauthorized, badRequest, forbidden, notFound, serverError, getIP,
} from "@/lib/api-auth";
import { audit } from "@/lib/audit";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthUser();
  if (!user) return unauthorized();

  const { id } = await params;

  try {
    const { role } = await req.json();
    if (!role) return badRequest("Role is required.");

    const target = await prisma.user.findUnique({ where: { id } });
    if (!target) return notFound("Staff not found.");

    if (user.role !== "DIRECTOR" && (target.campus as string) !== user.campus) {
      return forbidden("Staff is in a different campus.");
    }

    const updated = await prisma.user.update({
      where: { id },
      data: { role: role as any },
      select: { id: true, name: true, role: true },
    });

    audit(user.id, "STAFF_ROLE_UPDATED", "User", updated.id, `Role changed to ${role} for ${updated.name}`, getIP(req));
    return NextResponse.json({ user: updated });
  } catch (err) {
    console.error("[hr/staff/:id/role PATCH]", err);
    return serverError();
  }
}
