# Handoff: Pre-Flight Audit — `chore/sprint-zero-cleanup`
**Paused:** 2026-05-05  
**Branch:** `chore/sprint-zero-cleanup` (3 commits ahead of `main`)  
**Goal:** Clear 2 blockers → merge to `main` → deploy to DigitalOcean

---

## Status at Pause

| Check | Result |
|---|---|
| Build (`next build`) | PASS |
| Schema (`prisma validate`) | PASS |
| Branch / conflicts | PASS |
| New dependencies | PASS (devOnly) |
| Percy / CI | PASS (no active PR) |
| `.env.example` | FIXED (committed in this session) |
| Migration files | **BLOCKED** |
| JWT_SECRET hardening | **BLOCKED** |

---

## Blocker 1 — Generate Migration Files (MUST DO FIRST)

`prisma/migrations/` is empty. CI uses `prisma migrate deploy` which will fail with no SQL files.

**Requires your dev/staging database to be running.**

```bash
# Make sure .env has DATABASE_URL and DIRECT_URL pointing to dev DB
npx prisma migrate dev --name init

git add prisma/migrations/
git commit -m "chore(db): generate initial Prisma migration"
git push
```

> If this is a brownfield DB (data already exists):
> - Run `npx prisma migrate diff` first to inspect the DDL
> - Add a `StudentParent` back-fill guard in `prisma/seed.ts` to migrate old `parentId` rows

---

## Blocker 2 — Harden JWT_SECRET

27+ API route files use a dangerous fallback:
```ts
// CURRENT (unsafe)
const secret = process.env.JWT_SECRET ?? "fallback-secret-for-development-only";

// REPLACE WITH
const secret = process.env.JWT_SECRET;
if (!secret) throw new Error("JWT_SECRET environment variable is not set");
```

Find all affected files:
```bash
grep -r "fallback-secret" app/api --include="*.ts" -l
```

Fix each one, then:
```bash
git add app/api/
git commit -m "fix(security): hard-fail on missing JWT_SECRET instead of insecure fallback"
git push
```

---

## After Both Blockers Are Cleared

Tell Claude: **"Both blockers are fixed, run the final checks and merge."**

Claude will then:
1. Re-run `prisma validate` and build check
2. Merge PR via `gh pr merge` 
3. Delete local and remote feature branch
4. Deliver DigitalOcean deployment checklist (`prisma migrate deploy` order, env vars to set, etc.)

---

## Environment Variables Checklist (for DigitalOcean)

All of these must be set in the DO App Platform environment:

```
DATABASE_URL          # Pooled (PgBouncer port 6543)
DIRECT_URL            # Direct (port 5432) — Prisma migrate only
JWT_SECRET            # 64-byte random hex
JWT_EXPIRES_IN        # e.g. 8h
RESEND_API_KEY
EMAIL_FROM
APP_URL               # https://your-domain.com
NEXT_PUBLIC_APP_URL   # https://your-domain.com
FLW_SECRET_KEY
FLW_WEBHOOK_HASH
NODE_ENV              # production
PERCY_TOKEN           # GitHub Actions secret — not needed on DO
```
