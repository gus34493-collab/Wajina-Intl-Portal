import { NextRequest, NextResponse } from "next/server";
import { getAuthUser, hasRole, unauthorized, forbidden, serverError } from "@/lib/api-auth";
import { getFinancialSnapshot, getAcademicPulse, getOperationalStats } from "@/lib/analyticsService";

export async function GET(req: NextRequest) {
  const user = await getAuthUser();
  if (!user) return unauthorized();
  if (!hasRole(user, "DIRECTOR", "PRINCIPAL", "VP_ADMIN", "HEAD_TEACHER")) return forbidden();

  try {
    const campus = user.role === "DIRECTOR" ? undefined : user.campus || undefined;
    const [financial, academic, operational] = await Promise.all([
      getFinancialSnapshot(campus),
      getAcademicPulse(campus),
      getOperationalStats(campus),
    ]);
    return NextResponse.json({ financial, academic, operational });
  } catch (err) {
    console.error("[analytics/snapshot GET]", err);
    return serverError();
  }
}
