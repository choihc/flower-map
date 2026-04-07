# Web Platform Consolidation Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Consolidate the user-facing product into the existing Next.js app, move admin functionality under `/admin`, and prepare Toss in-app compatible TDS-based public routes backed by web map infrastructure.

**Architecture:** Keep a single Next.js app in `apps/web`, split public and admin concerns by route and layout, and replace RN-only assumptions with web-first abstractions. Public routes stay unauthenticated, while admin-only authentication and middleware move under the `/admin` prefix.

**Tech Stack:** Next.js App Router, Supabase, TDS web components, Apps-in-Toss web environment, Naver Map Web SDK, Vitest

---

## File Structure

- Modify: `apps/web/app/layout.tsx`
- Create: `apps/web/app/(public)/layout.tsx`
- Create: `apps/web/app/(public)/page.tsx`
- Create: `apps/web/app/(public)/map/page.tsx`
- Create: `apps/web/app/(public)/search/page.tsx`
- Create: `apps/web/app/(public)/spot/[slug]/page.tsx`
- Move/Modify: `apps/web/app/(dashboard)/*` -> `apps/web/app/admin/*`
- Modify: `apps/web/middleware.ts`
- Create: `apps/web/src/features/public/*`
- Create: `apps/web/src/features/map-web/*`
- Create: `apps/web/src/lib/storage/*`
- Test: `apps/web/app/**/*.test.tsx`
- Test: `apps/web/src/**/*.test.ts(x)`

## Chunk 1: Admin Boundary Rework

### Task 1: Move protected routes under `/admin`

**Files:**
- Modify: `apps/web/app/(dashboard)/layout.tsx`
- Modify: `apps/web/app/(dashboard)/page.tsx`
- Modify: `apps/web/app/(dashboard)/flowers/page.tsx`
- Modify: `apps/web/app/(dashboard)/spots/page.tsx`
- Modify: `apps/web/app/(dashboard)/spots/new/page.tsx`
- Modify: `apps/web/app/(dashboard)/spots/[id]/page.tsx`
- Modify: `apps/web/app/(dashboard)/spots/import/page.tsx`
- Modify: `apps/web/app/(dashboard)/settings/page.tsx`

- [ ] **Step 1: Inventory current admin routes**

Run: `rg --files apps/web/app/'(dashboard)'`
Expected: current dashboard routes listed

- [ ] **Step 2: Write or update route tests for `/admin` expectations**

Add coverage that unauthenticated access to `/admin` redirects to `/login`, while `/` remains public.

- [ ] **Step 3: Move admin route files under `app/admin` with minimal layout changes**

Preserve existing dashboard shell and page behavior while changing path ownership only.

- [ ] **Step 4: Run focused tests**

Run: `pnpm --dir apps/web test`
Expected: route-related tests pass or fail only on known migration gaps

- [ ] **Step 5: Commit**

```bash
git add apps/web/app apps/web/middleware.ts
git commit -m "refactor: move admin routes under admin prefix"
```

### Task 2: Re-scope middleware to `/admin`

**Files:**
- Modify: `apps/web/middleware.ts`
- Test: `apps/web/src/lib/auth/*.test.ts`

- [ ] **Step 1: Write failing tests for middleware path protection**

Cover `/admin`, `/admin/settings`, and a public path like `/map`.

- [ ] **Step 2: Run the test to verify failure**

Run: `pnpm --dir apps/web test`
Expected: old protected path assumptions fail

- [ ] **Step 3: Implement minimal middleware rewrite**

Protect only `/admin` and its descendants.

- [ ] **Step 4: Run tests to verify pass**

Run: `pnpm --dir apps/web test`
Expected: middleware expectations pass

- [ ] **Step 5: Commit**

```bash
git add apps/web/middleware.ts apps/web/src/lib/auth
git commit -m "fix: scope admin auth middleware to admin routes"
```

## Chunk 2: Public App Shell

### Task 3: Introduce public route layout

**Files:**
- Modify: `apps/web/app/layout.tsx`
- Create: `apps/web/app/(public)/layout.tsx`
- Create: `apps/web/src/features/public/PublicShell.tsx`
- Test: `apps/web/app/layout.test.tsx`

