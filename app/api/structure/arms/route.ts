import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import {
  getAuthUser,
  hasRole,
  unauthorized,
  forbidden,
  badRequest,
  notFound,
  serverError,
  getIP,
} from "@/lib/api-auth";
import { audit } from "@/lib/audit";

const ADMIN = ["DIRECTOR", "PRINCIPAL", "HEAD_TEACHER", "VP_ADMIN"] as const;

export async function GET(req: NextRequest) {
  const user = await getAuthUser();
  if (!user) return unauthorized();

  try {
    const { searchParams } = new URL(req.url);
    const classId = searchParams.get("classId");

    const arms = await prisma.classArm.findMany({
      where: classId ? { classId } : undefined,
      orderBy: [{ class: { displayOrder: "asc" } }, { label: "asc" }],
      include: {
        class: { select: { name: true, campus: true } },
        teacher: { select: { id: true, name: true } },
        _count: { select: { students: true } },
      },
    });

    return NextResponse.json(arms);
  } catch (err) {
    console.error("[structure/arms GET]", err);
    return serverError();
  }
}

export async function POST(req: NextRequest) {
  const user = await getAuthUser();
  if (!user) return unauthorized();
  if (!hasRole(user, ...ADMIN)) return forbidden();

  try {
    const { classId, label, teacherId, capacity } = await req.json();
    if (!classId || !label) return badRequest("classId and label are required");

    const cls = await prisma.class.findUnique({
      where: { id: classId },
      select: { name: true },
    });
    if (!cls) return notFound("Class not found");

    const arm = await prisma.classArm.create({
      data: {
        classId,
        label: label.trim().toUpperCase(),
        fullName: `${cls.name} ${label.trim().toUpperCase()}`,
        teacherId: teacherId || null,
        capacity: capacity ? parseInt(capacity) : null,
      },
      include: {
        class: { select: { name: true, campus: true } },
        teacher: { select: { id: true, name: true } },
        _count: { select: { students: true } },
      },
    });

    audit(user.id, "CREATE", "ClassArm", arm.id, arm.fullName, getIP(req));
    return NextResponse.json(arm, { status: 201 });
  } catch (err) {
    console.error("[structure/arms POST]", err);
    return serverError();
  }
}
