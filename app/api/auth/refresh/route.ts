import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { rotateSession } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const refreshToken = cookieStore.get("wajina_refresh")?.value;

    if (!refreshToken) {
      return NextResponse.json(
        { error: "No refresh token provided" },
        { status: 401 }
      );
    }

    try {
      const tokens = await rotateSession(refreshToken);
      return NextResponse.json({ success: true, ...tokens });
    } catch (err: any) {
      // If rotation fails (e.g. invalid or replay detected), clear everything
      console.error("Rotation failure:", err.message);
      
      cookieStore.delete('wajina_access');
      cookieStore.delete('wajina_refresh');
      
      return NextResponse.json(
        { error: err.message || "Session rotation failed" },
        { status: 401 }
      );
    }
    
  } catch (err: any) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
