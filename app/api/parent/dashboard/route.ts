import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";
import prisma from "@/lib/prisma";
import { cookies } from "next/headers";

if (!process.env.JWT_SECRET) throw new Error("JWT_SECRET environment variable is not set");
const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET);

export async function GET(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("wajina_token")?.value;

    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { payload } = await jwtVerify(token, JWT_SECRET);
    const userId = payload.userId as string;

    // Fetch Parent with Wards (using existing Prisma schema relations)
    const parent = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        wards: {
          include: {
            enrolledClass: true,
          }
        }
      }
    });

    if (!parent) return NextResponse.json({ error: "User not found" }, { status: 404 });

    // Format the response to match the legacy dashboard's expectation
    // Note: We'll calculate simple stats here or on the frontend
    const wards = parent.wards.map(w => ({
      id: w.id,
      name: w.name,
      campus: w.campus?.toUpperCase() || "PRIMARY",
      class: { name: w.enrolledClass?.name || "N/A" },
      avgGrade: (Math.random() * 2 + 3), // Placeholder until results logic is ported
      attendanceRate: 98, // Placeholder
      hasPaid: true, // Placeholder
    }));

    return NextResponse.json({ wards });
    
  } catch (err: any) {
    console.error("[API Parent Dashboard] Failure:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
