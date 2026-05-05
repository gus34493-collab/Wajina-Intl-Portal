# Wajina International Schools — Management Portal

A secure, multi-tenant school management system built on Next.js 16, Prisma, and PostgreSQL.

---

## Architecture & Tools

### Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router, TypeScript) |
| Database ORM | Prisma 6 + `@prisma/adapter-pg` |
| Styling | Tailwind CSS v4 (CSS-first config) |
| Auth | Custom JWT via `jose`, bcryptjs |
| Email | Resend |
| Animations | Framer Motion 12, GSAP 3 |
| UI Primitives | Base UI, shadcn/ui, Embla Carousel |
| Visual Tests | Percy + Playwright |

---

### W3C Design Token System

All design tokens are declared as CSS custom properties in `app/globals.css` using Tailwind v4's `@theme` block. This makes them available as Tailwind utilities automatically.

**Brand palette** (`--color-brand-*`):

```css
--color-brand-primary:   #3F4739  /* Deep forest green */
--color-brand-secondary: #6AB547  /* Moss green */
--color-brand-accent:    #058ED9  /* Blue */
--color-brand-tertiary:  #E67737  /* Tangerine */
--color-brand-warm-sand: #F0F7EE  /* Off-white background */
```

Use them via Tailwind utilities: `bg-brand-primary`, `text-brand-accent`, `border-brand-secondary`, etc.

**Semantic / surface tokens** (`--color-background`, `--color-foreground`, `--color-border`, `--color-ring`) map to brand values and are used by Tailwind's `bg-background`, `text-foreground`, etc.

---

### Fluid Typography

Typography uses a **Major Third scale** with `clamp()` to comply with WCAG 1.4.4 (max/min ratio ≤ 2.5×). There are two scopes:

**Container scope** — use inside `@container`-aware components (dashboards, cards). Units are `cqi` (container query inline).

```css
--font-size-xs:   clamp(0.64rem,  calc(0.55rem + 0.5cqi),  0.8rem)
--font-size-sm:   clamp(0.8rem,   calc(0.65rem + 0.8cqi),  0.9rem)
--font-size-base: clamp(1rem,     calc(0.8rem  + 1cqi),    1.125rem)
--font-size-h4:   clamp(1.125rem, calc(0.9rem  + 1.2cqi),  1.406rem)
--font-size-h3:   clamp(1.406rem, calc(1.1rem  + 1.5cqi),  1.758rem)
--font-size-h2:   clamp(1.758rem, calc(1.4rem  + 1.8cqi),  2.197rem)
--font-size-h1:   clamp(2.197rem, calc(1.75rem + 2cqi),    2.441rem)
```

**Global scope** — use at `:root`, in hero sections, and landing pages. Units are `svw` (small viewport width).

```css
--font-size-h1-global:      clamp(2.197rem, calc(1.75rem + 2svw),   2.441rem)
--font-size-display-global: clamp(2.441rem, calc(1.95rem + 2.5svw), 3.052rem)
```

Apply via inline style or a CSS utility class — never use arbitrary `text-[Xpx]` values.

```tsx
// Good
<h1 style={{ fontSize: "var(--font-size-h1)" }}>Title</h1>

// Bad — defeats the fluid scale
<h1 className="text-[32px]">Title</h1>
```

---

### Bundle Analysis

To inspect the client-side JavaScript bundle:

```bash
npm run build:analyze
```

This runs `next build` with `ANALYZE=true`, which opens interactive treemap HTML reports in your browser for the client bundle, server bundle, and edge runtime. Reports are saved to `.next/analyze/` (gitignored).

Key packages to watch:
- **framer-motion** and **lucide-react** are configured with `optimizePackageImports` in `next.config.ts` so Next.js tree-shakes them automatically.
- **chart.js** and **gsap** are large — keep them in client-only components with `"use client"` to prevent them shipping to SSR unnecessarily.

---

### Percy Visual Regression Tests

Percy captures full-page snapshots on every pull request and diffs them against the approved baseline.

**Prerequisites:**
1. Create a Percy project at [percy.io](https://percy.io) and copy the token.
2. Set the token in your environment:
   ```bash
   export PERCY_TOKEN=your_token_here
   ```
3. Install Playwright browsers (first time only):
   ```bash
   npx playwright install
   ```

**Run tests locally:**

```bash
npm run test:visual
```

This executes `@percy/cli exec -- playwright test tests/visual/`, which uploads snapshots to Percy for review.

**CI:** The Percy pipeline runs automatically on every pull request via GitHub Actions (`.github/workflows/percy.yml`). Snapshots must be approved in the Percy dashboard before the PR status check turns green.

---

## Development

```bash
npm run dev          # Start dev server at http://localhost:3000
npm run build        # Production build
npm run build:analyze # Production build + bundle treemap
npm run db:migrate   # Run Prisma migrations
npm run db:studio    # Open Prisma Studio
npm run test:visual  # Run Percy visual regression tests
```
