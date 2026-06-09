import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthUser, unauthorized, serverError, hasRole, forbidden, badRequest } from "@/lib/api-auth";

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

export async function POST(req: NextRequest) {
  const user = await getAuthUser();
  if (!user) return unauthorized();
  
  if (!hasRole(user, "DIRECTOR", "PRINCIPAL", "HEAD_TEACHER", "VP_ACADEMICS", "VP_ADMIN")) {
    return forbidden();
  }

  try {
    const body = await req.json();
    const { name, classId, teacherId, departmentId, campus } = body;

    if (!name || !classId || !teacherId) {
      return NextResponse.json({ error: "Name, class, and teacher are required." }, { status: 400 });
    }

    const newSubject = await prisma.subject.create({
      data: {
        name,
        classId,
        teacherId,
        departmentId: departmentId || null,
        campus: campus || user.campus || "PRIMARY",
      },
      include: {
        teacher: { select: { name: true, role: true } },
        class: { select: { name: true } }
      }
    });

    return NextResponse.json({ subject: newSubject });
  } catch (err) {
    console.error("[structure/subjects POST]", err);
    return serverError();
  }
}
