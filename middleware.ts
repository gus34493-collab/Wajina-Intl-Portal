import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

// Lazily encoded — avoids throwing at module scope during build-time static analysis
let _JWT_SECRET: Uint8Array | null = null;
function getSecret() {
  if (!_JWT_SECRET) {
    if (!process.env.JWT_SECRET) throw new Error("JWT_SECRET is not set.");
    _JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET);
  }
  return _JWT_SECRET;
}

const PROTECTED_ROUTES: Record<string, string[]> = {
  // Executive
  "/director-dashboard": ["DIRECTOR"],
  "/director-finances": ["DIRECTOR"],
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
  "/accounts-officer-finances": ["DIRECTOR", "ACCOUNTS_OFFICER"],
  "/fee-compliance": ["DIRECTOR", "BURSAR", "HEAD_TEACHER", "ASST_HEAD_TEACHER", "ACCOUNTS_OFFICER"],

  // HR
  "/hr-dashboard": ["DIRECTOR", "HR"],

  // Academic
  "/teacher-dashboard": ["DIRECTOR", "PRINCIPAL", "HEAD_TEACHER", "TEACHER", "FORM_TEACHER", "DEAN"],
  "/form-teacher-dashboard": ["DIRECTOR", "PRINCIPAL", "FORM_TEACHER"],
  "/gradebook": ["DIRECTOR", "PRINCIPAL", "HEAD_TEACHER", "TEACHER", "FORM_TEACHER", "DEAN"],
  "/review-grades": ["DIRECTOR", "PRINCIPAL", "VP_ACADEMICS", "HOD", "DEAN"],
  "/academic-performance": ["DIRECTOR", "PRINCIPAL", "HEAD_TEACHER", "VP_ACADEMICS", "VP_ADMIN", "HOD"],
  "/teacher-submissions-review": ["DIRECTOR", "PRINCIPAL", "VP_ACADEMICS", "HEAD_TEACHER", "ASST_HEAD_TEACHER"],
  "/results-approval": ["DIRECTOR", "PRINCIPAL", "HEAD_TEACHER", "ASST_HEAD_TEACHER", "VP_ADMIN", "ACCOUNTS_OFFICER"],

  // Student & Parent
  "/parent-dashboard": ["PARENT", "DIRECTOR"],
  "/parent-requests": ["PARENT"],
  "/student-dashboard": ["STUDENT", "DIRECTOR"],

  // Admin
  "/admissions-dashboard": ["DIRECTOR", "PRINCIPAL", "VP_ACADEMICS", "VP_ADMIN", "HEAD_TEACHER", "ASST_HEAD_TEACHER", "BURSAR"],
  "/staff-directory": ["DIRECTOR", "PRINCIPAL", "VP_ACADEMICS", "VP_ADMIN", "HR", "HOD", "HEAD_TEACHER"],
  "/staff-onboarding": ["DIRECTOR", "VP_ADMIN", "ASST_HEAD_TEACHER", "HR"],
  "/pupil-records": ["DIRECTOR", "PRINCIPAL", "VP_ACADEMICS", "HEAD_TEACHER", "ASST_HEAD_TEACHER", "HR", "HOD", "DEAN"],
  "/session-planner": ["DIRECTOR", "PRINCIPAL", "VP_ADMIN", "HEAD_TEACHER", "ASST_HEAD_TEACHER", "VP_ACADEMICS"],
  "/testimonials": ["DIRECTOR", "PRINCIPAL", "VP_ADMIN", "HEAD_TEACHER", "ASST_HEAD_TEACHER"],

  // Notifications — all authenticated roles; API is self-scoping by role
  "/notifications": ["DIRECTOR","PRINCIPAL","VP_ACADEMICS","VP_ADMIN","HEAD_TEACHER","ASST_HEAD_TEACHER","HOD","DEAN","TEACHER","FORM_TEACHER","BURSAR","ACCOUNTS_OFFICER","HR","PARENT","STUDENT","ADMIN"],

  // Parent-specific pages
  "/parent-payments": ["PARENT", "DIRECTOR"],

  // Student & parent specific
  "/student-previous-results": ["STUDENT", "DIRECTOR"],
  "/student-results-detail": ["STUDENT", "DIRECTOR"],
  "/results": ["DIRECTOR", "PRINCIPAL", "VP_ACADEMICS", "HEAD_TEACHER", "ASST_HEAD_TEACHER"],

  // Unprotected pages now guarded
  "/director-operations": ["DIRECTOR", "BURSAR"],
  "/fee-configuration": ["DIRECTOR"],
  "/parent-relations-dashboard": ["DIRECTOR", "PRINCIPAL", "HEAD_TEACHER", "ASST_HEAD_TEACHER"],
  "/parent-risk-families": ["DIRECTOR", "PRINCIPAL", "DEAN", "HEAD_TEACHER"],
  "/school-config": ["DIRECTOR", "PRINCIPAL", "HEAD_TEACHER"],
  "/school-structure": ["DIRECTOR", "PRINCIPAL", "HEAD_TEACHER", "VP_ADMIN", "BURSAR"],
  "/issue-expense": ["DIRECTOR", "PRINCIPAL", "HEAD_TEACHER", "ASST_HEAD_TEACHER"],
};

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (
    pathname.startsWith("/api/auth") ||
    pathname.startsWith("/api/admissions") ||
    pathname.startsWith("/api/cron") ||
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

  const accessToken = request.cookies.get("wajina_access")?.value;
  const refreshToken = request.cookies.get("wajina_refresh")?.value;

  if (!accessToken && !refreshToken) {
    const url = request.nextUrl.clone();
    url.pathname = "/portal";
    url.searchParams.set("error", "Secure session required. Please sign in.");
    return NextResponse.redirect(url);
  }

  try {
    if (accessToken) {
      const { payload } = await jwtVerify(accessToken, getSecret());
      const userRole = payload.role as string;

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

    const url = request.nextUrl.clone();
    url.pathname = "/portal";
    url.searchParams.set("error", "Session re-authentication required.");
    return NextResponse.redirect(url);

  } catch {
    const url = request.nextUrl.clone();
    url.pathname = "/portal";
    url.searchParams.set("error", "Session integrity failed. Please re-login.");
    return NextResponse.redirect(url);
  }
}

export const config = {
  matcher: [
    "/((?!api/auth|_next/static|_next/image|favicon.ico).*)",
  ],
};
