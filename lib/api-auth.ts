import { NextRequest, NextResponse } from "next/server";
import { jwtVerify, SignJWT } from "jose";
import { cookies } from "next/headers";
import prisma from "@/lib/prisma";

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || "fallback-for-build-only");

export type AuthUser = {
  id: string;
  email: string;
  name: string;
  role: string;
  campus: string;
};

/**
 * Verifies the session cookie and returns the authenticated user.
 *
 * Handles both JWT formats in flight during the Express → Next.js migration:
 *   Next.js tokens  (wajina_access):  payload.userId
 *   Express tokens  (wajina_token):   payload.id + payload.tokenVersion
 *
 * Returns null if unauthenticated, disabled, pending, or token version revoked.
 */
export async function getAuthUser(): Promise<AuthUser | null> {
  const cookieStore = await cookies();
  const token =
    cookieStore.get("wajina_access")?.value ??
    cookieStore.get("wajina_token")?.value;

  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    const userId = (payload.userId ?? payload.id) as string | undefined;
    if (!userId) return null;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        campus: true,
        status: true,
        tokenVersion: true,
      },
    });

    if (!user || user.status === "DISABLED" || user.status === "PENDING") {
      return null;
    }

    // tokenVersion is only present in Express-issued tokens — skip check for Next.js tokens
    if (
      payload.tokenVersion !== undefined &&
      user.tokenVersion !== (payload.tokenVersion as number)
    ) {
      return null;
    }

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      campus: user.campus,
    };
  } catch {
    return null;
  }
}

/** Returns true if the user holds at least one of the given roles. */
export function hasRole(user: AuthUser, ...roles: string[]): boolean {
  return roles.includes(user.role);
}

/** Extracts the real client IP, respecting DO's load balancer headers. */
export function getIP(req: NextRequest): string | null {
  return req.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? null;
}

// ── Standard response factories ───────────────────────────────────────────────

export const unauthorized = () =>
  NextResponse.json({ error: "Not authenticated" }, { status: 401 });

export const forbidden = (msg = "Insufficient permissions") =>
  NextResponse.json({ error: msg }, { status: 403 });

export const notFound = (msg = "Not found") =>
  NextResponse.json({ error: msg }, { status: 404 });

export const badRequest = (msg: string) =>
  NextResponse.json({ error: msg }, { status: 400 });

export const serverError = (msg = "Internal server error") =>
  NextResponse.json({ error: msg }, { status: 500 });

// ── Auth cookie helpers ───────────────────────────────────────────────────────

export async function signToken(payload: {
  userId: string; email: string; name: string; role: string; campus: string;
}): Promise<string> {
  return new SignJWT(payload as any)
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("7d")
    .sign(JWT_SECRET);
}

export function setAuthCookie(response: NextResponse, token: string): void {
  response.cookies.set("wajina_access", token, {
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 7 * 24 * 60 * 60,
  });
}

export function clearAuthCookies(response: NextResponse): void {
  response.cookies.set("wajina_access", "", { maxAge: 0, path: "/" });
  response.cookies.set("wajina_token", "", { maxAge: 0, path: "/" });
}
