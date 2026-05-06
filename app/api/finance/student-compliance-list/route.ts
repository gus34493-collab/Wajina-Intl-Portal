import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthUser, unauthorized, forbidden, serverError } from "@/lib/api-auth";

const ALLOWED = ["DIRECTOR", "PRINCIPAL", "HEAD_TEACHER", "ASST_HEAD_TEACHER", "BURSAR", "ACCOUNTS_OFFICER"];

export async function GET(req: NextRequest) {
  const user = await getAuthUser();
  if (!user) return unauthorized();
  if (!ALLOWED.includes(user.role as string)) return forbidden();

  try {
    const role = user.role as string;
    const { searchParams } = new URL(req.url);
    const query = searchParams.get("query") ?? "";
    const campus = role === "DIRECTOR" ? searchParams.get("campus") : (user.campus as string);

    let session = await prisma.academicSession.findFirst({ where: { status: "ACTIVE" } });
    if (!session) session = await prisma.academicSession.findFirst({ orderBy: { year: "desc" } });
    if (!session) return NextResponse.json({ students: [] });

    const students = await prisma.user.findMany({
      where: {
        role: "STUDENT", status: "ACTIVE",
        ...(campus && campus !== "ALL" && { campus: campus as any }),
        ...(query && { name: { contains: query, mode: "insensitive" } }),
      },
      select: {
        id: true, name: true, classId: true, campus: true,
        enrolledClass: { select: { name: true } },
        enrolledArm: { select: { fullName: true } },
        payments: { where: { sessionId: session.id, status: "CONFIRMED", category: "TUITION" }, select: { amount: true } },
      },
      orderBy: { name: "asc" },
      take: 100,
    });

    const feeConfigs = await prisma.feeConfig.findMany({ where: { sessionId: session.id, category: "TUITION" } });

    const result = students.map((s) => {
      const totalPaid = s.payments.reduce((sum, p) => sum + Number(p.amount), 0);
      const config =
        feeConfigs.find((c) => c.classId === s.classId) ||
        feeConfigs.find((c) => c.campus === (s.campus as any) && !c.classId) ||
        feeConfigs.find((c) => !c.campus && !c.classId);
      const expected = config ? Number(config.amount) : 0;
      const status = totalPaid <= 0 ? "UNPAID" : expected > 0 && totalPaid >= expected ? "PAID" : "PART-PAID";
      return { id: s.id, name: s.name, className: s.enrolledClass?.name ?? "N/A", armName: s.enrolledArm?.fullName ?? "N/A", status, paid: totalPaid, expected };
    });

    return NextResponse.json({ students: result, campus: campus ?? "ALL", sessionName: session.name });
  } catch (err) {
    console.error("[finance/student-compliance-list GET]", err);
    return serverError();
  }
}
