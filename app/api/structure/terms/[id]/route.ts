import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import {
  getAuthUser,
  hasRole,
  unauthorized,
  forbidden,
  notFound,
  serverError,
  getIP,
} from "@/lib/api-auth";
import { audit } from "@/lib/audit";

const ADMIN = ["DIRECTOR", "PRINCIPAL", "HEAD_TEACHER", "VP_ADMIN"] as const;

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthUser();
  if (!user) return unauthorized();
  if (!hasRole(user, ...ADMIN)) return forbidden();

  const { id } = await params;

  try {
    const { startDate, endDate, status, isCurrent } = await req.json();

    let term;

    if (isCurrent) {
      // Wrap demotion + promotion in one transaction — prevents a window where
      // zero current terms exist if the server crashes between the two writes.
      const [, updated] = await prisma.$transaction([
        prisma.term.updateMany({ where: { isCurrent: true }, data: { isCurrent: false } }),
        prisma.term.update({
          where: { id },
          data: {
            ...(startDate !== undefined && { startDate: startDate ? new Date(startDate) : null }),
            ...(endDate !== undefined && { endDate: endDate ? new Date(endDate) : null }),
            ...(status && { status }),
            isCurrent: true,
          },
        }),
      ]);
      term = updated;
    } else {
      term = await prisma.term.update({
        where: { id },
        data: {
          ...(startDate !== undefined && { startDate: startDate ? new Date(startDate) : null }),
          ...(endDate !== undefined && { endDate: endDate ? new Date(endDate) : null }),
          ...(status && { status }),
          ...(isCurrent !== undefined && { isCurrent: false }),
        },
      });
    }

    audit(user.id, "UPDATE", "Term", id, term.name, getIP(req));
    return NextResponse.json(term);
  } catch (err) {
    console.error("[structure/terms/:id PATCH]", err);
    return serverError();
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthUser();
  if (!user) return unauthorized();
  if (!hasRole(user, ...ADMIN)) return forbidden();

  const { id } = await params;

  try {
    const existing = await prisma.term.findUnique({ where: { id } });
    if (!existing) return notFound("Term not found");

    // Prevent cascading destruction of grade/attendance records
    const gradeCount = await prisma.grade.count({ where: { termId: id } });
    if (gradeCount > 0) {
      return NextResponse.json(
        { error: `Cannot delete a term that has ${gradeCount} grade record(s). Archive the term instead.` },
        { status: 409 }
      );
    }

    await prisma.term.delete({ where: { id } });
    audit(user.id, "DELETE", "Term", id, existing.name, getIP(req));
    return NextResponse.json({ message: "Term deleted" });
  } catch (err) {
    console.error("[structure/terms/:id DELETE]", err);
    return serverError();
  }
}
