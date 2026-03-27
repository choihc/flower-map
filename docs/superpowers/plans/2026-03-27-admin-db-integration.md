# Admin DB Integration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the first working admin app, Supabase schema, JSON import flow, and mobile data layer needed to replace mock flower spot data with managed database records.

**Architecture:** Add a standalone Next.js admin app under `apps/admin`, keep operational data normalized in Supabase with `flowers` and `spots`, validate JSON imports with Zod before writing to the database, and expose a small mobile-side repository/mapper layer that converts published DB rows into the existing UI shape. Keep draft/published enforcement in the admin and in the mobile query layer.

**Tech Stack:** Next.js App Router, React 19, TypeScript, Supabase Auth/Postgres, Zod, Vercel Blob, Vitest, Expo Router

---

## File Map

- Create: `apps/admin/package.json`
- Create: `apps/admin/tsconfig.json`
- Create: `apps/admin/next.config.ts`
- Create: `apps/admin/.gitignore`
- Create: `apps/admin/app/layout.tsx`
- Create: `apps/admin/app/page.tsx`
- Create: `apps/admin/app/login/page.tsx`
- Create: `apps/admin/app/(dashboard)/layout.tsx`
- Create: `apps/admin/app/(dashboard)/flowers/page.tsx`
- Create: `apps/admin/app/(dashboard)/spots/page.tsx`
- Create: `apps/admin/app/(dashboard)/spots/import/page.tsx`
- Create: `apps/admin/app/api/upload/route.ts`
- Create: `apps/admin/middleware.ts`
- Create: `apps/admin/vitest.config.ts`
- Create: `apps/admin/src/test/setup.ts`
- Create: `apps/admin/src/features/auth/LoginForm.tsx`
- Create: `apps/admin/src/features/dashboard/DashboardShell.tsx`
- Create: `apps/admin/src/features/flowers/flowerSchema.ts`
- Create: `apps/admin/src/features/flowers/flowerSchema.test.ts`
- Create: `apps/admin/src/features/spots/spotSchema.ts`
- Create: `apps/admin/src/features/spots/spotSchema.test.ts`
- Create: `apps/admin/src/features/import/importSchema.ts`
- Create: `apps/admin/src/features/import/importSchema.test.ts`
- Create: `apps/admin/src/features/import/classifyImport.ts`
- Create: `apps/admin/src/features/import/classifyImport.test.ts`
- Create: `apps/admin/src/features/import/ImportConsole.tsx`
- Create: `apps/admin/src/features/spots/SpotForm.tsx`
- Create: `apps/admin/src/features/flowers/FlowerForm.tsx`
- Create: `apps/admin/src/lib/env.ts`
- Create: `apps/admin/src/lib/supabase/browser.ts`
- Create: `apps/admin/src/lib/supabase/server.ts`
- Create: `apps/admin/src/lib/supabase/admin.ts`
- Create: `apps/admin/src/lib/blob/uploadImage.ts`
- Create: `apps/admin/src/lib/data/flowers.ts`
- Create: `apps/admin/src/lib/data/spots.ts`
- Create: `apps/admin/src/lib/types.ts`
- Create: `supabase/migrations/20260327_admin_schema.sql`
- Create: `apps/mobile/src/shared/data/types.ts`
- Create: `apps/mobile/src/shared/data/spotMappers.ts`
- Create: `apps/mobile/src/shared/data/spotMappers.test.ts`
- Create: `apps/mobile/src/shared/data/spotRepository.ts`
- Modify: `apps/mobile/src/shared/mocks/spots.ts`
- Modify: `apps/mobile/src/features/home/screens/HomeScreen.tsx`
- Modify: `apps/mobile/src/features/map/screens/MapScreen.tsx`
- Modify: `apps/mobile/src/features/map/screens/SpotListScreen.tsx`
- Modify: `apps/mobile/src/features/spot/screens/SpotDetailScreen.tsx`

