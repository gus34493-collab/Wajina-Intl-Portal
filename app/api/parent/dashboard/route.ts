import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthUser, hasRole, unauthorized, forbidden, serverError } from "@/lib/api-auth";
import { canViewResults } from "@/lib/academic-engine";

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
            campus: true,
            enrolledArm: { select: { fullName: true, class: { select: { name: true } } } },
            enrolledClass: { select: { name: true } },
            payments: { orderBy: { id: "desc" }, take: 1, select: { status: true, amount: true } },
          },
        },
      },
    });
    const wards = links.map((l) => l.student);

    if (!wards.length) return NextResponse.json({ wards: [] });

    const currentTerm = await prisma.term.findFirst({
      where: { isCurrent: true },
      select: { id: true, name: true, session: { select: { name: true } } },
    });

    const summaries = await Promise.all(
      wards.map(async (ward) => {
        const [present, totalAtt, grades, behaviourCount] = await Promise.all([
          prisma.attendance.count({
            where: { studentId: ward.id, status: "PRESENT", ...(currentTerm && { termId: currentTerm.id }) },
          }),
          prisma.attendance.count({
            where: { studentId: ward.id, ...(currentTerm && { termId: currentTerm.id }) },
          }),
          prisma.grade.findMany({
            where: { studentId: ward.id, status: "PRINCIPAL_APPROVED", ...(currentTerm && { termId: currentTerm.id }) },
            select: { total: true },
          }),
          prisma.behaviourRecord.count({
            where: { studentId: ward.id, status: { in: ["OPEN", "IN_REVIEW"] } },
          }),
        ]);

        const attendanceRate = totalAtt > 0 ? Math.round((present / totalAtt) * 100) : null;
        const averageGrade = grades.length > 0
          ? Math.round((grades.reduce((a, g) => a + g.total, 0) / grades.length) * 10) / 10
          : null;

        const latestPayment = ward.payments[0] ?? null;
        const isRestricted = !(await canViewResults(ward.id, currentTerm?.id));

        return {
          id: ward.id,
          name: ward.name,
          campus: ward.campus,
          class: ward.enrolledClass?.name ?? ward.enrolledArm?.class?.name ?? null,
          arm: ward.enrolledArm?.fullName ?? null,
          attendance: { present, total: totalAtt, rate: attendanceRate },
          averageGrade,
          gradeCount: grades.length,
          openBehaviourCount: behaviourCount,
          payment: latestPayment ? { status: latestPayment.status, amount: latestPayment.amount } : null,
          isRestricted,
        };
      })
    );

    return NextResponse.json({
      wards: summaries,
      currentTerm: currentTerm
        ? { id: currentTerm.id, name: currentTerm.name, session: (currentTerm as any).session?.name }
        : null,
    });
  } catch (err) {
    console.error("[parent/dashboard GET]", err);
    return serverError();
  }
}
