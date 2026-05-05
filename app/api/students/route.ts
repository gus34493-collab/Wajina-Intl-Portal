import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";
import prisma from "@/lib/prisma";
import { cookies } from "next/headers";
import { withTenantContext } from "@/lib/prisma-extension";

if (!process.env.JWT_SECRET) throw new Error("JWT_SECRET environment variable is not set");
const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET);

export async function GET(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("wajina_token")?.value;

    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { payload } = await jwtVerify(token, JWT_SECRET);
    const userRole = payload.role as string;
    const userCampus = payload.campus as string;

    const { searchParams } = new URL(req.url);
    const query = searchParams.get("query") || "";
    const campus = userRole === 'DIRECTOR' ? searchParams.get("campus") : userCampus;
    const status = searchParams.get("status") || "ACTIVE";

    return await withTenantContext(prisma, { campus, role: userRole }, async () => {
      const students = await prisma.user.findMany({
        where: {
          role: 'STUDENT',
          status: status as any,
          OR: [
            { name: { contains: query, mode: 'insensitive' } },
            { email: { contains: query, mode: 'insensitive' } }
          ]
        },
        take: 50,
        orderBy: { name: 'asc' },
        include: {
          enrolledClass: { select: { name: true } },
          enrolledArm: { select: { fullName: true } }
        }
      });

      return NextResponse.json({ students });
    });
    
  } catch (err: any) {
    console.error("[API Student Search] Failure:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