### Task 1: Scaffold the admin app and test harness

**Files:**
- Create: `apps/admin/package.json`
- Create: `apps/admin/tsconfig.json`
- Create: `apps/admin/next.config.ts`
- Create: `apps/admin/.gitignore`
- Create: `apps/admin/vitest.config.ts`
- Create: `apps/admin/src/test/setup.ts`
- Create: `apps/admin/src/features/dashboard/DashboardShell.tsx`
- Create: `apps/admin/app/layout.tsx`
- Create: `apps/admin/app/page.tsx`
- Test: `apps/admin/src/features/dashboard/DashboardShell.test.tsx`

- [ ] **Step 1: Write the failing test**

```tsx
// apps/admin/src/features/dashboard/DashboardShell.test.tsx
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { DashboardShell } from './DashboardShell';

describe('DashboardShell', () => {
  it('renders the shared admin navigation links', () => {
    render(
      <DashboardShell title="대시보드">
        <div>body</div>
      </DashboardShell>,
    );

    expect(screen.getByRole('heading', { name: '대시보드' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: '꽃 관리' })).toHaveAttribute('href', '/flowers');
    expect(screen.getByRole('link', { name: '명소 관리' })).toHaveAttribute('href', '/spots');
    expect(screen.getByRole('link', { name: 'JSON 등록' })).toHaveAttribute('href', '/spots/import');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd apps/admin && pnpm vitest run src/features/dashboard/DashboardShell.test.tsx`
Expected: FAIL because `package.json`, `vitest`, and `DashboardShell` do not exist yet.

- [ ] **Step 3: Write the minimal implementation**

```json
// apps/admin/package.json
{
  "name": "flower-map-admin",
  "private": true,
  "version": "1.0.0",
  "type": "module",
  "packageManager": "pnpm@10.33.0",
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "test": "vitest run"
  },
  "dependencies": {
    "@supabase/ssr": "^0.5.2",
    "@supabase/supabase-js": "^2.57.4",
    "next": "^15.5.2",
    "react": "19.2.0",
    "react-dom": "19.2.0",
    "zod": "^4.1.5"
  },
  "devDependencies": {
    "@testing-library/jest-dom": "^6.8.0",
    "@testing-library/react": "^16.3.0",
    "@testing-library/user-event": "^14.6.1",
    "@types/node": "^24.3.0",
    "@types/react": "^19.2.2",
    "@types/react-dom": "^19.2.2",
    "jsdom": "^26.1.0",
    "typescript": "^5.9.2",
    "vitest": "^3.2.4"
  }
}
```

```tsx
// apps/admin/src/features/dashboard/DashboardShell.tsx
import Link from 'next/link';
import type { ReactNode } from 'react';

type DashboardShellProps = {
  title: string;
  children: ReactNode;
};

const links = [
  { href: '/flowers', label: '꽃 관리' },
  { href: '/spots', label: '명소 관리' },
  { href: '/spots/import', label: 'JSON 등록' },
];

export function DashboardShell({ title, children }: DashboardShellProps) {
  return (
    <main>
      <header>
        <p>꽃 어디 어드민</p>
        <h1>{title}</h1>
        <nav aria-label="관리 메뉴">
          <ul>
            {links.map((link) => (
              <li key={link.href}>
                <Link href={link.href}>{link.label}</Link>
              </li>
            ))}
          </ul>
        </nav>
      </header>
      <section>{children}</section>
    </main>
  );
}
```

```tsx
// apps/admin/app/layout.tsx
import type { ReactNode } from 'react';

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
```

```tsx
// apps/admin/app/page.tsx
import { redirect } from 'next/navigation';

export default function HomePage() {
  redirect('/spots');
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd apps/admin && pnpm test -- src/features/dashboard/DashboardShell.test.tsx`
Expected: PASS with 1 passing test.

- [ ] **Step 5: Commit**

