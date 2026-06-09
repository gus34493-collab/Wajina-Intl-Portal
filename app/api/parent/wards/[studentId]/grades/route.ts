import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthUser, hasRole, unauthorized, forbidden, serverError } from "@/lib/api-auth";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ studentId: string }> }
) {
  const user = await getAuthUser();
  if (!user) return unauthorized();
  if (!hasRole(user, "PARENT")) return forbidden();

  const { studentId } = await params;

  const link = await prisma.studentParent.findFirst({
    where: { studentId, parentId: user.id },
    select: { student: { select: { id: true, name: true } } },
  });
  if (!link) return forbidden("This student is not linked to your account.");
  const ward = link.student;

  try {
    const { searchParams } = new URL(req.url);
    const termId = searchParams.get("termId");
    const sessionId = searchParams.get("sessionId");

    const where: Record<string, unknown> = {
      studentId,
      status: "PRINCIPAL_APPROVED",
      ...(termId && { termId }),
      ...(sessionId && { sessionId }),
    };

    const grades = await prisma.grade.findMany({
      where,
      select: {
        id: true,
        firstCA: true,
        secondCA: true,
        thirdCA: true,
        fourthCA: true,
        fifthCA: true,
        exam: true,
        total: true,
        grade: true,
        position: true,
        teacherComment: true,
        formMasterRemark: true,
        principalRemark: true,
        subject: { select: { id: true, name: true } },
        term: { select: { id: true, name: true, session: { select: { name: true, year: true } } } },
      },
      orderBy: { subject: { name: "asc" } },
    });

    // Fetch student metadata for the results detail page
    const student = await prisma.user.findUnique({
      where: { id: studentId },
      select: {
        id: true,
        name: true,
        campus: true,
        enrolledClass: { select: { name: true, campus: true, category: true } },
        enrolledArm: { select: { fullName: true, class: { select: { name: true, campus: true, category: true } } } },
      },
    });

    const average = grades.length
      ? Math.round((grades.reduce((a, g) => a + g.total, 0) / grades.length) * 10) / 10
      : null;

    return NextResponse.json({
      student: student || { id: ward.id, name: ward.name },
      grades,
      subjectCount: grades.length,
      average,
    });
  } catch (err) {
    console.error("[parent/wards/:studentId/grades GET]", err);
    return serverError();
  }
}
