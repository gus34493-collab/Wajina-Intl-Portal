import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthUser, unauthorized, forbidden, serverError } from "@/lib/api-auth";

const FINANCE_ROLES = ["DIRECTOR", "PRINCIPAL", "ACCOUNTS_OFFICER", "BURSAR"];

export async function GET(req: NextRequest) {
  const user = await getAuthUser();
  if (!user) return unauthorized();
  if (!FINANCE_ROLES.includes(user.role as string)) return forbidden();

  try {
    const { searchParams } = new URL(req.url);
    const campus = searchParams.get("campus");
    const classId = searchParams.get("classId");
    const armId = searchParams.get("armId");
    const statusFilter = searchParams.get("status");
    const search = searchParams.get("search");
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
    const limit = Math.min(parseInt(searchParams.get("limit") ?? "50"), 200);
    const skip = (page - 1) * limit;

    const role = user.role as string;
    const effectiveCampus = role !== "DIRECTOR" && user.campus ? (user.campus as string) : campus;

    const currentTerm = await prisma.term.findFirst({
      where: { isCurrent: true },
      select: { id: true, name: true, session: { select: { name: true } } },
    });

    const studentWhere: any = { role: "STUDENT", status: "ACTIVE" };
    if (effectiveCampus) studentWhere.campus = effectiveCampus as any;
    if (classId) studentWhere.classId = classId;
    if (armId) studentWhere.enrolledArmId = armId;
    if (search) {
      studentWhere.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { id: { contains: search } },
      ];
    }

    const paymentInclude = currentTerm
      ? { where: { termId: currentTerm.id }, select: { id: true, reference: true, amount: true, status: true }, orderBy: { createdAt: "desc" as const }, take: 1 }
      : { select: { id: true, reference: true, amount: true, status: true }, orderBy: { createdAt: "desc" as const }, take: 1 };

    const [students, total, allStudents] = await Promise.all([
      prisma.user.findMany({
        where: studentWhere,
        select: {
          id: true, name: true, campus: true,
          enrolledArm: { select: { id: true, label: true, fullName: true, class: { select: { id: true, name: true, campus: true } } } },
          enrolledClass: { select: { id: true, name: true, campus: true } },
          payments: paymentInclude as any,
        },
        orderBy: { name: "asc" },
        skip,
        take: limit,
      }),
      prisma.user.count({ where: studentWhere }),
      prisma.user.findMany({
        where: studentWhere,
        select: { payments: paymentInclude as any },
      }),
    ]);

    const annotate = (s: any) => {
      const latest = s.payments?.[0] ?? null;
      const paid = latest?.status === "SUCCESS" || latest?.status === "APPROVED";
      return {
        id: s.id, name: s.name, campus: s.campus,
        class: s.enrolledClass ?? s.enrolledArm?.class ?? null,
        arm: s.enrolledArm ?? null,
        paymentStatus: paid ? "PAID" : "UNPAID",
        paymentAmount: latest?.amount ?? null,
        paymentReference: latest?.reference ?? null,
      };
    };

    let annotated = students.map(annotate);
    if (statusFilter) annotated = annotated.filter((s) => s.paymentStatus === statusFilter);

    let paidCount = 0;
    let unpaidCount = 0;
    for (const s of allStudents) {
      const p = (s as any).payments?.[0];
      if (p?.status === "SUCCESS" || p?.status === "APPROVED") paidCount++;
      else unpaidCount++;
    }

    return NextResponse.json({
      students: annotated,
      total: statusFilter ? annotated.length : total,
      page, limit,
      currentTerm: currentTerm ? { id: currentTerm.id, name: currentTerm.name, session: (currentTerm as any).session?.name } : null,
      summary: { total: allStudents.length, paid: paidCount, unpaid: unpaidCount },
    });
  } catch (err) {
    console.error("[payments/fee-status GET]", err);
    return serverError();
  }
}
