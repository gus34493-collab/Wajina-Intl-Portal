import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthUser, unauthorized, forbidden, serverError } from "@/lib/api-auth";

const MANAGEMENT = ["DIRECTOR", "PRINCIPAL", "HEAD_TEACHER", "ASST_HEAD_TEACHER", "VP_ADMIN", "VP_ACADEMICS", "HR"];

export async function GET(req: NextRequest) {
  const user = await getAuthUser();
  if (!user) return unauthorized();
  if (!MANAGEMENT.includes(user.role as string)) return forbidden();

  try {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type") ?? "TESTIMONIAL";
    const role = user.role as string;
    const campus = role === "DIRECTOR" ? searchParams.get("campus") : (user.campus as string);
    const campusFilter = campus && campus !== "ALL" ? { student: { campus: campus as any } } : {};

    if (type === "ATTESTATION") {
      const records = await prisma.attestation.findMany({
        take: 50,
        orderBy: { createdAt: "desc" },
        where: campusFilter,
        include: { student: { select: { name: true, enrolledClass: { select: { name: true } } } } },
      });
      return NextResponse.json({ records });
    }

    const records = await prisma.testimonial.findMany({
      take: 50,
      orderBy: { createdAt: "desc" },
      where: campusFilter,
      include: { student: { select: { name: true, enrolledClass: { select: { name: true } } } } },
    });
    return NextResponse.json({ records });
  } catch (err) {
    console.error("[certificates GET]", err);
    return serverError();
  }
}
