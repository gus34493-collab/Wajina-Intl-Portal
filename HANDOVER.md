# Wajina International Portal — Developer Handover

**Date:** 2026-05-18  
**Branch:** `main`  
**Stack:** Next.js 16 App Router · Prisma · Neon PostgreSQL · `jose` JWT · Tailwind CSS  
**Issue count:** 37 total — 6 Critical · 11 High · 11 Medium · 9 Low

---

## 1. Core Principle: Role Isolation

Every role must own its pages. No role should land on a page whose title, header copy, KPIs, or navigation conveys that it belongs to another role.

- Each role has exactly one default dashboard route.
- Shared *data* is acceptable. Shared *pages* are not — campus-scoped clones are preferred.
- `proxy.ts` is the only place that enforces route access. `lib/navigation.ts` is the only place that controls the sidebar. These two files must stay in sync.
- Campus-locked roles (everyone except DIRECTOR) must never see a campus toggle — only a static badge showing their campus.

---

## 2. Role → Page Ownership Matrix

| Role | Default Route | Nav Title | Owns These Pages |
|---|---|---|---|
| DIRECTOR | `/director-dashboard` | Executive Command | director-dashboard, director-finances, director-academics, director-audit-logs, retention-analysis, operations-hub, results-approval, expense-approval, fee-configuration, staff-directory |
| PRINCIPAL | `/principal-dashboard` | Principal Suite | principal-dashboard, review-grades, pupil-records, results-approval, academic-performance, parent-relations-dashboard, teacher-submissions-review, session-planner, admissions-dashboard, staff-directory, testimonials, issue-expense |
| VP_ACADEMICS | `/principal-dashboard` | Academic Admin | principal-dashboard, staff-directory, teacher-submissions-review, pupil-records, review-grades, academic-performance, admissions-dashboard, session-planner |
| VP_ADMIN | `/operations-hub` | Operations Admin | operations-hub, staff-onboarding, staff-directory, admissions-dashboard, session-planner, results-approval, testimonials |
| HOD | `/hod-dashboard` | Department Portal | hod-dashboard, academic-performance, review-grades, pupil-records, staff-directory |
| DEAN | `/dean-dashboard` | Dean Student Affairs | dean-dashboard, review-grades, gradebook, parent-risk-families, teacher-dashboard (attendance view only) |
| HEAD_TEACHER | `/head-teacher-dashboard` | Campus Portal | head-teacher-dashboard, fee-compliance, results-approval, pupil-records, staff-onboarding, teacher-submissions-review, session-planner, parent-relations-dashboard, admissions-dashboard, operations-hub, issue-expense |
| ASST_HEAD_TEACHER | `/head-teacher-dashboard` | Campus Portal | (same as HEAD_TEACHER) |
| HR | `/hr-dashboard` | Human Resources | hr-dashboard, staff-directory, pupil-records, pupil-records?view=parents |
| BURSAR | `/bursar-primary-dashboard` | Bursary Portal | bursar-primary-dashboard, bursar-secondary-dashboard, admissions-dashboard, bursar-dashboard, director-operations, pupil-records, school-structure |
| ACCOUNTS_OFFICER | `/accounts-officer-dashboard` | Financial Control | accounts-officer-dashboard, **accounts-officer-finances**, fee-compliance, results-approval, expense-approval |
| TEACHER | `/teacher-dashboard` | Academic Suite | teacher-dashboard **(no attendance)**, gradebook |
| FORM_TEACHER | `/form-teacher-dashboard` | Form Teacher Suite | form-teacher-dashboard, gradebook, teacher-dashboard (subjects/classes views) |
| PARENT | `/parent-dashboard` | Family Portal | parent-dashboard, **parent-requests** (to be built) |
| STUDENT | `/student-dashboard` | Student Portal | student-dashboard, student-previous-results, student-results-detail |

---

## 3. All 37 Issues — Full Fix Inventory

---

### CRITICAL

---

#### C1 — Hardcoded JWT secret fallback
**Files:** `proxy.ts:5` · `lib/auth.ts:6` · `lib/api-auth.ts:6`

If `JWT_SECRET` is missing from `.env`, all three files silently fall back to the public string `"wajina-international-architecture-2026"`. Anyone who reads this repo can forge session tokens.

**Current (all three files):**
```ts
const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "wajina-international-architecture-2026"
);
```

**Fix (same change in all three files):**
```ts
if (!process.env.JWT_SECRET) {
  throw new Error("JWT_SECRET environment variable is not set. Server cannot start.");
}
const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET);
```

