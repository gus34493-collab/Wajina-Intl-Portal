import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import prisma from "@/lib/prisma";
import { getAuthUser, unauthorized, badRequest, serverError, getIP } from "@/lib/api-auth";
import { audit } from "@/lib/audit";

const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads", "profiles");
const MAX_SIZE = 5 * 1024 * 1024; // 5MB

export async function PATCH(req: NextRequest) {
  const user = await getAuthUser();
  if (!user) return unauthorized();

  try {
    const formData = await req.formData();
    const photo = formData.get("photo") as File | null;
    if (!photo) return badRequest("No file uploaded.");
    if (!photo.type.startsWith("image/")) return badRequest("Only images are allowed.");
    if (photo.size > MAX_SIZE) return badRequest("File size must not exceed 5MB.");

    const bytes = await photo.arrayBuffer();
    const ext = path.extname(photo.name) || ".jpg";
    const safeName = `profile-${user.id}-${Date.now()}${ext}`;

    await mkdir(UPLOAD_DIR, { recursive: true });
    await writeFile(path.join(UPLOAD_DIR, safeName), Buffer.from(bytes));

    const photoUrl = `/uploads/profiles/${safeName}`;
    const updated: any = await prisma.user.update({
      where: { id: user.id },
      data: { profilePhoto: photoUrl },
      select: { id: true, name: true, profilePhoto: true },
    });

    audit(user.id, "PROFILE_PHOTO_UPLOAD", "User", user.id, "Uploaded new profile photo", getIP(req));
    return NextResponse.json(updated);
  } catch (err) {
    console.error("[users/profile-photo PATCH]", err);
    return serverError();
  }
}
