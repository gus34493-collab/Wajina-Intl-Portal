import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthUser, unauthorized, serverError } from "@/lib/api-auth";

export async function GET(req: NextRequest) {
  const user = await getAuthUser();
  if (!user) return unauthorized();

  try {
    const { searchParams } = new URL(req.url);
    const teacherId = searchParams.get("teacherId");
    const classId = searchParams.get("classId");

    const where: Record<string, unknown> = {};
    if (classId) where.classId = classId;

    if (teacherId) {
      where.teacherId = teacherId;
    } else if (["TEACHER", "ACADEMIC_STAFF"].includes(user.role)) {
      where.teacherId = user.id;
    }

    const subjects = await prisma.subject.findMany({
      where,
      orderBy: { name: "asc" },
      include: {
        class: { select: { id: true, name: true, campus: true, category: true } },
      },
    });

    return NextResponse.json({ subjects });
  } catch (err) {
    console.error("[structure/subjects GET]", err);
    return serverError();
  }
}