---

#### C2 — Payment callback has no signature verification
**File:** `app/api/payments/callback/route.ts`

Any HTTP request can trigger the payment-confirmed flow by crafting `?status=successful&transaction_id=X`. Flutterwave sends a `verif-hash` header with every webhook — it must be verified before any processing.

**Fix — add at the top of the GET handler:**
```ts
export async function GET(req: NextRequest) {
  const secretHash = process.env.FLW_SECRET_HASH;
  const signature = req.headers.get("verif-hash");
  if (!secretHash || signature !== secretHash) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }
  // ... rest of handler unchanged
}
```

Add `FLW_SECRET_HASH` to `.env` matching the hash you set in your Flutterwave webhook dashboard.

---

#### C3 — Server actions with no authentication
**File:** `app/actions/admissions.ts` — `saveApplicantLead` and `sendExamDetails`

Both functions write to the database with no session check. Any unauthenticated caller can create admission records or trigger emails.

**Fix — add at the top of each action:**
```ts
import { getAuthUser } from "@/lib/api-auth";

export async function saveApplicantLead(data: {...}) {
  const user = await getAuthUser();
  if (!user) throw new Error("Unauthenticated");
  const ALLOWED = ["DIRECTOR","PRINCIPAL","HEAD_TEACHER","ASST_HEAD_TEACHER","VP_ADMIN","VP_ACADEMICS","BURSAR"];
  if (!ALLOWED.includes(user.role)) throw new Error("Forbidden");
  // ... rest unchanged
}

export async function sendExamDetails(admissionId: string) {
  const user = await getAuthUser();
  if (!user) throw new Error("Unauthenticated");
  const ALLOWED = ["DIRECTOR","PRINCIPAL","HEAD_TEACHER","ASST_HEAD_TEACHER","VP_ADMIN","VP_ACADEMICS","BURSAR"];
  if (!ALLOWED.includes(user.role)) throw new Error("Forbidden");
  // ... rest unchanged
}
```

---

#### C4 — IDOR in requests action (caller-supplied senderId)
**File:** `app/actions/requests.ts`

`createInstitutionalRequest` accepts `senderId` and `senderRole` from the caller, meaning any authenticated user can impersonate any other user when creating requests.

**Fix — derive identity from session, never from caller:**
```ts
export async function createInstitutionalRequest(data: {
  title: string;
  details: string;
  amount?: number;
  // senderId / senderRole REMOVED from params
}) {
  const user = await getAuthUser();
  if (!user) throw new Error("Unauthenticated");

  const request = await prisma.request.create({
    data: {
      title: data.title,
      description: data.details,
      level: "K1",
      status: "PENDING",
      senderId: user.id,  // always from session
    },
  });
  revalidatePath("/expense-approval");
  return { success: true, request };
}
```

---

#### C5 — Mass assignment in finance action
**File:** `app/actions/finance.ts:21`

`createPayment` spreads an unfiltered caller-supplied object directly into `prisma.payment.create`. A caller can inject `status: "CONFIRMED"`, override `campus`, or set `studentId` to another student.

**Fix — whitelist every field explicitly:**
```ts
export async function createPayment(
  data: {
    studentId: string;
    amount: number;
    category: string;
    reference: string;
    sessionId: string;
  },
  user: any
) {
  return withTenantContext(prisma, user, async (tx) => {
    const payment = await tx.payment.create({
      data: {
        studentId: data.studentId,
        amount: data.amount,
        category: data.category,
        reference: data.reference,
        sessionId: data.sessionId,
        status: "PENDING",     // never from caller
        campus: user.campus,   // never from caller
      },
    });
    revalidatePath("/fee-compliance");
    return payment;
  });
}
```

---

#### C6 — Prisma serverless misconfiguration
**File:** `lib/prisma.ts`

`@prisma/adapter-pg` is installed in `package.json` but `lib/prisma.ts` instantiates a plain `PrismaClient()` without the adapter. On Neon serverless, this bypasses PgBouncer connection pooling — every request opens a new direct connection, which will exhaust Neon's connection limit under load.

**Fix — wire the pg adapter:**
```ts
import { PrismaClient } from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import { Pool } from "@neondatabase/serverless";

const connectionString = process.env.DATABASE_URL!;

const prismaClientSingleton = () => {
  const pool = new Pool({ connectionString });
  const adapter = new PrismaNeon(pool);
  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development"
      ? [{ level: "query", emit: "event" }, { level: "warn", emit: "stdout" }]
      : [{ level: "warn", emit: "stdout" }],
  });
};

declare global { var prisma: undefined | ReturnType<typeof prismaClientSingleton>; }
const prisma = globalThis.prisma ?? prismaClientSingleton();
export default prisma;
if (process.env.NODE_ENV !== "production") globalThis.prisma = prisma;
```

