import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthUser, unauthorized, forbidden, serverError } from "@/lib/api-auth";

const MANAGEMENT = ["DIRECTOR", "PRINCIPAL", "HEAD_TEACHER", "ASST_HEAD_TEACHER", "VP_ADMIN", "VP_ACADEMICS"];

export async function GET(req: NextRequest) {
  const user = await getAuthUser();
  if (!user) return unauthorized();

  const role = user.role as string;
  const isManagement = MANAGEMENT.includes(role);
  const isFormTeacher = role === "FORM_TEACHER";

  if (!isManagement && !isFormTeacher) return forbidden();

  try {
    const { searchParams } = new URL(req.url);
    const skip = parseInt(searchParams.get("skip") ?? "0");
    const take = Math.min(parseInt(searchParams.get("take") ?? "50"), 100);

    let where: any = {};

    if (isFormTeacher) {
      // Form teachers see SUBMITTED grades for arms they manage
      const arms = await prisma.classArm.findMany({ where: { teacherId: user.id }, select: { id: true } });
      where.status = "SUBMITTED";
      where.student = { armId: { in: arms.map((a) => a.id) } };
    } else {
      const campus = role === "DIRECTOR" ? searchParams.get("campus") : (user.campus as string);
      const showAll = searchParams.get("showAll") === "true";
      where.status = showAll ? { in: ["SUBMITTED", "FORM_APPROVED"] } : "FORM_APPROVED";
      if (campus && campus !== "ALL") {
        where.student = { campus: campus as any };
      }
    }

    const [grades, total, pendingCount] = await Promise.all([
      prisma.grade.findMany({
        where,
        skip,
        take,
        orderBy: { updatedAt: "asc" },
        select: {
          id: true, total: true, grade: true, status: true, returnReason: true, updatedAt: true,
          student: { select: { id: true, name: true, enrolledArm: { select: { fullName: true } } } },
          subject: { select: { id: true, name: true } },
          term: { select: { id: true, name: true } },
        },
      }),
      prisma.grade.count({ where }),
      prisma.grade.count({
        where: {
          status: { in: ["SUBMITTED", "FORM_APPROVED"] },
          ...(where.student && { student: where.student }),
        },
      }),
    ]);

    return NextResponse.json({ grades, total, pendingCount });
  } catch (err) {
    console.error("[grades/pending-review GET]", err);
    return serverError();
  }
}