```bash
git add apps/admin
git commit -m "feat: scaffold admin app shell"
```

### Task 2: Add the Supabase schema and typed validation rules

**Files:**
- Create: `supabase/migrations/20260327_admin_schema.sql`
- Create: `apps/admin/src/lib/types.ts`
- Create: `apps/admin/src/features/flowers/flowerSchema.ts`
- Create: `apps/admin/src/features/flowers/flowerSchema.test.ts`
- Create: `apps/admin/src/features/spots/spotSchema.ts`
- Create: `apps/admin/src/features/spots/spotSchema.test.ts`

- [ ] **Step 1: Write the failing tests**

```ts
// apps/admin/src/features/flowers/flowerSchema.test.ts
import { describe, expect, it } from 'vitest';

import { flowerSchema } from './flowerSchema';

describe('flowerSchema', () => {
  it('accepts a valid flower payload', () => {
    const result = flowerSchema.safeParse({
      slug: 'cherry-blossom',
      name_ko: '벚꽃',
      color_hex: '#F6B7C1',
      season_start_month: 3,
      season_end_month: 4,
      sort_order: 1,
      is_active: true,
    });

    expect(result.success).toBe(true);
  });

  it('rejects a month outside 1 through 12', () => {
    const result = flowerSchema.safeParse({
      slug: 'cherry-blossom',
      name_ko: '벚꽃',
      color_hex: '#F6B7C1',
      season_start_month: 0,
      season_end_month: 4,
      sort_order: 1,
      is_active: true,
    });

    expect(result.success).toBe(false);
  });
});
```

```ts
// apps/admin/src/features/spots/spotSchema.test.ts
import { describe, expect, it } from 'vitest';

import { spotSchema } from './spotSchema';

describe('spotSchema', () => {
  it('accepts a draft spot with coordinates and bloom dates', () => {
    const result = spotSchema.safeParse({
      slug: 'yeouido-yunjung-ro',
      name: '여의도 윤중로',
      region_primary: '서울/경기',
      region_secondary: '서울 영등포구',
      address: '서울특별시 영등포구 여의서로 일대',
      latitude: 37.5259,
      longitude: 126.9226,
      description: '한강 바람을 따라 걷기 좋은 서울 대표 벚꽃 산책 코스',
      short_tip: '산책 동선이 좋고 축제 분위기가 살아 있는 대표 스팟',
      bloom_start_at: '2026-03-28',
      bloom_end_at: '2026-04-10',
      status: 'draft',
    });

    expect(result.success).toBe(true);
  });

  it('rejects an invalid status value', () => {
    const result = spotSchema.safeParse({
      slug: 'yeouido-yunjung-ro',
      name: '여의도 윤중로',
      region_primary: '서울/경기',
      region_secondary: '서울 영등포구',
      address: '서울특별시 영등포구 여의서로 일대',
      latitude: 37.5259,
      longitude: 126.9226,
      description: '설명',
      short_tip: '팁',
      bloom_start_at: '2026-03-28',
      bloom_end_at: '2026-04-10',
      status: 'archived',
    });

    expect(result.success).toBe(false);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd apps/admin && pnpm test -- src/features/flowers/flowerSchema.test.ts src/features/spots/spotSchema.test.ts`
Expected: FAIL because the schemas do not exist yet.

- [ ] **Step 3: Write the minimal implementation**

```ts
// apps/admin/src/features/flowers/flowerSchema.ts
import { z } from 'zod';

const monthSchema = z.number().int().min(1).max(12);

export const flowerSchema = z.object({
  slug: z.string().trim().min(2).regex(/^[a-z0-9-]+$/),
  name_ko: z.string().trim().min(1),
  name_en: z.string().trim().optional(),
  color_hex: z.string().trim().regex(/^#([A-Fa-f0-9]{6})$/),
  season_start_month: monthSchema,
  season_end_month: monthSchema,
  sort_order: z.number().int().default(0),
  is_active: z.boolean().default(true),
});
```

