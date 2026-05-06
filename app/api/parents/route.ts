import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthUser, unauthorized, forbidden, serverError } from "@/lib/api-auth";

const ALLOWED = ["DIRECTOR", "PRINCIPAL", "HEAD_TEACHER", "VP_ADMIN", "HR", "ADMIN_STAFF"];

export async function GET(req: NextRequest) {
  const user = await getAuthUser();
  if (!user) return unauthorized();
  if (!ALLOWED.includes(user.role as string)) return forbidden();

  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") ?? "";
    const role = user.role as string;
    const campus = role === "DIRECTOR" ? searchParams.get("campus") : (user.campus as string);

    const parents = await prisma.user.findMany({
      where: {
        role: "PARENT",
        ...(campus && campus !== "ALL" && { campus: campus as any }),
        ...(search && { name: { contains: search, mode: "insensitive" } }),
      },
      take: 50,
      orderBy: { name: "asc" },
      select: {
        id: true, name: true, email: true, phone: true, campus: true, status: true,
        children: { select: { student: { select: { id: true, name: true, enrolledArm: { select: { fullName: true } } } } } },
      },
    });

    return NextResponse.json({ parents });
  } catch (err) {
    console.error("[parents GET]", err);
    return serverError();
  }
}
