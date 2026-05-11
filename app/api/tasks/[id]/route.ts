import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import {
  getAuthUser,
  hasRole,
  unauthorized,
  forbidden,
  notFound,
  serverError,
  getIP,
} from "@/lib/api-auth";
import { audit } from "@/lib/audit";

const MANAGEMENT = ["DIRECTOR", "PRINCIPAL"] as const;

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthUser();
  if (!user) return unauthorized();
  if (!hasRole(user, ...MANAGEMENT)) return forbidden();

  const { id } = await params;

  try {
    const existing = await prisma.task.findUnique({ where: { id } });
    if (!existing) return notFound("Task not found");

    const { title, owner, dueDate, status, riskLevel, progress, category } =
      await req.json();

    const updated = await prisma.task.update({
      where: { id },
      data: {
        ...(title && { title: title.trim().slice(0, 200) }),
        ...(owner && { owner: owner.trim().slice(0, 100) }),
        ...(dueDate !== undefined && { dueDate: dueDate ? new Date(dueDate) : null }),
        ...(status && { status: status.toUpperCase() }),
        ...(riskLevel && { riskLevel: riskLevel.toUpperCase() }),
        ...(progress !== undefined && {
          progress: Math.min(100, Math.max(0, parseInt(progress))),
        }),
        ...(category !== undefined && {
          category: category?.trim().slice(0, 100) || null,
        }),
      },
    });

    audit(
      user.id,
      "TASK_UPDATED",
      "Task",
      id,
      `Status: ${status || existing.status}`,
      getIP(req)
    );
    return NextResponse.json({ task: updated });
  } catch (err) {
    console.error("[tasks/:id PATCH]", err);
    return serverError();
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthUser();
  if (!user) return unauthorized();
  if (!hasRole(user, ...MANAGEMENT)) return forbidden();

  const { id } = await params;

  try {
    const existing = await prisma.task.findUnique({ where: { id } });
    if (!existing) return notFound("Task not found");

    await prisma.task.delete({ where: { id } });
    audit(user.id, "TASK_DELETED", "Task", id, `Title: ${existing.title}`, getIP(req));
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[tasks/:id DELETE]", err);
    return serverError();
  }
}
