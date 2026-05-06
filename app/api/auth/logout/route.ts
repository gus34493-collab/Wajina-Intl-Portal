import { NextRequest, NextResponse } from "next/server";
import { destroySession } from "@/lib/auth";
import { getAuthUser, unauthorized, getIP } from "@/lib/api-auth";
import { audit } from "@/lib/audit";

export async function POST(req: NextRequest) {
  const user = await getAuthUser();
  if (!user) return unauthorized();

  await destroySession();
  audit(user.id, "LOGOUT", "User", user.id, null, getIP(req));
  return NextResponse.json({ message: "Logged out successfully" });
}
