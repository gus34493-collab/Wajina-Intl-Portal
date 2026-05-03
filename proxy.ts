import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "fallback-secret-for-development-only"
);

// Define protected routes and their required roles
// If role is undefined, it just requires being logged in
const PROTECTED_ROUTES: Record<string, string[]> = {
  "/parent-dashboard": ["PARENT", "DIRECTOR"],
  "/director-dashboard": ["DIRECTOR"],
  "/principal-dashboard": ["PRINCIPAL", "DIRECTOR"],
  "/operations-hub": ["DIRECTOR", "VP_ADMIN", "HEAD_TEACHER"],
  "/academic-performance": ["DIRECTOR", "PRINCIPAL", "HEAD_TEACHER", "VP_ACADEMICS", "VP_ADMIN"],
  "/hr-dashboard": ["DIRECTOR", "HR"],
};

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Skip static assets and public routes
  if (
    pathname.startsWith("/api/auth") ||
    pathname === "/portal" ||
    pathname === "/" ||
    pathname.startsWith("/_next") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  // 2. Check for access token
  const accessToken = request.cookies.get("wajina_access")?.value;
  const refreshToken = request.cookies.get("wajina_refresh")?.value;

  // If no tokens at all, redirect to portal
  if (!accessToken && !refreshToken) {
    const url = request.nextUrl.clone();
    url.pathname = "/portal";
    url.searchParams.set("error", "Secure session required. Please sign in.");
    return NextResponse.redirect(url);
  }

  try {
    // 3. Verify Access Token (if exists)
    if (accessToken) {
      const { payload } = await jwtVerify(accessToken, JWT_SECRET);
      const userRole = payload.role as string;

      // 4. Check RBAC
      const matchedPath = Object.keys(PROTECTED_ROUTES).find((path) =>
        pathname.startsWith(path)
      );

      if (matchedPath) {
        const allowedRoles = PROTECTED_ROUTES[matchedPath];
        if (!allowedRoles.includes(userRole)) {
          const url = request.nextUrl.clone();
          url.pathname = "/portal";
          url.searchParams.set("error", "Access denied: Insufficient privileges.");
          return NextResponse.redirect(url);
        }
      }

      return NextResponse.next();
    }
    
    // 5. If access token missing but refresh exists, 
    // we let the request through if it's NOT an API call, 
    // assuming the client-side will refresh, OR we could refresh here.
    // For simplicity and standard practice, let's redirect if access is dead.
    const url = request.nextUrl.clone();
    url.pathname = "/portal";
    url.searchParams.set("error", "Session re-authentication required.");
    return NextResponse.redirect(url);

  } catch (err) {
    // Token verification failed
    const url = request.nextUrl.clone();
    url.pathname = "/portal";
    url.searchParams.set("error", "Session integrity failed. Please re-login.");
    return NextResponse.redirect(url);
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api/auth (auth routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!api/auth|_next/static|_next/image|favicon.ico).*)",
  ],
};
