import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import {
  getAuthUser,
  hasRole,
  unauthorized,
  forbidden,
  badRequest,
  serverError,
  getIP,
} from "@/lib/api-auth";
import { audit } from "@/lib/audit";

const OPS_LEADERS = [
  "DIRECTOR", "PRINCIPAL", "HEAD_TEACHER", "VP_ADMIN",
  "VP_ACADEMICS", "ASST_HEAD_TEACHER", "DEAN",
] as const;

const ANY_STAFF = [
  ...OPS_LEADERS,
  "TEACHER", "FORM_TEACHER", "HR", "BURSAR", "ACCOUNTS_OFFICER", "ADMIN_STAFF",
] as const;

export async function GET(req: NextRequest) {
  const user = await getAuthUser();
  if (!user) return unauthorized();
  if (!hasRole(user, ...OPS_LEADERS)) return forbidden();

  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const severity = searchParams.get("severity");

    const where: Record<string, unknown> = {};
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if (user.role !== "DIRECTOR" && user.campus) where.campus = user.campus as any;
    if (status) where.status = status;
    if (severity) where.severity = severity;

    const risks = await prisma.operationalRisk.findMany({
      where,
      include: { creator: { select: { name: true, role: true } } },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(risks);
  } catch (err) {
    console.error("[risks GET]", err);
    return serverError();
  }
}

export async function POST(req: NextRequest) {
  const user = await getAuthUser();
  if (!user) return unauthorized();
  if (!hasRole(user, ...ANY_STAFF)) return forbidden();

  try {
    const { title, description, severity, status = "OPEN" } = await req.json();
    const campus = (user.campus || "SECONDARY") as any;

    if (!title || !description || !severity) {
      return badRequest("title, description and severity are required");
    }

    const risk = await prisma.operationalRisk.create({
      data: { title, description, severity, status, campus, createdBy: user.id },
      include: { creator: { select: { name: true } } },
    });

    audit(user.id, "RISK_CREATED", "OperationalRisk", risk.id, `Logged ${severity} risk: ${title}`, getIP(req));

    // Notify campus leaders and all Directors
    const [campusLeaders, directors] = await Promise.all([
      prisma.user.findMany({
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        where: { campus: campus as any, role: { in: ["VP_ADMIN", "PRINCIPAL", "HEAD_TEACHER", "ASST_HEAD_TEACHER"] } },
        select: { id: true },
      }),
      prisma.user.findMany({ where: { role: "DIRECTOR" }, select: { id: true } }),
    ]);

    const notifyIds = Array.from(
      new Set([...campusLeaders.map((u) => u.id), ...directors.map((u) => u.id)])
    );

    if (notifyIds.length > 0) {
      await prisma.request.createMany({
        data: notifyIds.map((receiverId) => ({
          level: severity === "CRITICAL" || severity === "HIGH" ? "K3" : "K2",
          title: `Operational Risk Alert: ${severity}`,
          description: `A new ${severity} risk has been logged: "${title}" by ${user.name}. Campus: ${campus}.`,
          senderId: user.id,
          receiverId,
          status: "PENDING",
        })),
      });
    }

    return NextResponse.json(risk, { status: 201 });
  } catch (err) {
    console.error("[risks POST]", err);
    return serverError();
  }
}
