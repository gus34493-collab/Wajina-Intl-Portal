import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import prisma from "@/lib/prisma";
import { uploadToSpaces, getPublicUrl } from "@/lib/spaces";
import { getAuthUser, unauthorized, badRequest, serverError } from "@/lib/api-auth";

const ALLOWED_MIME = new Set(["image/jpeg", "image/png", "image/webp"]);
const ALLOWED_EXT = new Set([".jpg", ".jpeg", ".png", ".webp"]);
const MAX_BYTES = 5 * 1024 * 1024; // 5 MB

export async function POST(req: NextRequest) {
  const user = await getAuthUser();
  if (!user) return unauthorized();

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    if (!file) return badRequest("No file uploaded.");

    const ext = file.name.slice(file.name.lastIndexOf(".")).toLowerCase();
    if (!ALLOWED_MIME.has(file.type) || !ALLOWED_EXT.has(ext)) {
      return badRequest("Only JPEG, PNG, and WebP images are accepted.");
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    if (buffer.byteLength > MAX_BYTES) return badRequest("File exceeds the 5 MB limit.");

    const key = `profile-photos/${user.id}-${crypto.randomUUID()}${ext}`;
    await uploadToSpaces(key, buffer, file.type);

    // Store the public CDN URL — the profile-photos prefix must be public-read on DO Spaces.
    const profilePhoto = getPublicUrl(key);

    const updated = await prisma.user.update({
      where: { id: user.id },
      data: { profilePhoto },
      select: { id: true, name: true, email: true, role: true, profilePhoto: true },
    });

    return NextResponse.json({ success: true, profilePhoto, user: updated });
  } catch (err) {
    console.error("[auth/profile-photo POST]", err);
    return serverError();
  }
}
