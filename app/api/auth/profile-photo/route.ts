import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import crypto from "crypto";
import prisma from "@/lib/prisma";
import { getAuthUser, unauthorized, badRequest, serverError } from "@/lib/api-auth";

const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads", "profile-photos");

export async function POST(req: NextRequest) {
  const user = await getAuthUser();
  if (!user) return unauthorized();

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    if (!file) return badRequest("No file uploaded.");

    const buffer = Buffer.from(await file.arrayBuffer());
    const ext = path.extname(file.name) || ".jpg";
    const fileName = `${user.id}-${crypto.randomUUID()}${ext}`;
    const relativePath = `/uploads/profile-photos/${fileName}`;

    await mkdir(UPLOAD_DIR, { recursive: true });
    await writeFile(path.join(UPLOAD_DIR, fileName), buffer);

    const updated = await prisma.user.update({
      where: { id: user.id },
      data: { profilePhoto: relativePath },
      select: { id: true, name: true, email: true, role: true, profilePhoto: true },
    });

    return NextResponse.json({ success: true, profilePhoto: relativePath, user: updated });
  } catch (err) {
    console.error("[auth/profile-photo POST]", err);
    return serverError();
  }
}
