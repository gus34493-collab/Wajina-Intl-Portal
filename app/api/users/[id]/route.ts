import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthUser, unauthorized, forbidden, badRequest, notFound, serverError, getIP } from "@/lib/api-auth";
import { audit } from "@/lib/audit";

const ADMIN_ROLES = ["DIRECTOR", "PRINCIPAL", "HEAD_TEACHER", "VP_ADMIN", "HR"];

const USER_SELECT = {
  id: true, email: true, name: true, role: true, status: true, phone: true,
  profilePhoto: true, salary: true, joinedAt: true, departmentId: true, campus: true,
  createdAt: true, updatedAt: true,
  enrolledArm: { select: { id: true, fullName: true, class: { select: { name: true, campus: true } } } },
  managedArms: { select: { id: true, fullName: true } },
} as const;

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthUser();
  if (!user) return unauthorized();

  const { id } = await params;
  const isSelf = user.id === id;
  const isAdmin = ADMIN_ROLES.includes(user.role as string);
  if (!isSelf && !isAdmin) return forbidden();

  try {
    const record = await prisma.user.findUnique({ where: { id: id }, select: USER_SELECT as any });
    if (!record) return notFound("User not found.");
    return NextResponse.json(record);
  } catch (err) {
    console.error("[users/[id] GET]", err);
    return serverError();
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthUser();
  if (!user) return unauthorized();

  const isSelf = user.id === (await params).id;
  const isAdmin = ["DIRECTOR", "PRINCIPAL"].includes(user.role as string);
  if (!isSelf && !isAdmin) return forbidden();
  const { id } = await params;

  try {
    const { name, phone, profilePhoto, armId, status, parentId } = await req.json();

    if (profilePhoto !== undefined && profilePhoto !== null && profilePhoto !== "") {
      const isInternal = profilePhoto.startsWith("/uploads/") || /^\/[^/]/.test(profilePhoto);
      let isHttps = false;
      try { isHttps = new URL(profilePhoto).protocol === "https:"; } catch (_) {}
      if (!isInternal && !isHttps) return badRequest("profilePhoto must be a valid internal path or https:// URL.");
    }

    if (isAdmin && parentId) {
      const parentRecord = await prisma.user.findUnique({ where: { id: parentId }, select: { role: true } });
      if (!parentRecord) return badRequest("parentId does not refer to an existing user.");
      if (parentRecord.role !== "PARENT") return badRequest("parentId must refer to a user with role PARENT.");
    }

    const data: any = {
      ...(name && { name: name.trim() }),
      ...(phone !== undefined && { phone: phone ?? null }),
      ...(profilePhoto !== undefined && { profilePhoto: profilePhoto ?? null }),
      ...(isAdmin && armId !== undefined && { armId: armId ?? null }),
      ...(isAdmin && status && { status }),
    };

    if (Object.keys(data).length === 0) return badRequest("No valid fields to update.");

    const updated: any = await prisma.user.update({ where: { id: id }, data, select: USER_SELECT as any });
    audit(user.id, "UPDATE_USER", "User", updated.id, updated.name, getIP(req));
    return NextResponse.json(updated);
  } catch (err) {
    console.error("[users/[id] PATCH]", err);
    return serverError();
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthUser();
  if (!user) return unauthorized();
  if ((user.role as string) !== "DIRECTOR") return forbidden();
  const { id } = await params;
  if (user.id === id) return badRequest("You cannot delete your own account.");

  try {
    const target = await prisma.user.findUnique({ where: { id: id }, select: { name: true } });
    if (!target) return notFound("User not found.");

    await prisma.user.delete({ where: { id: id } });
    audit(user.id, "DELETE_USER", "User", id, target.name, getIP(req));
    return NextResponse.json({ message: "User permanently deleted." });
  } catch (err) {
    console.error("[users/[id] DELETE]", err);
    return serverError();
  }
}