```ts
// apps/admin/src/features/spots/spotSchema.ts
import { z } from 'zod';

const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

export const spotSchema = z
  .object({
    slug: z.string().trim().min(2).regex(/^[a-z0-9-]+$/),
    name: z.string().trim().min(1),
    region_primary: z.string().trim().min(1),
    region_secondary: z.string().trim().min(1),
    address: z.string().trim().min(1),
    latitude: z.number().min(-90).max(90),
    longitude: z.number().min(-180).max(180),
    description: z.string().trim().min(1),
    short_tip: z.string().trim().min(1),
    parking_info: z.string().trim().optional(),
    admission_fee: z.string().trim().optional(),
    festival_name: z.string().trim().optional(),
    festival_start_at: dateSchema.optional(),
    festival_end_at: dateSchema.optional(),
    bloom_start_at: dateSchema,
    bloom_end_at: dateSchema,
    thumbnail_url: z.string().url().optional(),
    status: z.enum(['draft', 'published']).default('draft'),
    source_note: z.string().trim().optional(),
  })
  .superRefine((value, ctx) => {
    if (value.bloom_start_at > value.bloom_end_at) {
      ctx.addIssue({
        code: 'custom',
        message: 'bloom_start_at must be on or before bloom_end_at',
        path: ['bloom_end_at'],
      });
    }
    if (value.festival_start_at && value.festival_end_at && value.festival_start_at > value.festival_end_at) {
      ctx.addIssue({
        code: 'custom',
        message: 'festival_start_at must be on or before festival_end_at',
        path: ['festival_end_at'],
      });
    }
  });
```

```sql
-- supabase/migrations/20260327_admin_schema.sql
create extension if not exists pgcrypto;

create table if not exists public.flowers (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name_ko text not null,
  name_en text,
  color_hex text not null,
  season_start_month smallint not null check (season_start_month between 1 and 12),
  season_end_month smallint not null check (season_end_month between 1 and 12),
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.spots (
  id uuid primary key default gen_random_uuid(),
  flower_id uuid not null references public.flowers(id) on delete restrict,
  slug text not null unique,
  name text not null,
  region_primary text not null,
  region_secondary text not null,
  address text not null,
  latitude numeric(9, 6) not null check (latitude between -90 and 90),
  longitude numeric(9, 6) not null check (longitude between -180 and 180),
  description text not null,
  short_tip text not null,
  parking_info text,
  admission_fee text,
  festival_name text,
  festival_start_at date,
  festival_end_at date,
  bloom_start_at date not null,
  bloom_end_at date not null,
  thumbnail_url text,
  status text not null default 'draft' check (status in ('draft', 'published')),
  source_type text not null default 'manual_json',
  source_note text,
  is_featured boolean not null default false,
  display_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (bloom_start_at <= bloom_end_at),
  check (
    festival_start_at is null
    or festival_end_at is null
    or festival_start_at <= festival_end_at
  )
);
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd apps/admin && pnpm test -- src/features/flowers/flowerSchema.test.ts src/features/spots/spotSchema.test.ts`
Expected: PASS with 4 passing assertions.

- [ ] **Step 5: Commit**

```bash
git add supabase/migrations/20260327_admin_schema.sql apps/admin/src/features/flowers apps/admin/src/features/spots apps/admin/src/lib/types.ts
git commit -m "feat: add flower and spot schemas"
```

### Task 3: Build JSON import parsing and change classification

**Files:**
- Create: `apps/admin/src/features/import/importSchema.ts`
- Create: `apps/admin/src/features/import/importSchema.test.ts`
- Create: `apps/admin/src/features/import/classifyImport.ts`
- Create: `apps/admin/src/features/import/classifyImport.test.ts`

- [ ] **Step 1: Write the failing tests**

