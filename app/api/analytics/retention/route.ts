import { NextRequest, NextResponse } from "next/server";
import { getAuthUser, hasRole, unauthorized, forbidden, serverError } from "@/lib/api-auth";
import { getRetentionAnalysis } from "@/lib/analyticsService";

export async function GET(_req: NextRequest) {
  const user = await getAuthUser();
  if (!user) return unauthorized();
  if (!hasRole(user, "DIRECTOR", "PRINCIPAL", "VP_ADMIN", "HEAD_TEACHER")) return forbidden();

  try {
    const campus = user.role === "DIRECTOR" ? undefined : user.campus || undefined;
    const retention = await getRetentionAnalysis(campus);
    return NextResponse.json(retention);
  } catch (err) {
    console.error("[analytics/retention GET]", err);
    return serverError();
  }
}
