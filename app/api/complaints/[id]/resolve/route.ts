import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import {
  getAuthUser, unauthorized, forbidden, notFound, serverError, getIP,
} from "@/lib/api-auth";
import { audit } from "@/lib/audit";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthUser();
  if (!user) return unauthorized();

  const { id } = await params;

  try {
    const { response } = await req.json();

    const complaint = await prisma.complaint.findUnique({
      where: { id },
      include: { student: true },
    });
    if (!complaint) return notFound("Complaint not found.");

    if (user.role !== "DIRECTOR" && (complaint.student?.campus as string | null) !== user.campus) {
      return forbidden("Complaint belongs to another campus.");
    }

    const updated = await prisma.complaint.update({
      where: { id },
      data: {
        status: "RESOLVED",
        resolvedBy: user.id,
        response: response || "Resolved by staff",
      },
    });

    audit(user.id, "RESOLVE_COMPLAINT", "Complaint", id, `Resolved by ${user.name} (${user.role})`, getIP(req));
    return NextResponse.json(updated);
  } catch (err) {
    console.error("[complaints/:id/resolve PUT]", err);
    return serverError();
  }
}