Also add to `prisma/schema.prisma`:
```prisma
generator client {
  provider        = "prisma-client-js"
  previewFeatures = ["driverAdapters"]
}
```

---

### HIGH

---

#### H1 — GET /api/admissions/config has no auth check
**File:** `app/api/admissions/config/route.ts:5–17`

The GET handler has no `getAuthUser()` call. Entrance fees, cutoff scores, and scholarship thresholds are publicly readable by anyone who can reach the API — including prospective families before admissions open.

**Fix — add auth to the GET handler:**
```ts
export async function GET(req: NextRequest) {
  const user = await getAuthUser();
  if (!user) return unauthorized();
  // ... rest unchanged
}
```

---

#### H2 — accounts-officer-finances page not wired
**File:** `proxy.ts` · `lib/navigation.ts`

The page `app/accounts-officer-finances/page.tsx` exists but has no proxy route entry and is not in the nav. The ACCOUNTS_OFFICER nav was also stripped of Results Attestation and Expense Attestation.

**`proxy.ts` changes:**
```ts
// Add:
"/accounts-officer-finances": ["DIRECTOR", "ACCOUNTS_OFFICER"],
// Update fee-compliance (add ACCOUNTS_OFFICER):
"/fee-compliance": ["DIRECTOR", "BURSAR", "HEAD_TEACHER", "ASST_HEAD_TEACHER", "ACCOUNTS_OFFICER"],
// Remove ACCOUNTS_OFFICER from director-finances:
"/director-finances": ["DIRECTOR"],
```

**`lib/navigation.ts` — full ACCOUNTS_OFFICER section:**
```ts
ACCOUNTS_OFFICER: {
  title: "Financial Control",
  sections: [{
    title: "CORE",
    items: [
      { label: "Overview",            href: "/accounts-officer-dashboard", icon: "fa-house" },
      { label: "Campus Finances",     href: "/accounts-officer-finances",  icon: "fa-chart-pie" },
      { label: "Fee Compliance",      href: "/fee-compliance",             icon: "fa-money-check-dollar" },
      { label: "Results Attestation", href: "/results-approval",           icon: "fa-file-signature" },
      { label: "Expense Attestation", href: "/expense-approval",           icon: "fa-file-invoice-dollar" },
    ],
  }],
},
```

---

#### H3 — REGISTRAR role not removed
**Files:** `proxy.ts:51` · `prisma/schema.prisma` Role enum

REGISTRAR is redundant — BURSAR covers all its responsibilities.

**`proxy.ts`:**
```ts
"/admissions-dashboard": [
  "DIRECTOR","PRINCIPAL","VP_ACADEMICS","VP_ADMIN",
  "HEAD_TEACHER","ASST_HEAD_TEACHER","BURSAR"
  // REGISTRAR removed
],
```

**Prisma migration** (`npx prisma migrate dev --name remove_registrar_role`):
```sql
ALTER TYPE "Role" RENAME TO "Role_old";
CREATE TYPE "Role" AS ENUM (
  'DIRECTOR','PRINCIPAL','VP_ACADEMICS','VP_ADMIN',
  'HOD','DEAN','HEAD_TEACHER','ASST_HEAD_TEACHER',
  'HR','BURSAR','ACCOUNTS_OFFICER',
  'TEACHER','FORM_TEACHER','PARENT','STUDENT','ADMIN'
);
ALTER TABLE "User" ALTER COLUMN "role" TYPE "Role" USING "role"::text::"Role";
DROP TYPE "Role_old";
```

**Seed cleanup:**
```ts
await prisma.user.deleteMany({ where: { role: "REGISTRAR" as any } });
```

---

#### H4 — TEACHER dashboard shows Attendance card
**File:** `app/teacher-dashboard/page.tsx:277–289` and `:325–335`

Regular TEACHER role does not take attendance — that is FORM_TEACHER's job. The page renders an "Attendance" card and an "Attendance Records" Quick Access button unconditionally for all teachers.

