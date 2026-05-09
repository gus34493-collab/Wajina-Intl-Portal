import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "fallback-secret-for-development-only"
);

/**
 * Protected routes and their allowed roles.
 * Restored 1:1 from legacy auth-guard.js RBAC mapping.
 */
const PROTECTED_ROUTES: Record<string, string[]> = {
  // Executive
  "/director-dashboard": ["DIRECTOR"],
  "/director-finances": ["DIRECTOR", "ACCOUNTS_OFFICER"],
  "/director-academics": ["DIRECTOR"],
  "/director-audit-logs": ["DIRECTOR"],
  "/retention-analysis": ["DIRECTOR"],
  "/expense-approval": ["DIRECTOR", "ACCOUNTS_OFFICER"],

  // Campus Leadership
  "/principal-dashboard": ["DIRECTOR", "PRINCIPAL", "VP_ACADEMICS"],
  "/head-teacher-dashboard": ["DIRECTOR", "HEAD_TEACHER", "ASST_HEAD_TEACHER"],
  "/operations-hub": ["DIRECTOR", "VP_ADMIN", "HEAD_TEACHER", "ADMIN"],

  // Departmental
  "/hod-dashboard": ["DIRECTOR", "PRINCIPAL", "HOD"],
  "/dean-dashboard": ["DIRECTOR", "PRINCIPAL", "DEAN"],

  // Finance
  "/bursar-primary-dashboard": ["DIRECTOR", "BURSAR"],
  "/bursar-secondary-dashboard": ["DIRECTOR", "BURSAR"],
  "/bursar-dashboard": ["DIRECTOR", "BURSAR"],
  "/accounts-officer-dashboard": ["DIRECTOR", "ACCOUNTS_OFFICER"],
  "/fee-compliance": ["DIRECTOR", "BURSAR", "HEAD_TEACHER", "ASST_HEAD_TEACHER"],

  // HR
  "/hr-dashboard": ["DIRECTOR", "HR"],

  // Academic
  "/teacher-dashboard": ["DIRECTOR", "PRINCIPAL", "HEAD_TEACHER", "TEACHER", "FORM_TEACHER"],
  "/gradebook": ["DIRECTOR", "PRINCIPAL", "HEAD_TEACHER", "TEACHER", "FORM_TEACHER", "DEAN"],
  "/review-grades": ["DIRECTOR", "PRINCIPAL", "VP_ACADEMICS", "HOD", "DEAN"],
  "/academic-performance": ["DIRECTOR", "PRINCIPAL", "HEAD_TEACHER", "VP_ACADEMICS", "VP_ADMIN", "HOD"],
  "/teacher-submissions-review": ["DIRECTOR", "PRINCIPAL", "VP_ACADEMICS", "HEAD_TEACHER", "ASST_HEAD_TEACHER"],
  "/results-approval": ["DIRECTOR", "PRINCIPAL", "HEAD_TEACHER", "ASST_HEAD_TEACHER", "VP_ADMIN", "ACCOUNTS_OFFICER"],

  // Student & Parent
  "/parent-dashboard": ["PARENT", "DIRECTOR"],
  "/student-dashboard": ["STUDENT", "DIRECTOR"],

  // Admin
  "/admissions-dashboard": ["DIRECTOR", "PRINCIPAL", "VP_ACADEMICS", "VP_ADMIN", "HEAD_TEACHER", "ASST_HEAD_TEACHER", "BURSAR", "REGISTRAR"],
  "/staff-directory": ["DIRECTOR", "PRINCIPAL", "VP_ACADEMICS", "VP_ADMIN", "HR", "HOD", "HEAD_TEACHER"],
  "/staff-onboarding": ["DIRECTOR", "VP_ADMIN", "HEAD_TEACHER", "ASST_HEAD_TEACHER"],
  "/pupil-records": ["DIRECTOR", "PRINCIPAL", "VP_ACADEMICS", "HEAD_TEACHER", "ASST_HEAD_TEACHER", "HR", "HOD", "DEAN"],
  "/session-planner": ["DIRECTOR", "PRINCIPAL", "VP_ADMIN", "HEAD_TEACHER", "ASST_HEAD_TEACHER"],
  "/testimonials": ["DIRECTOR", "PRINCIPAL", "VP_ADMIN", "HEAD_TEACHER", "ASST_HEAD_TEACHER"],
};

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Skip static assets and public routes
  if (
    pathname.startsWith("/api/auth") ||
    pathname.startsWith("/api/admissions") ||
    pathname.startsWith("/api/support") ||
    pathname.startsWith("/api/payments") ||
    pathname.replace(/\/$/, "") === "/portal" ||
    pathname === "/" ||
    pathname.startsWith("/academics") ||
    pathname.startsWith("/future") ||
    pathname.startsWith("/our-story") ||
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
          url.searchParams.set("error", "You do not have permission to view this dashboard.");
          return NextResponse.redirect(url);
        }
      }

      return NextResponse.next();
    }
    
    // 5. If access token missing but refresh exists, redirect
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
