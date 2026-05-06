import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthUser, unauthorized, serverError } from "@/lib/api-auth";

export async function GET(req: NextRequest) {
  const user = await getAuthUser();
  if (!user) return unauthorized();

  try {
    const role = user.role as string;
    const campusFilter =
      role === "DIRECTOR"
        ? {}
        : { OR: [{ sender: { campus: user.campus as any } }, { receiverId: user.id }] };

    const [pending, total] = await Promise.all([
      prisma.request.count({ where: { status: "PENDING", ...campusFilter } }),
      prisma.request.count({ where: campusFilter }),
    ]);

    return NextResponse.json({ pending, total });
  } catch (err) {
    console.error("[requests/count GET]", err);
    return serverError();
  }
}
