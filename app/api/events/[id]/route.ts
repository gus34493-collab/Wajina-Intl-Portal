import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthUser, unauthorized } from "@/lib/api-auth";

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getAuthUser();
  if (!user) return unauthorized();

  try {
    await prisma.schoolEvent.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[events DELETE]", err);
    return NextResponse.json({ error: "Failed to delete event" }, { status: 500 });
  }
}
