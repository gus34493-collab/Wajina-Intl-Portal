import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthUser, unauthorized, forbidden, serverError } from "@/lib/api-auth";

const ALLOWED = [
  "DIRECTOR", "PRINCIPAL", "HEAD_TEACHER", "ASST_HEAD_TEACHER",
  "VP_ADMIN", "VP_ACADEMICS", "HR", "ADMIN_STAFF", "FORM_TEACHER", "TEACHER",
];

export async function GET(req: NextRequest) {
  const user = await getAuthUser();
  if (!user) return unauthorized();
  if (!ALLOWED.includes(user.role as string)) return forbidden();

  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get("query") ?? "";
    const status = searchParams.get("status") ?? "ACTIVE";
    const classId = searchParams.get("classId");
    const armId = searchParams.get("armId");
    const role = user.role as string;
    const campus = role === "DIRECTOR" ? searchParams.get("campus") : (user.campus as string);

    const students = await prisma.user.findMany({
      where: {
        role: "STUDENT",
        status: status as any,
        ...(campus && campus !== "ALL" && { campus: campus as any }),
        ...(classId && { classId }),
        ...(armId && { armId }),
        ...(query && {
          OR: [
            { name: { contains: query, mode: "insensitive" } },
            { email: { contains: query, mode: "insensitive" } },
          ],
        }),
      },
      take: 50,
      orderBy: { name: "asc" },
      include: {
        enrolledClass: { select: { name: true } },
        enrolledArm: { select: { fullName: true } },
      },
    });

    return NextResponse.json({ students });
  } catch (err) {
    console.error("[students GET]", err);
    return serverError();
  }
}
