import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthUser, unauthorized, forbidden, serverError } from "@/lib/api-auth";

export async function GET(_req: NextRequest) {
  const user = await getAuthUser();
  if (!user) return unauthorized();

  // Allowed for HR, DIRECTOR, PRINCIPAL
  const ALLOWED = ["HR", "DIRECTOR", "PRINCIPAL"];
  if (!ALLOWED.includes(user.role)) return forbidden();

  try {
    const campus = user.campus;

    const [staffCount, studentCount, offerCount, recentActivity] = await Promise.all([
      // Count non-student/parent active staff for the campus
      prisma.user.count({
        where: {
          role: { notIn: ["STUDENT", "PARENT"] },
          status: "ACTIVE",
          campus: campus as any,
        },
      }),
      // Count active students for the campus
      prisma.user.count({
        where: {
          role: "STUDENT",
          status: "ACTIVE",
          campus: campus as any,
        },
      }),
      // Count active admission offers
      prisma.admission.count({
        where: {
          status: "OFFERED",
        },
      }),
      // Last 5 audit logs for HR/Staff activity
      prisma.auditLog.findMany({
        where: {
          campus: campus as any,
          OR: [
            { action: { contains: "ONBOARD" } },
            { action: { contains: "STAFF" } },
            { action: { contains: "OFFBOARD" } },
          ],
        },
        orderBy: { createdAt: "desc" },
        take: 5,
        select: {
          action: true,
          actor: { select: { name: true } },
          createdAt: true,
        },
      }),
    ]);

    // Format audit feed for frontend
    const auditFeed = recentActivity.map(a => {
      const diff = Date.now() - new Date(a.createdAt).getTime();
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const mins = Math.floor(diff / (1000 * 60));
      
      let timestamp = "Just now";
      if (hours > 24) timestamp = new Date(a.createdAt).toLocaleDateString("en-GB");
      else if (hours > 0) timestamp = `${hours}h ago`;
      else if (mins > 0) timestamp = `${mins}m ago`;

      return {
        action: a.action,
        staff: a.actor?.name || "System",
        timestamp,
      };
    });

    return NextResponse.json({
      staffCount,
      studentCount,
      offerCount,
      recentActivity: auditFeed,
    });
  } catch (err) {
    console.error("[hr/dashboard-stats GET]", err);
    return serverError();
  }
}