```ts
// apps/admin/src/features/import/importSchema.test.ts
import { describe, expect, it } from 'vitest';

import { importPayloadSchema } from './importSchema';

describe('importPayloadSchema', () => {
  it('accepts flower with multiple spots', () => {
    const result = importPayloadSchema.safeParse({
      flower: {
        slug: 'cherry-blossom',
        name_ko: '벚꽃',
        color_hex: '#F6B7C1',
        season_start_month: 3,
        season_end_month: 4,
      },
      spots: [
        {
          slug: 'yeouido-yunjung-ro',
          name: '여의도 윤중로',
          region_primary: '서울/경기',
          region_secondary: '서울 영등포구',
          address: '서울특별시 영등포구 여의서로 일대',
          latitude: 37.5259,
          longitude: 126.9226,
          description: '설명',
          short_tip: '팁',
          bloom_start_at: '2026-03-28',
          bloom_end_at: '2026-04-10',
        },
      ],
    });

    expect(result.success).toBe(true);
  });
});
```

```ts
// apps/admin/src/features/import/classifyImport.test.ts
import { describe, expect, it } from 'vitest';

import { classifyImport } from './classifyImport';

describe('classifyImport', () => {
  it('splits rows into create and update buckets by slug', () => {
    const result = classifyImport(
      [{ slug: 'yeouido-yunjung-ro', name: '여의도 윤중로' }, { slug: 'jeju-noksan-ro', name: '제주 녹산로' }],
      [{ slug: 'yeouido-yunjung-ro', name: '여의도 윤중로 기존 데이터' }],
    );

    expect(result.toCreate).toHaveLength(1);
    expect(result.toUpdate).toHaveLength(1);
    expect(result.toUpdate[0].existing.slug).toBe('yeouido-yunjung-ro');
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd apps/admin && pnpm test -- src/features/import/importSchema.test.ts src/features/import/classifyImport.test.ts`
Expected: FAIL because the import modules do not exist yet.

- [ ] **Step 3: Write the minimal implementation**

```ts
// apps/admin/src/features/import/importSchema.ts
import { z } from 'zod';

import { flowerSchema } from '../flowers/flowerSchema';
import { spotSchema } from '../spots/spotSchema';

export const importPayloadSchema = z.union([
  z.object({
    flower: flowerSchema,
    spots: z.array(spotSchema).min(1),
  }),
  z.object({
    flower_slug: z.string().trim().min(2).regex(/^[a-z0-9-]+$/),
    spot: spotSchema,
  }),
]);
```

```ts
// apps/admin/src/features/import/classifyImport.ts
type WithSlug = { slug: string };

export function classifyImport<TIncoming extends WithSlug, TExisting extends WithSlug>(
  incomingRows: TIncoming[],
  existingRows: TExisting[],
) {
  const existingMap = new Map(existingRows.map((row) => [row.slug, row]));

  return incomingRows.reduce(
    (acc, row) => {
      const existing = existingMap.get(row.slug);

      if (existing) {
        acc.toUpdate.push({ incoming: row, existing });
      } else {
        acc.toCreate.push(row);
      }

      return acc;
    },
    {
      toCreate: [] as TIncoming[],
      toUpdate: [] as Array<{ incoming: TIncoming; existing: TExisting }>,
    },
  );
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd apps/admin && pnpm test -- src/features/import/importSchema.test.ts src/features/import/classifyImport.test.ts`
Expected: PASS with 2 passing tests.

- [ ] **Step 5: Commit**

```bash
git add apps/admin/src/features/import
git commit -m "feat: add import validation and diffing"
```

### Task 4: Add admin auth, dashboard routes, and CRUD forms

