import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";
import prisma from "@/lib/prisma";
import { cookies } from "next/headers";
import { withTenantContext } from "@/lib/prisma-extension";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "fallback-secret-for-development-only"
);

export async function GET(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("wajina_token")?.value;

    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { payload } = await jwtVerify(token, JWT_SECRET);
    const userRole = payload.role as string;
    const userCampus = payload.campus as string;

    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type") || "TESTIMONIAL";
    const campus = userRole === 'DIRECTOR' ? searchParams.get("campus") : userCampus;

    return await withTenantContext(prisma, { campus, role: userRole }, async () => {
       if (type === "ATTESTATION") {
         const records = await prisma.attestation.findMany({
            take: 50,
            orderBy: { createdAt: 'desc' },
            include: { student: { select: { name: true, enrolledClass: { select: { name: true } } } } }
         });
         return NextResponse.json({ records });
       } else {
         const records = await prisma.testimonial.findMany({
            take: 50,
            orderBy: { createdAt: 'desc' },
            include: { student: { select: { name: true, enrolledClass: { select: { name: true } } } } }
         });
         return NextResponse.json({ records });
       }
    });
    
  } catch (err: any) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
