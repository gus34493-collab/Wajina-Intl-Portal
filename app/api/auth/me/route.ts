import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";
import prisma from "@/lib/prisma";
import { cookies } from "next/headers";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "fallback-secret-for-development-only"
);

export async function GET(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("wajina_token")?.value;

    if (!token) {
      return NextResponse.json({ error: "No session" }, { status: 401 });
    }

    const { payload } = await jwtVerify(token, JWT_SECRET);
    const userId = payload.userId as string;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        campus: true,
        status: true,
        profilePhoto: true,
      },
    });

    if (!user || user.status === "DISABLED") {
      return NextResponse.json({ error: "User unauthorized" }, { status: 401 });
    }

    return NextResponse.json(user);
    
  } catch (err: any) {
    return NextResponse.json({ error: "Invalid session" }, { status: 401 });
  }
}
