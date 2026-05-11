import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import {
  getAuthUser, hasRole, unauthorized, forbidden, notFound, serverError,
} from "@/lib/api-auth";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ armId: string }> }
) {
  const user = await getAuthUser();
  if (!user) return unauthorized();
  if (!hasRole(user, "DIRECTOR", "PRINCIPAL", "TEACHER", "FORM_TEACHER")) return forbidden();

  const { armId } = await params;

  try {
    if (user.role !== "DIRECTOR" && user.campus) {
      const check = await prisma.classArm.findUnique({
        where: { id: armId },
        select: { class: { select: { campus: true } } },
      });
      if (check && (check.class.campus as string) !== user.campus) {
        return forbidden("This arm belongs to another campus.");
      }
    }

    const arm = await prisma.classArm.findUnique({
      where: { id: armId },
      include: {
        students: { where: { status: "ACTIVE" }, select: { id: true, name: true }, orderBy: { name: "asc" } },
      },
    });
    if (!arm) return notFound("Arm not found.");

    if ((user.role === "TEACHER" || user.role === "FORM_TEACHER") && arm.teacherId !== user.id) {
      return forbidden("Not your arm.");
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const existing = await prisma.attendance.findMany({
      where: { armId, date: today },
      select: { studentId: true, status: true, note: true },
    });

    const markedMap: Record<string, { status: string; note: string | null }> = {};
    for (const r of existing) markedMap[r.studentId] = { status: r.status, note: r.note };

    const students = arm.students.map((s) => ({
      ...s,
      marked: !!markedMap[s.id],
      status: markedMap[s.id]?.status ?? null,
      note: markedMap[s.id]?.note ?? null,
    }));

    return NextResponse.json({
      arm: { id: arm.id, fullName: arm.fullName },
      date: today.toISOString().split("T")[0],
      students,
    });
  } catch (err) {
    console.error("[attendance/today/:armId GET]", err);
    return serverError();
  }
}
