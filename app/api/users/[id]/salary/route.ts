import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthUser, unauthorized, forbidden, badRequest, notFound, serverError, getIP } from "@/lib/api-auth";
import { audit } from "@/lib/audit";

const DIRECTOR_OR_HR = ["DIRECTOR", "HR"];

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthUser();
  if (!user) return unauthorized();
  if (!DIRECTOR_OR_HR.includes(user.role as string)) return forbidden();
  const { id } = await params;

  try {
    const { salary } = await req.json();
    if (salary === undefined || salary === null) return badRequest("salary is required.");

    const parsedSalary = parseFloat(salary);
    if (isNaN(parsedSalary) || parsedSalary < 0) return badRequest("salary must be a non-negative number.");

    const target = await prisma.user.findUnique({ where: { id: id }, select: { name: true } });
    if (!target) return notFound("User not found.");

    const updated = await prisma.user.update({
      where: { id: id },
      data: { salary: parsedSalary },
      select: { id: true, name: true, salary: true },
    });

    audit(user.id, "SALARY_UPDATE", "User", id, `Salary updated for ${target.name}`, getIP(req));
    return NextResponse.json(updated);
  } catch (err) {
    console.error("[users/[id]/salary PATCH]", err);
    return serverError();
  }
}
