# Admin Access Control Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Supabase Auth 가입 후 `user_id` 기준으로 admin 권한을 부여하고, admin 사용자만 `apps/web`과 관리용 테이블에 접근할 수 있게 만든다.

**Architecture:** `public.admin_users`를 권한 소스로 추가하고, 앱 레벨에서는 공통 admin 판별 헬퍼를 통해 로그인/레이아웃/미들웨어를 보호한다. DB 레벨에서는 RLS를 admin 전용으로 재정의해 우회 접근도 막는다.

**Tech Stack:** Next.js App Router, Supabase SSR, Supabase Postgres RLS, Vitest

---

### Task 1: Add admin access data model

**Files:**
- Create: `supabase/migrations/20260327_admin_access_control.sql`
- Modify: `apps/web/src/lib/types.ts`

- [ ] **Step 1: Write the failing test**

`apps/web/src/lib/auth/admin.test.ts`에서 `admin_users` 조회 결과에 따라 admin 여부가 갈리는 테스트를 추가합니다.

- [ ] **Step 2: Run test to verify it fails**

Run: `cd apps/web && pnpm test -- src/lib/auth/admin.test.ts`
Expected: FAIL because the auth helper does not exist yet.

- [ ] **Step 3: Write minimal implementation**

`admin_users` 타입과 admin 판별 헬퍼를 추가하고 새 마이그레이션으로 테이블과 정책을 정의합니다.

- [ ] **Step 4: Run test to verify it passes**

Run: `cd apps/web && pnpm test -- src/lib/auth/admin.test.ts`
Expected: PASS

### Task 2: Enforce admin-only app access

**Files:**
- Create: `apps/web/src/lib/auth/admin.ts`
- Create: `apps/web/app/(dashboard)/layout.test.tsx`
- Modify: `apps/web/app/(dashboard)/layout.tsx`
- Modify: `apps/web/app/login/page.tsx`
- Modify: `apps/web/app/login/page.test.tsx`
- Modify: `apps/web/middleware.ts`
- Modify: `apps/web/src/lib/supabase/server.ts`

- [ ] **Step 1: Write the failing tests**

비관리자 로그인 사용자가 대시보드 레이아웃에서 차단되고, 로그인 페이지는 admin만 redirect하는 테스트를 추가합니다.

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd apps/web && pnpm test -- app/login/page.test.tsx 'app/(dashboard)/layout.test.tsx'`
Expected: FAIL because admin access checks are not implemented.

- [ ] **Step 3: Write minimal implementation**

공통 admin 접근 상태 확인 헬퍼를 도입하고 레이아웃/로그인/미들웨어를 해당 헬퍼로 보호합니다.

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd apps/web && pnpm test -- app/login/page.test.tsx 'app/(dashboard)/layout.test.tsx'`
Expected: PASS

### Task 3: Document grant flow

**Files:**
- Modify: `apps/web/README.md`

- [ ] **Step 1: Update docs**

가입 후 `admin_users`에 `user_id`를 추가해 권한을 주는 운영 절차와 예시 SQL을 문서화합니다.

- [ ] **Step 2: Verify**

Run: `cd apps/web && pnpm test -- src/lib/auth/admin.test.ts app/login/page.test.tsx 'app/(dashboard)/layout.test.tsx'`
Expected: PASS