- [ ] **Step 1: Write failing tests for public layout rendering**

Assert the public shell renders without admin navigation.

- [ ] **Step 2: Run the test to verify failure**

Run: `pnpm --dir apps/web test`
Expected: missing public shell test fails

- [ ] **Step 3: Implement minimal public layout**

Keep the root layout global concerns only and move public chrome into a dedicated shell.

- [ ] **Step 4: Run focused tests**

Run: `pnpm --dir apps/web test`
Expected: layout tests pass

- [ ] **Step 5: Commit**

```bash
git add apps/web/app/layout.tsx apps/web/app/'(public)' apps/web/src/features/public
git commit -m "feat: add public route shell"
```

### Task 4: Re-home existing landing/support/privacy into public structure

**Files:**
- Modify: `apps/web/app/landing/page.tsx`
- Modify: `apps/web/app/support/page.tsx`
- Modify: `apps/web/app/privacy/page.tsx`
- Create: `apps/web/app/(public)/page.tsx`

- [ ] **Step 1: Define target public route ownership**

Decide whether `landing/page.tsx` is moved or merged into root `/`.

- [ ] **Step 2: Write route assertions**

Verify `/`, `/support`, `/privacy` all stay public.

- [ ] **Step 3: Move or merge pages with minimal content change**

Reuse existing public content first, avoid redesign in the routing task.

- [ ] **Step 4: Run tests**

Run: `pnpm --dir apps/web test`
Expected: public routes render under the new shell

- [ ] **Step 5: Commit**

```bash
git add apps/web/app
git commit -m "refactor: organize public routes"
```

## Chunk 3: Public Product Screens

### Task 5: Build public data layer for spots and flowers

**Files:**
- Create: `apps/web/src/lib/data/publicSpots.ts`
- Modify: `apps/web/src/lib/data/spots.ts`
- Modify: `apps/web/src/lib/data/flowers.ts`
- Test: `apps/web/src/lib/data/*.test.ts`

- [ ] **Step 1: Write failing tests for public read-only spot queries**

Cover featured list, slug detail, and public filtering behavior.

- [ ] **Step 2: Run tests to verify failure**

Run: `pnpm --dir apps/web test`
Expected: public query helpers missing

- [ ] **Step 3: Implement minimal read-only query functions**

Expose only the data required for public home, map, search, and detail pages.

- [ ] **Step 4: Run tests**