**Fix — wrap both blocks:**
```tsx
// The Attendance card (around line 277):
{user?.role === "FORM_TEACHER" && (
  <div className="bg-white rounded-3xl ...">
    {/* attendance card content */}
  </div>
)}

// The Quick Access "Attendance Records" button (around line 325):
{user?.role === "FORM_TEACHER" && (
  <button onClick={() => router.push("/teacher-dashboard?view=attendance")} ...>
    Attendance Records
  </button>
)}
```

---

#### H5 — Director dashboard activity feed ignores campus filter
**File:** `app/api/director/overview/route.ts:81–86`

When the Director switches to "PRIMARY" campus, the KPIs, revenue chart, and admissions all correctly filter by campus — but `recentActivity` (the audit log feed) fetches all logs with no campus filter. The activity panel shows cross-campus events regardless of which campus toggle is selected.

**Fix — add campus scoping to the audit log query:**
```ts
const recentActivity = await prisma.auditLog.findMany({
  where: {
    action: { in: ["CREATE_PAYMENT","ATTENDANCE_BULK_MARK","TIMETABLE_UPDATE","ENROLL_STUDENT","ADMISSION_OFFER_SENT","GRADE_SUBMITTED"] },
    ...(campus && campus !== "ALL" && { actor: { campus: campus as any } }),
  },
  include: { actor: { select: { name: true, role: true, campus: true } } },
  orderBy: { createdAt: "desc" },
  take: 6,
});
```

---

#### H6 — fee-compliance page has no campus lock
**File:** `app/fee-compliance/page.tsx`

The page reads `campus` from `useAuth()` for display labels but never locks non-DIRECTOR users to their campus in the API calls. The fetch calls to `/api/finance/compliance-stats` and `/api/finance/student-compliance-list` send no campus param — they rely entirely on the API to scope by the cookie. Also, ACCOUNTS_OFFICER is not in the proxy allowed list for this route (fixed in H2 above).

**Fix — add campus-lock pattern:**
```tsx
const { user, campus } = useAuth();
const [selectedCampus, setSelectedCampus] = useState<string>("PRIMARY");

useEffect(() => {
  if (user) setSelectedCampus(user.role === "DIRECTOR" ? (selectedCampus || "ALL") : (user.campus || "PRIMARY"));
}, [user?.campus, user?.role]);
```

The API calls already scope by `user.campus` on the server — so this is a UI consistency fix ensuring the displayed label matches the data being shown.

---

#### H7 — teacher-submissions-review has no campus lock
**File:** `app/teacher-submissions-review/page.tsx`

No `useAuth()` call. No campus param in the `/api/requests` fetch. A PRINCIPAL at one campus could see submissions from the other campus if the API doesn't scope correctly.

**Fix — add `useAuth()` and pass campus as a query param:**
```tsx
const { user } = useAuth();

// In fetchRequests:
const campus = user?.role !== "DIRECTOR" ? user?.campus : null;
const url = `/api/requests${campus ? `?campus=${campus}` : ""}`;
const response = await fetch(url);
```

Also add campus scoping to the API route if it doesn't already filter by the authenticated user's campus.

---

#### H8 — Cookie sameSite inconsistency
**Files:** `lib/auth.ts:87,98,107` · `lib/api-auth.ts:116`

`lib/auth.ts` `createSession` sets `sameSite: 'lax'` on all three cookies. `lib/api-auth.ts` `setAuthCookie` sets `sameSite: 'strict'`. Inconsistent policies mean some cookies are CSRF-vulnerable depending on which path issued them.

**Fix — use `strict` everywhere in `lib/auth.ts`:**
```ts
// In createSession, change all three cookieStore.set calls:
sameSite: 'strict',  // was 'lax'
```

---

#### H9 — lib/api-auth.ts signToken issues 7-day access tokens
**File:** `lib/api-auth.ts:108`

`signToken` (a helper distinct from `createSession`) issues tokens with `.setExpirationTime("7d")` — the same expiry as a refresh token. If any code path calls `signToken` + `setAuthCookie`, users get access tokens that stay valid for 7 days instead of the correct 2 hours.

**Fix:**
```ts
export async function signToken(payload: {...}): Promise<string> {
  return new SignJWT(payload as any)
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("2h")  // was "7d" — access tokens must be short-lived
    .sign(JWT_SECRET);
}
```

---

#### H10 — Operations Hub: "Command History" and "Global Config" buttons dead
**File:** `app/operations-hub/page.tsx:62–66`

Both header buttons render with no `onClick` handler.