**Files:**
- Create: `apps/admin/src/lib/env.ts`
- Create: `apps/admin/src/lib/supabase/browser.ts`
- Create: `apps/admin/src/lib/supabase/server.ts`
- Create: `apps/admin/src/lib/supabase/admin.ts`
- Create: `apps/admin/middleware.ts`
- Create: `apps/admin/src/features/auth/LoginForm.tsx`
- Create: `apps/admin/src/features/flowers/FlowerForm.tsx`
- Create: `apps/admin/src/features/spots/SpotForm.tsx`
- Create: `apps/admin/src/lib/data/flowers.ts`
- Create: `apps/admin/src/lib/data/spots.ts`
- Create: `apps/admin/app/login/page.tsx`
- Create: `apps/admin/app/(dashboard)/layout.tsx`
- Create: `apps/admin/app/(dashboard)/flowers/page.tsx`
- Create: `apps/admin/app/(dashboard)/spots/page.tsx`
- Test: `apps/admin/src/lib/data/spots.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// apps/admin/src/lib/data/spots.test.ts
import { describe, expect, it } from 'vitest';

import { buildSpotWriteInput } from './spots';

describe('buildSpotWriteInput', () => {
  it('normalizes empty strings to null and defaults status to draft', () => {
    const result = buildSpotWriteInput({
      flower_id: 'flower-1',
      slug: 'yeouido-yunjung-ro',
      name: '여의도 윤중로',
      region_primary: '서울/경기',
      region_secondary: '서울 영등포구',
      address: '서울특별시 영등포구 여의서로 일대',
      latitude: 37.5259,
      longitude: 126.9226,
      description: '설명',
      short_tip: '팁',
      parking_info: '',
      admission_fee: '',
      bloom_start_at: '2026-03-28',
      bloom_end_at: '2026-04-10',
    });

    expect(result.status).toBe('draft');
    expect(result.parking_info).toBeNull();
    expect(result.admission_fee).toBeNull();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd apps/admin && pnpm test -- src/lib/data/spots.test.ts`
Expected: FAIL because the data helper does not exist yet.

- [ ] **Step 3: Write the minimal implementation**

```ts
// apps/admin/src/lib/data/spots.ts
type SpotWriteDraft = {
  flower_id: string;
  slug: string;
  name: string;
  region_primary: string;
  region_secondary: string;
  address: string;
  latitude: number;
  longitude: number;
  description: string;
  short_tip: string;
  parking_info?: string;
  admission_fee?: string;
  bloom_start_at: string;
  bloom_end_at: string;
  status?: 'draft' | 'published';
};

function emptyToNull(value?: string) {
  return value && value.trim().length > 0 ? value : null;
}

export function buildSpotWriteInput(input: SpotWriteDraft) {
  return {
    ...input,
    parking_info: emptyToNull(input.parking_info),
    admission_fee: emptyToNull(input.admission_fee),
    status: input.status ?? 'draft',
  };
}
```

```tsx
// apps/admin/app/(dashboard)/flowers/page.tsx
import { DashboardShell } from '@/src/features/dashboard/DashboardShell';

export default function FlowersPage() {
  return (
    <DashboardShell title="꽃 관리">
      <p>꽃 종류를 추가하고 시즌, 정렬, 활성화 상태를 관리합니다.</p>
    </DashboardShell>
  );
}
```

```tsx
// apps/admin/app/(dashboard)/spots/page.tsx
import { DashboardShell } from '@/src/features/dashboard/DashboardShell';

export default function SpotsPage() {
  return (
    <DashboardShell title="명소 관리">
      <p>명소를 draft로 저장하고 검토 후 published로 전환합니다.</p>
    </DashboardShell>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd apps/admin && pnpm test -- src/lib/data/spots.test.ts`
Expected: PASS with 1 passing test.

- [ ] **Step 5: Commit**

```bash
git add apps/admin
git commit -m "feat: add admin auth and CRUD foundations"
```

### Task 5: Build the JSON import screen and image upload route

**Files:**
- Create: `apps/admin/src/lib/blob/uploadImage.ts`
- Create: `apps/admin/src/features/import/ImportConsole.tsx`
- Create: `apps/admin/app/(dashboard)/spots/import/page.tsx`
- Create: `apps/admin/app/api/upload/route.ts`
- Test: `apps/admin/src/features/import/ImportConsole.test.tsx`

