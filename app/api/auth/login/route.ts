import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { verifyPassword, createSession } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    if (!user || user.status === "DISABLED") {
      return NextResponse.json(
        { error: "Invalid credentials or account disabled" },
        { status: 401 }
      );
    }

    const passwordMatch = await verifyPassword(password, user.password);
    if (!passwordMatch) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      );
    }

    // Set Access and Refresh Tokens in DB + Cookies
    await createSession(user);

    // Return filtered user object
    const { password: _, ...safeUser } = user;
    return NextResponse.json(safeUser);
    
  } catch (err: any) {
    console.error("Login route error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