**Fix:**
```tsx
import { useRouter } from "next/navigation";
const router = useRouter();

// Command History button:
<button onClick={() => router.push("/director-audit-logs")} ...>
  Command History
</button>

// Global Config button:
<button onClick={() => router.push("/school-config")} ...>
  Global Config
</button>
```

---

#### H11 — Operations Hub: 4 QuickAction strip buttons dead
**File:** `app/operations-hub/page.tsx:73–76`

All four rapid-action strip buttons (Onboard Staff, Audit Finances, Welfare Flag, Sync Systems) have no `href` or `onClick`. They look interactive but do nothing.

**Fix — pass route to each:**
```tsx
<QuickAction label="Onboard Staff"  href="/staff-onboarding"    icon={<Users size={18} />} />
<QuickAction label="Audit Finances" href="/director-finances"    icon={<FileText size={18} />} />
<QuickAction label="Welfare Flag"   href="/parent-risk-families" icon={<ShieldAlert size={18} />} />
<QuickAction label="Sync Systems"   href="/operations-hub"       icon={<Activity size={18} />} highlight />
```

Update the `QuickAction` component to accept and use an `href` prop via `router.push`.

---

### MEDIUM

---

#### M1 — Operations Hub: "Load Forensic Data Logs" text button dead
**File:** `app/operations-hub/page.tsx:124`

The text button at the bottom of the terminal feed panel has no `onClick`.

**Fix:**
```tsx
<button
  onClick={() => router.push("/director-audit-logs")}
  className="...">
  Load Forensic Data Logs
</button>
```

---

#### M2 — Operations Hub: "New Requisition" button dead
**File:** `app/operations-hub/page.tsx`

The "New Requisition" button (in the side command column or action area) has no `onClick`.

**Fix:**
```tsx
<button onClick={() => router.push("/issue-expense")} ...>
  New Requisition
</button>
```

---

#### M3 — fee-compliance: "Export Ledger" button dead
**File:** `app/fee-compliance/page.tsx:125–128`

Renders a Download button with no `onClick`. No export API exists.

**Fix — remove until the API is built:**
```tsx
// Remove this button block entirely:
<button className="... Export Ledger ...">
  <Download size={14} />
  Export Ledger
</button>
```

---

#### M4 — fee-compliance: "Audit Report" button dead
**File:** `app/fee-compliance/page.tsx:129–132`

Same as M3 — no API exists for generating an audit report.

**Fix — remove until the API is built.**

---

#### M5 — parent-dashboard: "New Ticket" button dead
**File:** `app/parent-dashboard/page.tsx:164`

The "New Ticket" text button in the Recent Support Tickets section has no `onClick`. Once parent-requests is built (L1 below), wire it there. Until then, remove it.

**Fix — remove for now:**
```tsx
// Remove this button:
<button className="... New Ticket ...">New Ticket</button>
// Replace with:
<span className="text-token-micro font-black text-brand-primary/20 uppercase tracking-widest">
  Requests coming soon
</span>
```

---

#### M6 — student-dashboard bell icon dead (with fake unread badge)
**File:** `app/student-dashboard/page.tsx:67–70`

Bell button has no `onClick`. Worse, it has a hard-coded red unread indicator badge that always shows — a student with no notifications always sees a red dot, which will confuse and mislead them.

**Fix — remove the fake badge, add placeholder onClick:**
```tsx
<button
  onClick={() => {/* notification tray — coming soon */}}
  className="...">
  <Bell size={18} />
  {/* Remove the hardcoded red dot span */}
</button>
```

---

#### M7 — teacher-dashboard bell icon dead
**File:** `app/teacher-dashboard/page.tsx:234–236`

Bell button renders with no `onClick`.

**Fix — add router navigation or remove:**
```tsx
<button onClick={() => {/* notification panel — coming soon */}} ...>
  <Bell size={18} />
</button>
```

---

#### M8 — parent-dashboard bell icon dead
**File:** `app/parent-dashboard/page.tsx:77–80`

Bell button renders with no `onClick`.

**Fix — same as M7.**

---

#### M9 — Operations Hub terminal feed shows hardcoded fake data
**File:** `app/operations-hub/page.tsx:95–121`

The "Real-time Logistics Stream" panel is entirely static — hardcoded times ("09:42 AM", "08:15 AM"), hardcoded content strings, hardcoded PROCESSED/VERIFIED/FINALIZED/OPTIMAL status badges. No API is called. A VP_ADMIN or HEAD_TEACHER looking at this panel will think they're seeing live operational data.

