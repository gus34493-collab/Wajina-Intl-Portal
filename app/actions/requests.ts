"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { getAuthUser } from "@/lib/api-auth";
import type { Role } from "@prisma/client";

type RequestInput = {
  title: string;
  details: string;
  amount?: number;
  studentId?: string;
};

const CAMPUS_PRINCIPAL: Record<string, Role> = {
  PRIMARY: "HEAD_TEACHER",
  SECONDARY: "PRINCIPAL",
};

async function findCampusPrincipal(campus: string | null) {
  const principalRole: Role = campus ? (CAMPUS_PRINCIPAL[campus] ?? "HEAD_TEACHER") : "HEAD_TEACHER";
  return prisma.user.findFirst({
    where: { role: principalRole, campus: campus as any },
    select: { id: true },
  });
}

async function resolveRoute(
  role: string,
  campus: string | null,
  studentId?: string,
  selfId?: string
): Promise<{ receiverId: string | null; level: "K1" | "K2" | "K3" }> {
  // Parent: route to child's form teacher
  if (role === "PARENT" && studentId) {
    const student = await prisma.user.findUnique({
      where: { id: studentId },
      select: { campus: true, enrolledArm: { select: { teacherId: true } } },
    });
    const formTeacherId = student?.enrolledArm?.teacherId ?? null;
    if (formTeacherId) return { receiverId: formTeacherId, level: "K1" };
    // No form teacher — fall back to campus principal
    const principal = await findCampusPrincipal(student?.campus as string ?? campus);
    return { receiverId: principal?.id ?? null, level: "K1" };
  }

  // Student: route to their own form teacher
  if (role === "STUDENT" && selfId) {
    const me = await prisma.user.findUnique({
      where: { id: selfId },
      select: { enrolledArm: { select: { teacherId: true } } },
    });
    const formTeacherId = me?.enrolledArm?.teacherId ?? null;
    if (formTeacherId) return { receiverId: formTeacherId, level: "K1" };
  }

  // HEAD_TEACHER / PRINCIPAL: route straight to DIRECTOR (K2)
  if (role === "HEAD_TEACHER" || role === "PRINCIPAL") {
    const director = await prisma.user.findFirst({
      where: { role: "DIRECTOR" },
      select: { id: true },
    });
    return { receiverId: director?.id ?? null, level: "K2" };
  }

  // All other staff (teachers, bursar, admissions, HR, VP, etc.): route to campus principal (K1)
  const principal = await findCampusPrincipal(campus);
  return { receiverId: principal?.id ?? null, level: "K1" };
}

export async function createInstitutionalRequest(data: RequestInput) {
  const user = await getAuthUser();
  if (!user) throw new Error("Unauthenticated");

  try {
    const { receiverId, level } = await resolveRoute(
      user.role as string,
      user.campus as string | null,
      data.studentId,
      user.id
    );

    const request = await prisma.request.create({
      data: {
        title: data.title,
        description: data.details,
        level,
        status: "PENDING",
        senderId: user.id,
        receiverId,
        campus: user.campus as any ?? null,
        ...(data.studentId ? { studentId: data.studentId } : {}),
      },
    });

    revalidatePath("/parent-requests");
    return { success: true, request };
  } catch (err: any) {
    console.error("Request creation failed:", err);
    return { success: false, error: err.message };
  }
}
