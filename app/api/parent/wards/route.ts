import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthUser, hasRole, unauthorized, forbidden, serverError } from "@/lib/api-auth";

export async function GET(_req: NextRequest) {
  const user = await getAuthUser();
  if (!user) return unauthorized();
  if (!hasRole(user, "PARENT")) return forbidden();

  try {
    const links = await prisma.studentParent.findMany({
      where: { parentId: user.id },
      select: {
        student: {
          select: {
            id: true,
            name: true,
            email: true,
            status: true,
            campus: true,
            enrolledArm: { select: { id: true, fullName: true, class: { select: { id: true, name: true } } } },
            enrolledClass: { select: { id: true, name: true } },
          },
        },
      },
      orderBy: { student: { name: "asc" } },
    });
    const wards = links.map((l) => l.student);
    return NextResponse.json({ wards });
  } catch (err) {
    console.error("[parent/wards GET]", err);
    return serverError();
  }
}
