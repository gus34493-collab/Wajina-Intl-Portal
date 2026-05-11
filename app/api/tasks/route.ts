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

const MANAGEMENT = ["DIRECTOR", "PRINCIPAL"] as const;

export async function GET(req: NextRequest) {
  const user = await getAuthUser();
  if (!user) return unauthorized();
  if (!hasRole(user, ...MANAGEMENT)) return forbidden();

  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const where = status ? { status: status.toUpperCase() } : {};

    const tasks = await prisma.task.findMany({
      where,
      orderBy: [{ dueDate: "asc" }, { createdAt: "desc" }],
      include: { createdBy: { select: { name: true } } },
    });

    return NextResponse.json({ tasks });
  } catch (err) {
    console.error("[tasks GET]", err);
    return serverError();
  }
}

export async function POST(req: NextRequest) {
  const user = await getAuthUser();
  if (!user) return unauthorized();
  if (!hasRole(user, ...MANAGEMENT)) return forbidden();

  try {
    const { title, owner, dueDate, status, riskLevel, progress, category } =
      await req.json();

    if (!title || !owner) return badRequest("title and owner are required");

    const task = await prisma.task.create({
      data: {
        title: title.trim().slice(0, 200),
        owner: owner.trim().slice(0, 100),
        dueDate: dueDate ? new Date(dueDate) : null,
        status: (status || "ON_TRACK").toUpperCase(),
        riskLevel: (riskLevel || "LOW").toUpperCase(),
        progress: Math.min(100, Math.max(0, parseInt(progress || 0))),
        category: category?.trim().slice(0, 100) || null,
        createdById: user.id,
      },
    });

    audit(user.id, "TASK_CREATED", "Task", task.id, `Title: ${title}`, getIP(req));
    return NextResponse.json({ task }, { status: 201 });
  } catch (err) {
    console.error("[tasks POST]", err);
    return serverError();
  }
}