**Fix — either wire to the audit log API or replace with a clear "coming soon" state:**
```tsx
// Option A: fetch real data from /api/director/audit-logs?limit=4
// Option B: replace the entire panel with a placeholder card:
<div className="p-8 flex items-center justify-center text-center">
  <div>
    <Activity size={28} className="mx-auto text-brand-primary/20 mb-3" />
    <p className="text-token-micro font-black text-brand-primary/30 uppercase tracking-widest">
      Live stream coming soon
    </p>
  </div>
</div>
```

---

#### M10 — Hardcoded user avatars
**Files:** `app/teacher-dashboard/page.tsx:237` · `app/parent-dashboard/page.tsx:81`

Teacher dashboard shows `"TC"` and parent dashboard shows `"P"` — neither uses the actual logged-in user's initials.

**Fix — use `useAuth()` to derive real initials:**
```tsx
const { user } = useAuth();
const initials = user?.name
  ? user.name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()
  : "?";

// Replace hardcoded string:
<div ...>{initials}</div>
```

---

#### M11 — No robots.txt
**Location:** `public/` directory (file does not exist)

Without a `robots.txt`, search engine crawlers will attempt to index every page including the portal login and all dashboard routes, which are behind authentication but still crawlable at the URL level.

**Fix — create `public/robots.txt`:**
```
User-agent: *
Disallow: /portal/
Disallow: /director-dashboard/
Disallow: /principal-dashboard/
Disallow: /teacher-dashboard/
Disallow: /parent-dashboard/
Disallow: /student-dashboard/
Disallow: /api/
Allow: /
Allow: /academics/
Allow: /our-story/
Allow: /future/
```

---

### LOW

---

#### L1 — Parent requests/permission UI missing
**Status:** Schema exists (`Request`, `Complaint` models). APIs exist (`/api/requests`, `/api/complaints`). No frontend page.

**Build:** `app/parent-requests/page.tsx`  
**Proxy entry:** `"/parent-requests": ["PARENT"]`  
**Nav entry for PARENT:**
```ts
{ label: "Requests & Permissions", href: "/parent-requests", icon: "fa-paper-plane" }
```

Requirements:
- Request type selector (permission slip, complaint, fee query, general)
- Description textarea
- Submitted requests list with status badges (PENDING / IN_REVIEW / RESOLVED)
- `senderId` always derived from session (never from form)
- PARENT role only — no other role can submit

---

#### L2 — student-dashboard "View Full" link not wired
**File:** `app/student-dashboard/page.tsx`

A "View Full" button or link in the grades section does not navigate to `/student-previous-results`.

**Fix:**
```tsx
<button onClick={() => router.push("/student-previous-results")} ...>
  View Full
</button>
```

---

#### L3 — admissions-dashboard notification bell dead
**File:** `app/admissions-dashboard/page.tsx`

A bell/notification icon button renders with no handler and no notification system exists.

**Fix — remove until a notification system is built.**

---

#### L4 — Director campus toggle doesn't persist into sub-pages
**File:** `app/director-dashboard/page.tsx`

When the Director switches to "PRIMARY" campus on the dashboard and then navigates to `/director-finances` or `/results-approval`, the sub-page resets to ALL. The campus preference is in-component state only.

**Fix — store campus selection in a URL query param or session/cookie so it persists:**
```tsx
// On campus change in director-dashboard:
const params = new URLSearchParams(window.location.search);
params.set("campus", newCampus);
router.replace(`?${params.toString()}`);

// Read on mount:
const campusParam = searchParams.get("campus") || "ALL";
setCampus(campusParam);
```

Or use a lightweight global store (Zustand / React context) that persists across page navigations within the session.

---

#### L5 — No health check endpoint
No `/api/health` route exists. Deployment platforms (Vercel, Railway, Docker) use health endpoints for readiness and liveness probes.

**Fix — create `app/api/health/route.ts`:**
```ts
import { NextResponse } from "next/server";
export async function GET() {
  return NextResponse.json({ status: "ok", timestamp: new Date().toISOString() });
}
```

---

#### L6 — No security headers in next.config.ts
**File:** `next.config.ts`

No `headers()` configuration. The app serves no CSP, no `X-Frame-Options`, no `Referrer-Policy`, no `Permissions-Policy`.