- [ ] **Step 1: Write the failing test**

```tsx
// apps/admin/src/features/import/ImportConsole.test.tsx
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { ImportConsole } from './ImportConsole';

describe('ImportConsole', () => {
  it('shows validation results after parsing a valid payload', async () => {
    const onValidate = vi.fn().mockResolvedValue({
      created: 1,
      updated: 0,
      errors: [],
    });

    render(<ImportConsole onValidate={onValidate} />);

    fireEvent.change(screen.getByLabelText('JSON 입력'), {
      target: { value: '{"flower_slug":"cherry-blossom","spot":{"slug":"yeouido-yunjung-ro","name":"여의도 윤중로","region_primary":"서울/경기","region_secondary":"서울 영등포구","address":"서울특별시 영등포구 여의서로 일대","latitude":37.5259,"longitude":126.9226,"description":"설명","short_tip":"팁","bloom_start_at":"2026-03-28","bloom_end_at":"2026-04-10"}}' },
    });

    fireEvent.click(screen.getByRole('button', { name: '검증' }));

    expect(await screen.findByText('신규 1건')).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd apps/admin && pnpm test -- src/features/import/ImportConsole.test.tsx`
Expected: FAIL because the component does not exist yet.

- [ ] **Step 3: Write the minimal implementation**

```tsx
// apps/admin/src/features/import/ImportConsole.tsx
'use client';

import { useState } from 'react';

type ValidationSummary = {
  created: number;
  updated: number;
  errors: string[];
};

type ImportConsoleProps = {
  onValidate: (payload: string) => Promise<ValidationSummary>;
};

export function ImportConsole({ onValidate }: ImportConsoleProps) {
  const [value, setValue] = useState('');
  const [summary, setSummary] = useState<ValidationSummary | null>(null);

  async function handleValidate() {
    const next = await onValidate(value);
    setSummary(next);
  }

  return (
    <section>
      <label htmlFor="import-json">JSON 입력</label>
      <textarea id="import-json" value={value} onChange={(event) => setValue(event.target.value)} />
      <button onClick={handleValidate} type="button">
        검증
      </button>
      {summary ? (
        <div>
          <p>신규 {summary.created}건</p>
          <p>업데이트 {summary.updated}건</p>
          {summary.errors.map((error) => (
            <p key={error}>{error}</p>
          ))}
        </div>
      ) : null}
    </section>
  );
}
```

```ts
// apps/admin/app/api/upload/route.ts
import { NextResponse } from 'next/server';

export async function POST() {
  return NextResponse.json(
    {
      message: 'Implement Vercel Blob upload after wiring env vars.',
    },
    { status: 501 },
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd apps/admin && pnpm test -- src/features/import/ImportConsole.test.tsx`
Expected: PASS with 1 passing test.

- [ ] **Step 5: Commit**

```bash
git add apps/admin
git commit -m "feat: add import console and upload route"
```

### Task 6: Replace mobile mock consumption with a published-spot repository

**Files:**
- Create: `apps/mobile/src/shared/data/types.ts`
- Create: `apps/mobile/src/shared/data/spotMappers.ts`
- Create: `apps/mobile/src/shared/data/spotMappers.test.ts`
- Create: `apps/mobile/src/shared/data/spotRepository.ts`
- Modify: `apps/mobile/src/shared/mocks/spots.ts`
- Modify: `apps/mobile/src/features/home/screens/HomeScreen.tsx`
- Modify: `apps/mobile/src/features/map/screens/MapScreen.tsx`
- Modify: `apps/mobile/src/features/map/screens/SpotListScreen.tsx`
- Modify: `apps/mobile/src/features/spot/screens/SpotDetailScreen.tsx`

- [ ] **Step 1: Write the failing test**

