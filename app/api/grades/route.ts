import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthUser, unauthorized, forbidden, serverError } from "@/lib/api-auth";
import { canViewResults } from "@/lib/academic-engine";

const GRADE_SELECT = {
  id: true, firstCA: true, secondCA: true, thirdCA: true, fourthCA: true, fifthCA: true,
  exam: true, total: true, grade: true, position: true,
  formMasterRemark: true, principalRemark: true, teacherComment: true, returnReason: true,
  status: true, campus: true, createdAt: true, updatedAt: true,
  student: { select: { id: true, name: true } },
  subject: { select: { id: true, name: true } },
  term: { select: { id: true, name: true, sessionId: true } },
  session: { select: { id: true, name: true, year: true } },
} as const;

export async function GET(req: NextRequest) {
  const user = await getAuthUser();
  if (!user) return unauthorized();

  try {
    const { searchParams } = new URL(req.url);
    const termId = searchParams.get("termId") ?? undefined;
    const sessionId = searchParams.get("sessionId") ?? undefined;
    const subjectId = searchParams.get("subjectId") ?? undefined;
    const armId = searchParams.get("armId") ?? undefined;
    const status = searchParams.get("status") ?? undefined;
    const skip = parseInt(searchParams.get("skip") ?? "0");
    const take = Math.min(parseInt(searchParams.get("take") ?? "100"), 200);

    const role = user.role as string;
    const MANAGEMENT = ["DIRECTOR", "PRINCIPAL", "HEAD_TEACHER", "ASST_HEAD_TEACHER", "VP_ACADEMICS", "VP_ADMIN"];
    const isManagement = MANAGEMENT.includes(role);

    let where: any = {
      ...(termId && { termId }),
      ...(sessionId && { sessionId }),
      ...(subjectId && { subjectId }),
      ...(status && { status }),
    };

    if (role === "STUDENT") {
      const canView = await canViewResults(user.id, termId);
      if (!canView) {
        return NextResponse.json({ error: "Results are locked until fees are cleared." }, { status: 403 });
      }
      where.studentId = user.id;
      where.status = "PRINCIPAL_APPROVED";

    } else if (role === "PARENT") {
      const studentId = searchParams.get("studentId");
      if (!studentId) return NextResponse.json({ error: "studentId is required for PARENT role." }, { status: 400 });
      const link = await prisma.studentParent.findFirst({ where: { studentId, parentId: user.id } });
      if (!link) return forbidden();
      const canView = await canViewResults(studentId, termId);
      if (!canView) {
        return NextResponse.json({ error: "Results are locked until fees are cleared." }, { status: 403 });
      }
      where.studentId = studentId;
      where.status = "PRINCIPAL_APPROVED";

    } else if (role === "TEACHER" || role === "FORM_TEACHER") {
      const ownedSubjects = await prisma.subject.findMany({
        where: { teacherId: user.id },
        select: { id: true },
      });
      const ownedIds = ownedSubjects.map((s) => s.id);
      where.subjectId = subjectId && ownedIds.includes(subjectId) ? subjectId : { in: ownedIds };

    } else if (!isManagement) {
      return forbidden();
    } else {
      if (role !== "DIRECTOR") {
        where.student = { campus: user.campus as any };
      } else if (searchParams.get("campus")) {
        where.student = { campus: searchParams.get("campus") as any };
      }
      if (armId) {
        where.student = { ...where.student, armId };
      }
    }

    const [grades, total] = await Promise.all([
      prisma.grade.findMany({ where, select: GRADE_SELECT, orderBy: { subject: { name: "asc" } }, skip, take }),
      prisma.grade.count({ where }),
    ]);

    return NextResponse.json({ grades, total });
  } catch (err) {
    console.error("[grades GET]", err);
    return serverError();
  }
}
