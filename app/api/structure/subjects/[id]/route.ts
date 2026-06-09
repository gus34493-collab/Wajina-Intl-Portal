import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthUser, unauthorized, serverError, hasRole, forbidden, badRequest } from "@/lib/api-auth";
import { audit } from "@/lib/audit";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthUser();
  if (!user) return unauthorized();

  if (!hasRole(user, "DIRECTOR", "PRINCIPAL", "HEAD_TEACHER", "VP_ACADEMICS", "VP_ADMIN")) {
    return forbidden();
  }

  try {
    const { id } = await params;
    const body = await req.json();
    const { teacherId } = body;

    if (!teacherId) {
      return badRequest("teacherId is required");
    }

    const updatedSubject = await prisma.subject.update({
      where: { id },
      data: { teacherId },
      include: {
        teacher: { select: { name: true, role: true } },
        class: { select: { name: true } }
      }
    });

    return NextResponse.json({ subject: updatedSubject });
  } catch (err) {
    console.error("[structure/subjects/[id] PATCH]", err);
    return serverError();
  }
}