**Fix — add to `next.config.ts`:**
```ts
async headers() {
  return [
    {
      source: "/(.*)",
      headers: [
        { key: "X-Frame-Options", value: "DENY" },
        { key: "X-Content-Type-Options", value: "nosniff" },
        { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        {
          key: "Content-Security-Policy",
          value: [
            "default-src 'self'",
            "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
            "style-src 'self' 'unsafe-inline'",
            "img-src 'self' data: blob: https:",
            "connect-src 'self' https://api.flutterwave.com https://neon.tech",
            "frame-ancestors 'none'",
          ].join("; "),
        },
      ],
    },
  ];
},
```

---

#### L7 — Login has no IP-based rate limiting
**File:** `app/api/auth/login/route.ts`

The login endpoint has per-account lockout after 5 failed attempts — which is good. But it has no per-IP rate limiting. An attacker can enumerate hundreds of accounts (one attempt each) from one IP without triggering any block.

**Fix — add a simple in-memory or Redis-backed IP rate limiter, or use a Vercel/Cloudflare WAF rule.** Minimum viable option using a Map:
```ts
const ipAttempts = new Map<string, { count: number; resetAt: number }>();
const IP_LIMIT = 20;
const IP_WINDOW_MS = 15 * 60 * 1000;

// At top of POST handler:
const ip = getIP(req) ?? "unknown";
const now = Date.now();
const entry = ipAttempts.get(ip);
if (entry && entry.resetAt > now && entry.count >= IP_LIMIT) {
  return NextResponse.json({ error: "Too many requests" }, { status: 429 });
}
ipAttempts.set(ip, { count: (entry?.count ?? 0) + 1, resetAt: entry?.resetAt ?? now + IP_WINDOW_MS });
```

Note: in-memory rate limiting doesn't survive restarts and doesn't work across multiple serverless instances. For production, use Upstash Redis with the `@upstash/ratelimit` package.

---

#### L8 — No error boundaries
No `error.tsx` files exist in major page directories. If an API call fails or a component throws, Next.js renders an unhandled white-screen crash with no recovery option.

**Fix — add `app/error.tsx` as a global fallback, and route-level `error.tsx` files for critical dashboards:**
```tsx
// app/error.tsx
"use client";
export default function GlobalError({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 p-8">
      <h2 className="text-xl font-black text-brand-primary">Something went wrong</h2>
      <p className="text-sm text-brand-primary/50">{error.message}</p>
      <button onClick={reset} className="px-6 py-3 bg-brand-primary text-white rounded-xl font-black text-sm">
        Try again
      </button>
    </div>
  );
}
```

---

#### L9 — Concurrency gaps in 3 server actions
**File:** `app/actions/admissions.ts` · `app/actions/requests.ts`

`saveApplicantLead`, `sendExamDetails`, and `createInstitutionalRequest` write to the database without using `withTenantContext`, meaning they bypass the campus-scoped transaction wrapper. Two staff members submitting simultaneously can create duplicate admission records.

**Fix 1 — wrap in `withTenantContext`:** (once C3 and C4 are fixed and `user` is available from session)
```ts
return withTenantContext(prisma, user, async (tx) => {
  // your prisma calls here using tx instead of prisma
});
```

**Fix 2 — add duplicate guard to `saveApplicantLead`:**
```ts
const existing = await prisma.admission.findFirst({
  where: {
    parentPhone: data.parentPhone,
    applicantName: data.studentName,
    campus: campus,
    status: { not: "REJECTED" },
  },
});
if (existing) return { success: false, error: "An application for this student already exists." };
```

---

## 4. Concurrency Patterns — Multi-User Write Safety

Multiple users share each role simultaneously. Follow these patterns everywhere.

### Never read-then-write for financial state
```ts
// WRONG — two confirmations can race past this check:
const p = await prisma.payment.findUnique({ where: { id } });
if (p.status === "PENDING") {
  await prisma.payment.update({ where: { id }, data: { status: "CONFIRMED" } });
}

// CORRECT — condition lives in the WHERE clause:
const updated = await prisma.payment.updateMany({
  where: { id, status: "PENDING" },
  data: { status: "CONFIRMED", confirmedAt: new Date(), confirmedById: user.id },
});
if (updated.count === 0) return { error: "Payment already processed or not found" };
```

### Grade entry must be idempotent
```ts
await prisma.grade.upsert({
  where: { studentId_subjectId_sessionId: { studentId, subjectId, sessionId } },
  create: { studentId, subjectId, sessionId, score, enteredById: user.id },
  update: { score, updatedById: user.id, updatedAt: new Date() },
});
```