Run: `pnpm --dir apps/web test`
Expected: data helpers pass

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/lib/data
git commit -m "feat: add public spot query helpers"
```

### Task 6: Add TDS-based public home/search/detail screens

**Files:**
- Create: `apps/web/app/(public)/page.tsx`
- Create: `apps/web/app/(public)/search/page.tsx`
- Create: `apps/web/app/(public)/spot/[slug]/page.tsx`
- Create: `apps/web/src/features/public/components/*`
- Test: `apps/web/app/page.test.tsx`

- [ ] **Step 1: Write failing rendering tests for each public page**

Cover empty/loading/basic render states.

- [ ] **Step 2: Run tests to verify failure**

Run: `pnpm --dir apps/web test`
Expected: missing public screen components fail

- [ ] **Step 3: Implement the minimal TDS-oriented screens**

Use mobile-first layout, route-safe data fetching, and no-login assumptions.

- [ ] **Step 4: Run tests**

Run: `pnpm --dir apps/web test`
Expected: page tests pass

- [ ] **Step 5: Commit**

```bash
git add apps/web/app/'(public)' apps/web/src/features/public
git commit -m "feat: add public product screens"
```

## Chunk 4: Map Migration

### Task 7: Replace RN-only map assumptions with a web map module

**Files:**
- Create: `apps/web/app/(public)/map/page.tsx`
- Create: `apps/web/src/features/map-web/NaverMapWeb.tsx`
- Create: `apps/web/src/features/map-web/SpotMapCarousel.tsx`
- Create: `apps/web/src/lib/map/naverWebSdk.ts`
- Test: `apps/web/src/features/map-web/*.test.tsx`

- [ ] **Step 1: Write failing tests for map page shell and fallback states**

Cover SDK not loaded, no spots, and selected spot behavior.

- [ ] **Step 2: Run tests to verify failure**

Run: `pnpm --dir apps/web test`
Expected: map-web components missing

- [ ] **Step 3: Implement minimal web map wrapper**

Load the Naver Map Web SDK behind a dedicated adapter and keep page logic outside the SDK loader.

- [ ] **Step 4: Implement card-marker synchronization**

Support initial selection, marker click, and detail navigation.

- [ ] **Step 5: Run tests**

Run: `pnpm --dir apps/web test`
Expected: map feature tests pass

- [ ] **Step 6: Commit**

```bash
git add apps/web/app/'(public)'/map apps/web/src/features/map-web apps/web/src/lib/map
git commit -m "feat: add web map experience for public routes"
```

## Chunk 5: Storage Abstraction

### Task 8: Introduce a storage adapter for web and Toss in-app

**Files:**
- Create: `apps/web/src/lib/storage/storage.ts`
- Create: `apps/web/src/lib/storage/browserStorage.ts`
- Create: `apps/web/src/lib/storage/tossStorage.ts`
- Create: `apps/web/src/lib/storage/index.ts`
- Test: `apps/web/src/lib/storage/*.test.ts`

- [ ] **Step 1: Write failing tests for a shared save/remove/list contract**

Define one interface for saved spot IDs.

- [ ] **Step 2: Run tests to verify failure**

Run: `pnpm --dir apps/web test`
Expected: storage adapter missing

- [ ] **Step 3: Implement browser storage adapter**

Use the browser environment as the default public-web implementation.

- [ ] **Step 4: Implement Toss storage adapter stub or integration layer**

Keep framework-specific code isolated from page components.

- [ ] **Step 5: Run tests**

Run: `pnpm --dir apps/web test`
Expected: shared storage contract passes

- [ ] **Step 6: Commit**

```bash
git add apps/web/src/lib/storage
git commit -m "feat: add saved-spot storage abstraction"
```

## Chunk 6: Toss In-App Compatibility Pass

### Task 9: Audit public UI against Toss in-app constraints

**Files:**
- Modify: `apps/web/src/features/public/components/*`
- Modify: `apps/web/src/features/map-web/*`
- Test: `apps/web/app/**/*.test.tsx`

- [ ] **Step 1: Create a checklist for Toss in-app readiness**

Include TDS usage, touch targets, viewport assumptions, and no-login flow.

- [ ] **Step 2: Add targeted tests for the no-login public flow**

Verify saved state actions do not require auth.

- [ ] **Step 3: Implement the minimal compatibility refinements**

Keep changes scoped to interaction and layout behavior only.

- [ ] **Step 4: Run full app tests**

Run: `pnpm --dir apps/web test`
Expected: full test suite passes

- [ ] **Step 5: Run build verification**

Run: `pnpm --dir apps/web build`
Expected: successful production build

- [ ] **Step 6: Commit**

```bash
git add apps/web
git commit -m "chore: align public web with toss in-app constraints"
```

## Chunk 7: Cleanup and Transition

### Task 10: De-scope `apps/toss-mini` from primary product development

**Files:**
- Modify: `README.md`
- Modify: `apps/toss-mini/README.md` or create one if absent
- Modify: relevant docs under `docs/superpowers/`

- [ ] **Step 1: Document the new ownership model**

State that `apps/web` is now the main public web platform.

- [ ] **Step 2: Document `apps/toss-mini` as reference or compatibility workspace**

Avoid deleting it until the new web path is proven.

- [ ] **Step 3: Run doc consistency check**

Run: `rg -n "toss-mini|admin|mobile" README.md apps/web/README.md docs/superpowers`
Expected: docs reflect the new structure

- [ ] **Step 4: Commit**

```bash
git add README.md apps/toss-mini docs/superpowers
git commit -m "docs: update platform ownership after web consolidation"
```

Plan complete and saved to `docs/superpowers/plans/2026-04-07-web-platform-consolidation.md`. Ready to execute?
