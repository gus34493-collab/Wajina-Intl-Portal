import { NextRequest, NextResponse } from "next/server";
import { getAuthUser, unauthorized } from "@/lib/api-auth";

export async function GET(_req: NextRequest) {
  const user = await getAuthUser();
  if (!user) return unauthorized();

  return NextResponse.json({ publicKey: process.env.VAPID_PUBLIC_KEY || "" });
}