```ts
// apps/mobile/src/shared/data/spotMappers.test.ts
import { describe, expect, it } from 'vitest';

import { toFlowerSpot } from './spotMappers';

describe('toFlowerSpot', () => {
  it('maps a published spot row into the existing mobile card shape', () => {
    const result = toFlowerSpot({
      id: 'spot-1',
      slug: 'yeouido-yunjung-ro',
      name: '여의도 윤중로',
      flower: { name_ko: '벚꽃' },
      region_secondary: '서울 영등포구',
      description: '한강 바람을 따라 걷기 좋은 서울 대표 벚꽃 산책 코스',
      short_tip: '산책 동선이 좋고 축제 분위기가 살아 있는 대표 스팟',
      admission_fee: '무료',
      parking_info: '인근 공영주차장 이용 권장',
      festival_start_at: '2026-04-01',
      festival_end_at: '2026-04-07',
      bloom_start_at: '2026-03-28',
      bloom_end_at: '2026-04-10',
      is_featured: true,
    });

    expect(result.place).toBe('여의도 윤중로');
    expect(result.flower).toBe('벚꽃');
    expect(result.badge).toBe('이번 주 절정');
    expect(result.festivalDate).toBe('2026.04.01 - 2026.04.07');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd apps/mobile && pnpm vitest run src/shared/data/spotMappers.test.ts`
Expected: FAIL because the mapper module does not exist yet.

- [ ] **Step 3: Write the minimal implementation**

```ts
// apps/mobile/src/shared/data/spotMappers.ts
import type { FlowerSpot } from '../mocks/spots';

type PublishedSpotRow = {
  id: string;
  slug: string;
  name: string;
  flower: { name_ko: string };
  region_secondary: string;
  description: string;
  short_tip: string;
  admission_fee: string | null;
  parking_info: string | null;
  festival_start_at: string | null;
  festival_end_at: string | null;
  bloom_start_at: string;
  bloom_end_at: string;
  is_featured: boolean;
};

function formatDateRange(start: string | null, end: string | null) {
  if (!start || !end) return '일정 미정';
  return `${start.replaceAll('-', '.')} - ${end.replaceAll('-', '.')}`;
}

export function toFlowerSpot(row: PublishedSpotRow): FlowerSpot {
  return {
    id: row.slug,
    badge: row.is_featured ? '이번 주 절정' : '지금 방문 추천',
    bloomStatus: '지금 보기 좋아요',
    description: row.description,
    fee: row.admission_fee ?? '정보 없음',
    festivalDate: formatDateRange(row.festival_start_at, row.festival_end_at),
    flower: row.flower.name_ko,
    helper: row.short_tip,
    location: row.region_secondary,
    parking: row.parking_info ?? '정보 없음',
    place: row.name,
    tone: row.flower.name_ko === '유채꽃' ? 'yellow' : row.flower.name_ko === '벚꽃' ? 'pink' : 'green',
  };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd apps/mobile && pnpm vitest run src/shared/data/spotMappers.test.ts`
Expected: PASS with 1 passing test.

- [ ] **Step 5: Commit**

```bash
git add apps/mobile/src/shared/data apps/mobile/src/features/home/screens/HomeScreen.tsx apps/mobile/src/features/map/screens/MapScreen.tsx apps/mobile/src/features/map/screens/SpotListScreen.tsx apps/mobile/src/features/spot/screens/SpotDetailScreen.tsx apps/mobile/src/shared/mocks/spots.ts
git commit -m "feat: add mobile spot repository and mappers"
```

## Self-Review Notes

- The plan covers the spec sections for schema, JSON import, image upload, admin auth, CRUD, and mobile published-only reads.
- The riskiest implementation areas are environment wiring for Supabase/Vercel Blob and route protection; keep those in the first review checkpoint after Task 4.
- If `pnpm vitest` is unavailable in `apps/mobile`, add Vitest to `apps/mobile/package.json` before implementing Task 6 rather than bypassing the tests.
