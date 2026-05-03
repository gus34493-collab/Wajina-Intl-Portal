import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";
import prisma from "@/lib/prisma";
import { cookies } from "next/headers";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "fallback-secret-for-development-only"
);

export async function PATCH(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("wajina_access")?.value || cookieStore.get("wajina_token")?.value;

    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { payload } = await jwtVerify(token, JWT_SECRET);
    const userRole = payload.role as string;
    const userCampus = payload.campus as string;

    // Permissions: Only Leadership can manage staff
    const allowedRoles = ["DIRECTOR", "PRINCIPAL", "HEAD_TEACHER", "HR"];
    if (!allowedRoles.includes(userRole)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { userId, status, role } = await req.json();

    if (!userId) {
      return NextResponse.json({ error: "Target userId is required" }, { status: 400 });
    }

    // 1. Fetch target user to check campus-lock
    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { campus: true, role: true }
    });

    if (!targetUser) {
      return NextResponse.json({ error: "Target user not found" }, { status: 404 });
    }

    // 2. Campus Lock Enforcement (Directors are exempt)
    if (userRole !== 'DIRECTOR' && targetUser.campus !== userCampus) {
      return NextResponse.json({ error: "Unauthorized: You can only manage staff on your own campus" }, { status: 403 });
    }

    // 3. Update User
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(status && { status: status as any }),
        ...(role && { role: role as any }),
      },
      select: { id: true, name: true, role: true, status: true }
    });

    return NextResponse.json({ 
      success: true, 
      message: `Staff member ${updatedUser.name} updated successfully`,
      user: updatedUser
    });
    
  } catch (err: any) {
    console.error("[API Admin Actions] Failure:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
