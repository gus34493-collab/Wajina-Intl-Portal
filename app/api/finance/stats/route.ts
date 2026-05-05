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
    const userRole = payload.role as string;
    const userCampus = payload.campus as string;

    const allowedRoles = ["DIRECTOR", "PRINCIPAL", "BURSAR", "ACCOUNTS_OFFICER"];
    if (!allowedRoles.includes(userRole)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const campus = userRole === 'DIRECTOR' ? searchParams.get("campus") : userCampus;

    // Fixed mock metrics for legacy parity or actual Prisma aggregation
    // In a real scenario, this would aggregate invoices/payments
    const summary = {
      paid: 45250000,
      total: 58000000,
      outstanding: 12750000
    };

    return NextResponse.json({ 
       summary,
       campus: campus || 'ALL'
    });
    
  } catch (err: any) {
    console.error("[API Finance Stats] Failure:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