### Cache read-heavy compliance data
```ts
import { unstable_cache } from "next/cache";

const getCachedComplianceStats = unstable_cache(
  async (campus: string, sessionId: string) => { /* prisma query */ },
  ["compliance-stats"],
  { revalidate: 60, tags: ["compliance"] }
);

// After confirming a payment, bust the cache:
import { revalidateTag } from "next/cache";
revalidateTag("compliance");
```

### Use `withTenantContext` for every write action
Every function in `app/actions/` that writes to the database must go through `lib/prisma-extension.ts:withTenantContext`. Currently `getCampusPayments` and `createPayment` do — `saveApplicantLead`, `sendExamDetails`, and `createInstitutionalRequest` do not.

---

## 5. Campus Scoping Rules

Every role except DIRECTOR is locked to one campus. Enforce at the **API layer** — not just the UI.

### Server-side (required in every campus-scoped route):
```ts
const campus = user.role === "DIRECTOR"
  ? new URL(req.url).searchParams.get("campus") ?? null
  : user.campus;  // locked roles always use their own campus

const students = await prisma.user.findMany({
  where: {
    role: "STUDENT",
    ...(campus && campus !== "ALL" && { campus: campus as any }),
  },
});
```

### Client-side (campus toggle lock pattern):
```tsx
const { user } = useAuth();

useEffect(() => {
  if (user && user.role !== "DIRECTOR") {
    setSelectedCampus(user.campus || "PRIMARY");
  }
}, [user?.campus, user?.role]);

{user?.role === "DIRECTOR" ? (
  <CampusToggle value={selectedCampus} onChange={setSelectedCampus} />
) : (
  <div className="...badge...">
    {selectedCampus}
    <CheckCircle size={14} className="text-brand-secondary" />
  </div>
)}
```

**Pages already fixed:** `app/review-grades/page.tsx` · `app/results-approval/page.tsx`  
**Pages still needing it:** `app/fee-compliance/page.tsx` (H6) · `app/teacher-submissions-review/page.tsx` (H7)

---

## 6. In-Progress Work — What Was Partially Done

| File | Status | Outstanding |
|---|---|---|
| `lib/navigation.ts` | Partial | ACCOUNTS_OFFICER needs Campus Finances + 2 attestation items (H2) |
| `app/accounts-officer-finances/page.tsx` | Created | Proxy entry and nav update (H2) |
| `proxy.ts` | Not yet edited | H2 + H3 changes |
| `app/review-grades/page.tsx` | Done | — |
| `app/results-approval/page.tsx` | Done | — |

---

## 7. Environment Variables Required

```env
JWT_SECRET=                      # min 32 random chars — must not be the fallback string
DATABASE_URL=                    # Neon pooled connection string (used by PrismaNeon adapter)
DIRECT_URL=                      # Neon direct (non-pooled) for migrations only
RESEND_API_KEY=                  # Resend email service
FLW_SECRET_KEY=                  # Flutterwave secret key
FLW_SECRET_HASH=                 # Flutterwave webhook verif-hash
NEXT_PUBLIC_FLW_PUBLIC_KEY=      # Flutterwave public key
```

Verify `.gitignore` contains `.env`. The app must throw at cold start if `JWT_SECRET` is missing (C1).

---

## 8. File Reference Map

| Purpose | File |
|---|---|
| Route access control | `proxy.ts` |
| Sidebar navigation | `lib/navigation.ts` |
| Prisma client (needs C6 fix) | `lib/prisma.ts` |
| Session create / destroy / rotate | `lib/auth.ts` |
| API auth helper (`getAuthUser`) | `lib/api-auth.ts` |
| Multi-tenant transaction wrapper | `lib/prisma-extension.ts` |
| Prisma schema | `prisma/schema.prisma` |
| Finance stats API | `app/api/finance/stats/route.ts` |
| Compliance stats API | `app/api/finance/compliance-stats/route.ts` |
| Transactions list API | `app/api/finance/transactions/route.ts` |
| Revenue chart API (DIRECTOR only) | `app/api/finance/revenue-stats/route.ts` |
| Director overview API (H5 bug) | `app/api/director/overview/route.ts` |
| Accounts officer finance page | `app/accounts-officer-finances/page.tsx` |
| Payment callback (C2 fix needed) | `app/api/payments/callback/route.ts` |
| Admissions config (H1 fix needed) | `app/api/admissions/config/route.ts` |
| Admissions server actions (C3) | `app/actions/admissions.ts` |
| Requests server action (C4) | `app/actions/requests.ts` |
| Finance server action (C5) | `app/actions/finance.ts` |
| Login endpoint | `app/api/auth/login/route.ts` |
