import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthUser, unauthorized, forbidden, serverError } from "@/lib/api-auth";

const FINANCE_ROLES = ["DIRECTOR", "PRINCIPAL", "ACCOUNTS_OFFICER", "BURSAR"];

export async function GET(req: NextRequest) {
  const user = await getAuthUser();
  if (!user) return unauthorized();
  if (!FINANCE_ROLES.includes(user.role as string)) return forbidden();

  try {
    const role = user.role as string;
    const campus = role !== "DIRECTOR" && user.campus
      ? (user.campus as string)
      : new URL(req.url).searchParams.get("campus");

    const currentTerm = await prisma.term.findFirst({ where: { isCurrent: true }, select: { id: true } });

    const students = await prisma.user.findMany({
      where: { role: "STUDENT", status: "ACTIVE", ...(campus && campus !== "ALL" && { campus: campus as any }) },
      select: {
        id: true,
        enrolledArm: { select: { id: true, label: true, fullName: true, class: { select: { id: true, name: true } } } },
        enrolledClass: { select: { id: true, name: true } },
        payments: currentTerm
          ? { where: { termId: currentTerm.id }, select: { status: true }, take: 1 }
          : { select: { status: true }, take: 1 },
      },
    });

    const classMap: Record<string, any> = {};
    for (const s of students) {
      const cls = (s as any).enrolledClass ?? (s as any).enrolledArm?.class;
      const arm = (s as any).enrolledArm;
      if (!cls) continue;

      if (!classMap[cls.id]) classMap[cls.id] = { id: cls.id, name: cls.name, arms: {}, paid: 0, unpaid: 0 };
      const paid = (s as any).payments?.[0]?.status === "SUCCESS" || (s as any).payments?.[0]?.status === "APPROVED";
      if (paid) classMap[cls.id].paid++;
      else classMap[cls.id].unpaid++;

      if (arm) {
        if (!classMap[cls.id].arms[arm.id]) {
          classMap[cls.id].arms[arm.id] = { id: arm.id, name: arm.label, fullName: arm.fullName, paid: 0, unpaid: 0 };
        }
        if (paid) classMap[cls.id].arms[arm.id].paid++;
        else classMap[cls.id].arms[arm.id].unpaid++;
      }
    }

    const classes = Object.values(classMap)
      .map((c: any) => ({ ...c, arms: Object.values(c.arms) }))
      .sort((a, b) => a.name.localeCompare(b.name));

    return NextResponse.json({ classes });
  } catch (err) {
    console.error("[payments/fee-status/by-class GET]", err);
    return serverError();
  }
}
