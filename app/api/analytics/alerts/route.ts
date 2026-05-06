import { NextRequest, NextResponse } from "next/server";
import { getAuthUser, hasRole, unauthorized, forbidden, serverError } from "@/lib/api-auth";
import { getAcademicAlerts } from "@/lib/analyticsService";

export async function GET(_req: NextRequest) {
  const user = await getAuthUser();
  if (!user) return unauthorized();
  if (!hasRole(user, "DIRECTOR", "PRINCIPAL", "VP_ADMIN", "HEAD_TEACHER")) return forbidden();

  try {
    const campus = user.role === "DIRECTOR" ? undefined : user.campus || undefined;
    const alerts = await getAcademicAlerts(campus);
    return NextResponse.json(alerts);
  } catch (err) {
    console.error("[analytics/alerts GET]", err);
    return serverError();
  }
}
