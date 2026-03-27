# Admin Dashboard Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild `apps/admin` into a polished, Toss-inspired dashboard admin with shadcn/ui primitives, a real dashboard home, and refined CRUD/import surfaces without changing the existing data model.

**Architecture:** Introduce a small design-system layer inside `apps/admin/src/components/ui` and `apps/admin/src/features/dashboard`, then recompose all admin routes around a shared sidebar + topbar shell. Keep existing server actions and data helpers, but move presentation into dashboard-grade sections, metric panels, structured forms, and dense data lists.

**Tech Stack:** Next.js App Router, React 19, TypeScript, shadcn/ui-style component primitives, Tailwind CSS, Supabase SSR/Auth, Vitest

---

## File Map

- Modify: `apps/admin/package.json`
- Modify: `apps/admin/tsconfig.json`
- Modify: `apps/admin/app/layout.tsx`
- Modify: `apps/admin/app/page.tsx`
- Modify: `apps/admin/app/login/page.tsx`
- Modify: `apps/admin/app/(dashboard)/layout.tsx`
- Modify: `apps/admin/app/(dashboard)/flowers/page.tsx`
- Modify: `apps/admin/app/(dashboard)/spots/page.tsx`
- Modify: `apps/admin/app/(dashboard)/spots/import/page.tsx`
- Modify: `apps/admin/src/features/dashboard/DashboardShell.tsx`
- Modify: `apps/admin/src/features/dashboard/DashboardShell.test.tsx`
- Modify: `apps/admin/src/features/flowers/FlowerForm.tsx`
- Modify: `apps/admin/src/features/spots/SpotForm.tsx`
- Modify: `apps/admin/src/features/import/ImportConsole.tsx`
- Modify: `apps/admin/src/features/import/ImportConsole.test.tsx`
- Create: `apps/admin/postcss.config.js`
- Create: `apps/admin/components.json`
- Create: `apps/admin/app/globals.css`
- Create: `apps/admin/src/lib/utils.ts`
- Create: `apps/admin/src/components/ui/button.tsx`
- Create: `apps/admin/src/components/ui/card.tsx`
- Create: `apps/admin/src/components/ui/input.tsx`
- Create: `apps/admin/src/components/ui/textarea.tsx`
- Create: `apps/admin/src/components/ui/select.tsx`
- Create: `apps/admin/src/components/ui/badge.tsx`
- Create: `apps/admin/src/components/ui/separator.tsx`
- Create: `apps/admin/src/components/ui/table.tsx`
- Create: `apps/admin/src/components/ui/sheet.tsx`
- Create: `apps/admin/src/features/dashboard/AdminSidebar.tsx`
- Create: `apps/admin/src/features/dashboard/AdminTopbar.tsx`
- Create: `apps/admin/src/features/dashboard/MetricCard.tsx`
- Create: `apps/admin/src/features/dashboard/SectionHeader.tsx`
- Create: `apps/admin/src/features/dashboard/StatusBadge.tsx`
- Create: `apps/admin/src/features/dashboard/FormSection.tsx`
- Create: `apps/admin/src/features/dashboard/QuickActionPanel.tsx`
- Create: `apps/admin/src/features/dashboard/DataListTable.tsx`
- Create: `apps/admin/src/features/dashboard/DashboardHome.tsx`
- Test: `apps/admin/src/features/dashboard/AdminSidebar.test.tsx`
- Test: `apps/admin/src/features/dashboard/DashboardHome.test.tsx`
- Test: `apps/admin/src/features/dashboard/StatusBadge.test.tsx`

### Task 1: Install UI styling foundation and shared primitives

**Files:**
- Modify: `apps/admin/package.json`
- Modify: `apps/admin/tsconfig.json`
- Modify: `apps/admin/app/layout.tsx`
- Create: `apps/admin/postcss.config.js`
- Create: `apps/admin/components.json`
- Create: `apps/admin/app/globals.css`
- Create: `apps/admin/src/lib/utils.ts`
- Create: `apps/admin/src/components/ui/button.tsx`
- Create: `apps/admin/src/components/ui/card.tsx`
- Create: `apps/admin/src/components/ui/input.tsx`
- Create: `apps/admin/src/components/ui/textarea.tsx`
- Create: `apps/admin/src/components/ui/select.tsx`
- Create: `apps/admin/src/components/ui/badge.tsx`
- Create: `apps/admin/src/components/ui/separator.tsx`
- Create: `apps/admin/src/components/ui/table.tsx`
- Test: `apps/admin/src/features/dashboard/DashboardShell.test.tsx`

- [ ] **Step 1: Write the failing test**

```tsx
// apps/admin/src/features/dashboard/DashboardShell.test.tsx
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { DashboardShell } from './DashboardShell';

describe('DashboardShell', () => {
  it('renders the admin shell title area and shared navigation labels', () => {
    render(
      <DashboardShell
        title="대시보드"
        description="운영 상태를 확인합니다."
        actions={<button type="button">새 명소</button>}
      >
        <div>body</div>
      </DashboardShell>,
    );

    expect(screen.getByText('꽃 어디 Admin')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: '대시보드' })).toBeInTheDocument();
    expect(screen.getByText('운영 상태를 확인합니다.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '새 명소' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: '대시보드' })).toHaveAttribute('href', '/');
    expect(screen.getByRole('link', { name: '꽃 관리' })).toHaveAttribute('href', '/flowers');
    expect(screen.getByRole('link', { name: '명소 관리' })).toHaveAttribute('href', '/spots');
    expect(screen.getByRole('link', { name: 'JSON 등록' })).toHaveAttribute('href', '/spots/import');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd apps/admin && pnpm test -- src/features/dashboard/DashboardShell.test.tsx`
Expected: FAIL because `DashboardShell` does not yet accept `description` and `actions`, and the new navigation structure does not exist.

- [ ] **Step 3: Write the minimal implementation**

```tsx
// apps/admin/src/lib/utils.ts
export function cn(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(' ');
}
```

```tsx
// apps/admin/src/components/ui/button.tsx
import type { ButtonHTMLAttributes } from 'react';

import { cn } from '@/lib/utils';

export function Button({ className, ...props }: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className={cn(
        'inline-flex h-10 items-center justify-center rounded-xl bg-[#3182F6] px-4 text-sm font-semibold text-white transition hover:bg-[#1F6FE5]',
        className,
      )}
      {...props}
    />
  );
}
```

```tsx
// apps/admin/src/components/ui/card.tsx
import type { HTMLAttributes } from 'react';

import { cn } from '@/lib/utils';

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('rounded-2xl border border-black/5 bg-white', className)} {...props} />;
}
```

```tsx
// apps/admin/app/layout.tsx
import './globals.css';

import type { ReactNode } from 'react';

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ko">
      <body className="bg-[#F6F7FB] text-[#191F28] antialiased">{children}</body>
    </html>
  );
}
```

```css
/* apps/admin/app/globals.css */
@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  color-scheme: light;
}

body {
  margin: 0;
  font-family:
    "Pretendard Variable",
    "Pretendard",
    "Noto Sans KR",
    system-ui,
    sans-serif;
}

* {
  box-sizing: border-box;
}
```

```tsx
// apps/admin/src/features/dashboard/DashboardShell.tsx
import type { ReactNode } from 'react';

import { AdminSidebar } from './AdminSidebar';
import { AdminTopbar } from './AdminTopbar';

type DashboardShellProps = {
  title: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
};

export function DashboardShell({ title, description, actions, children }: DashboardShellProps) {
  return (
    <div className="min-h-screen bg-[#F6F7FB]">
      <div className="mx-auto grid min-h-screen max-w-[1600px] grid-cols-[240px_minmax(0,1fr)] gap-6 px-5 py-5">
        <AdminSidebar />
        <main className="min-w-0">
          <AdminTopbar title={title} description={description} actions={actions} />
          <section className="mt-6">{children}</section>
        </main>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Add Tailwind and class-based styling dependencies**

Run: `cd apps/admin && pnpm add -D tailwindcss postcss autoprefixer`
Expected: PASS and `package.json` updates with the new dev dependencies.

- [ ] **Step 5: Run test to verify it passes**

Run: `cd apps/admin && pnpm test -- src/features/dashboard/DashboardShell.test.tsx`
Expected: PASS with 1 passing test.

- [ ] **Step 6: Commit**

```bash
git add apps/admin/package.json apps/admin/tsconfig.json apps/admin/postcss.config.js apps/admin/components.json apps/admin/app/layout.tsx apps/admin/app/globals.css apps/admin/src/lib/utils.ts apps/admin/src/components/ui apps/admin/src/features/dashboard/DashboardShell.tsx apps/admin/src/features/dashboard/DashboardShell.test.tsx
git commit -m "feat: add admin design system foundation"
```

### Task 2: Build the Toss-style navigation shell

**Files:**
- Create: `apps/admin/src/features/dashboard/AdminSidebar.tsx`
- Create: `apps/admin/src/features/dashboard/AdminTopbar.tsx`
- Create: `apps/admin/src/features/dashboard/AdminSidebar.test.tsx`
- Modify: `apps/admin/src/features/dashboard/DashboardShell.tsx`
- Test: `apps/admin/src/features/dashboard/AdminSidebar.test.tsx`

- [ ] **Step 1: Write the failing test**

```tsx
// apps/admin/src/features/dashboard/AdminSidebar.test.tsx
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { AdminSidebar } from './AdminSidebar';

describe('AdminSidebar', () => {
  it('renders the main dashboard navigation groups', () => {
    render(<AdminSidebar />);

    expect(screen.getByText('꽃 어디 Admin')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: '대시보드' })).toHaveAttribute('href', '/');
    expect(screen.getByRole('link', { name: '꽃 관리' })).toHaveAttribute('href', '/flowers');
    expect(screen.getByRole('link', { name: '명소 관리' })).toHaveAttribute('href', '/spots');
    expect(screen.getByRole('link', { name: 'JSON 등록' })).toHaveAttribute('href', '/spots/import');
    expect(screen.getByRole('link', { name: '설정' })).toHaveAttribute('href', '/settings');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd apps/admin && pnpm test -- src/features/dashboard/AdminSidebar.test.tsx`
Expected: FAIL because `AdminSidebar` does not exist yet.

- [ ] **Step 3: Write the minimal implementation**

```tsx
// apps/admin/src/features/dashboard/AdminSidebar.tsx
import Link from 'next/link';

import { Card } from '@/components/ui/card';

const navItems = [
  { href: '/', label: '대시보드' },
  { href: '/flowers', label: '꽃 관리' },
  { href: '/spots', label: '명소 관리' },
  { href: '/spots/import', label: 'JSON 등록' },
  { href: '/settings', label: '설정' },
];

export function AdminSidebar() {
  return (
    <aside>
      <Card className="sticky top-5 flex min-h-[calc(100vh-40px)] flex-col rounded-[28px] border border-black/5 bg-white/92 p-4">
        <div className="px-3 py-4">
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-[#8B95A1]">Flower Map</p>
          <h2 className="mt-2 text-xl font-semibold text-[#191F28]">꽃 어디 Admin</h2>
        </div>
        <nav aria-label="관리 메뉴" className="mt-4 flex flex-1 flex-col gap-1">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-2xl px-3 py-3 text-sm font-medium text-[#4E5968] transition hover:bg-[#F2F4F6] hover:text-[#191F28]"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </Card>
    </aside>
  );
}
```

```tsx
// apps/admin/src/features/dashboard/AdminTopbar.tsx
import type { ReactNode } from 'react';

export function AdminTopbar({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <header className="flex flex-col gap-4 rounded-[28px] border border-black/5 bg-white/80 px-7 py-6 backdrop-blur">
      <div className="flex items-start justify-between gap-6">
        <div>
          <p className="text-sm font-medium text-[#8B95A1]">운영 대시보드</p>
          <h1 className="mt-2 text-[32px] font-semibold tracking-[-0.03em] text-[#191F28]">{title}</h1>
          {description ? <p className="mt-2 text-sm text-[#4E5968]">{description}</p> : null}
        </div>
        {actions ? <div className="shrink-0">{actions}</div> : null}
      </div>
    </header>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd apps/admin && pnpm test -- src/features/dashboard/AdminSidebar.test.tsx`
Expected: PASS with 1 passing test.

- [ ] **Step 5: Commit**

```bash
git add apps/admin/src/features/dashboard/AdminSidebar.tsx apps/admin/src/features/dashboard/AdminTopbar.tsx apps/admin/src/features/dashboard/AdminSidebar.test.tsx apps/admin/src/features/dashboard/DashboardShell.tsx
git commit -m "feat: add admin sidebar and topbar shell"
```

### Task 3: Turn `/` into a real dashboard home

**Files:**
- Create: `apps/admin/src/features/dashboard/MetricCard.tsx`
- Create: `apps/admin/src/features/dashboard/QuickActionPanel.tsx`
- Create: `apps/admin/src/features/dashboard/SectionHeader.tsx`
- Create: `apps/admin/src/features/dashboard/StatusBadge.tsx`
- Create: `apps/admin/src/features/dashboard/DashboardHome.tsx`
- Create: `apps/admin/src/features/dashboard/DashboardHome.test.tsx`
- Modify: `apps/admin/app/page.tsx`
- Test: `apps/admin/src/features/dashboard/DashboardHome.test.tsx`
- Test: `apps/admin/src/features/dashboard/StatusBadge.test.tsx`

- [ ] **Step 1: Write the failing test**

```tsx
// apps/admin/src/features/dashboard/DashboardHome.test.tsx
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { DashboardHome } from './DashboardHome';

describe('DashboardHome', () => {
  it('renders KPI values, quick actions, and draft review rows', () => {
    render(
      <DashboardHome
        metrics={{
          flowers: 4,
          spots: 18,
          draftSpots: 5,
          publishedSpots: 13,
        }}
        recentSpots={[
          { id: '1', name: '여의도 윤중로', flowerName: '벚꽃', status: 'draft', region: '서울 영등포구' },
        ]}
      />,
    );

    expect(screen.getByText('총 꽃 수')).toBeInTheDocument();
    expect(screen.getByText('18')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: '명소 추가' })).toHaveAttribute('href', '/spots');
    expect(screen.getByText('여의도 윤중로')).toBeInTheDocument();
    expect(screen.getByText('draft')).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd apps/admin && pnpm test -- src/features/dashboard/DashboardHome.test.tsx`
Expected: FAIL because `DashboardHome` and related dashboard UI pieces do not exist yet.

- [ ] **Step 3: Write the minimal implementation**

```tsx
// apps/admin/src/features/dashboard/MetricCard.tsx
import { Card } from '@/components/ui/card';

export function MetricCard({ label, value }: { label: string; value: number }) {
  return (
    <Card className="rounded-[24px] px-6 py-5">
      <p className="text-sm font-medium text-[#8B95A1]">{label}</p>
      <p className="mt-3 text-4xl font-semibold tracking-[-0.04em] text-[#191F28]">{value}</p>
    </Card>
  );
}
```

```tsx
// apps/admin/src/features/dashboard/StatusBadge.tsx
import { Badge } from '@/components/ui/badge';

export function StatusBadge({ status }: { status: 'draft' | 'published' }) {
  return <Badge className={status === 'published' ? 'bg-[#E8F3FF] text-[#1F6FE5]' : 'bg-[#F2F4F6] text-[#4E5968]'}>{status}</Badge>;
}
```

```tsx
// apps/admin/src/features/dashboard/QuickActionPanel.tsx
import Link from 'next/link';

import { Card } from '@/components/ui/card';

const actions = [
  { href: '/flowers', label: '꽃 추가', description: '꽃 종류와 시즌 정보 등록' },
  { href: '/spots', label: '명소 추가', description: '명소 초안 생성' },
  { href: '/spots/import', label: 'JSON 등록', description: 'AI 수집 JSON 붙여넣기' },
];

export function QuickActionPanel() {
  return (
    <Card className="rounded-[24px] px-6 py-6">
      <h2 className="text-lg font-semibold text-[#191F28]">빠른 작업</h2>
      <div className="mt-4 grid gap-3 md:grid-cols-3">
        {actions.map((action) => (
          <Link key={action.href} href={action.href} className="rounded-2xl border border-black/5 bg-[#FAFBFC] px-4 py-4">
            <p className="text-sm font-semibold text-[#191F28]">{action.label}</p>
            <p className="mt-2 text-sm text-[#6B7684]">{action.description}</p>
          </Link>
        ))}
      </div>
    </Card>
  );
}
```

```tsx
// apps/admin/src/features/dashboard/DashboardHome.tsx
import { Card } from '@/components/ui/card';

import { MetricCard } from './MetricCard';
import { QuickActionPanel } from './QuickActionPanel';
import { StatusBadge } from './StatusBadge';

type DashboardHomeProps = {
  metrics: {
    flowers: number;
    spots: number;
    draftSpots: number;
    publishedSpots: number;
  };
  recentSpots: Array<{
    id: string;
    name: string;
    flowerName: string;
    status: 'draft' | 'published';
    region: string;
  }>;
};

export function DashboardHome({ metrics, recentSpots }: DashboardHomeProps) {
  return (
    <div className="space-y-6">
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="총 꽃 수" value={metrics.flowers} />
        <MetricCard label="총 명소 수" value={metrics.spots} />
        <MetricCard label="draft 수" value={metrics.draftSpots} />
        <MetricCard label="published 수" value={metrics.publishedSpots} />
      </section>
      <QuickActionPanel />
      <Card className="rounded-[24px] px-6 py-6">
        <h2 className="text-lg font-semibold text-[#191F28]">최근 등록 명소</h2>
        <ul className="mt-4 space-y-3">
          {recentSpots.map((spot) => (
            <li key={spot.id} className="flex items-center justify-between rounded-2xl border border-black/5 px-4 py-4">
              <div>
                <p className="text-sm font-semibold text-[#191F28]">{spot.name}</p>
                <p className="mt-1 text-sm text-[#6B7684]">
                  {spot.flowerName} · {spot.region}
                </p>
              </div>
              <StatusBadge status={spot.status} />
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
```

```tsx
// apps/admin/app/page.tsx
import type { SupabaseClient } from '@supabase/supabase-js';

import { DashboardHome } from '@/features/dashboard/DashboardHome';
import { DashboardShell } from '@/features/dashboard/DashboardShell';
import { listFlowers } from '@/lib/data/flowers';
import { listSpots } from '@/lib/data/spots';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import type { Database } from '@/lib/types';

export default async function HomePage() {
  const supabase = (await createServerSupabaseClient()) as unknown as SupabaseClient<Database>;
  const [flowers, spots] = await Promise.all([listFlowers(supabase), listSpots(supabase)]);
  const flowerNameById = new Map(flowers.map((flower) => [flower.id, flower.name_ko]));

  return (
    <DashboardShell title="대시보드" description="현재 운영 상태와 검수 대기 항목을 한 눈에 확인합니다.">
      <DashboardHome
        metrics={{
          flowers: flowers.length,
          spots: spots.length,
          draftSpots: spots.filter((spot) => spot.status === 'draft').length,
          publishedSpots: spots.filter((spot) => spot.status === 'published').length,
        }}
        recentSpots={spots.slice(0, 5).map((spot) => ({
          id: spot.id,
          name: spot.name,
          flowerName: flowerNameById.get(spot.flower_id) ?? '알 수 없는 꽃',
          status: spot.status,
          region: spot.region_secondary,
        }))}
      />
    </DashboardShell>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd apps/admin && pnpm test -- src/features/dashboard/DashboardHome.test.tsx`
Expected: PASS with 1 passing test.

- [ ] **Step 5: Commit**

```bash
git add apps/admin/src/features/dashboard/MetricCard.tsx apps/admin/src/features/dashboard/QuickActionPanel.tsx apps/admin/src/features/dashboard/SectionHeader.tsx apps/admin/src/features/dashboard/StatusBadge.tsx apps/admin/src/features/dashboard/DashboardHome.tsx apps/admin/src/features/dashboard/DashboardHome.test.tsx apps/admin/app/page.tsx
git commit -m "feat: add admin dashboard home"
```

### Task 4: Redesign the flowers screen into a management workspace

**Files:**
- Modify: `apps/admin/app/(dashboard)/flowers/page.tsx`
- Modify: `apps/admin/src/features/flowers/FlowerForm.tsx`
- Create: `apps/admin/src/features/dashboard/FormSection.tsx`

- [ ] **Step 1: Write the failing test**

```tsx
// apps/admin/src/features/dashboard/DashboardShell.test.tsx
it('supports split-panel page content for management workspaces', () => {
  render(
    <DashboardShell title="꽃 관리" description="꽃 마스터를 관리합니다.">
      <div>꽃 목록 패널</div>
      <div>꽃 폼 패널</div>
    </DashboardShell>,
  );

  expect(screen.getByText('꽃 목록 패널')).toBeInTheDocument();
  expect(screen.getByText('꽃 폼 패널')).toBeInTheDocument();
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd apps/admin && pnpm test -- src/features/dashboard/DashboardShell.test.tsx`
Expected: FAIL until the updated shell layout still renders multi-panel content correctly after the design refactor.

- [ ] **Step 3: Write the minimal implementation**

```tsx
// apps/admin/src/features/dashboard/FormSection.tsx
import type { ReactNode } from 'react';

export function FormSection({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <section className="space-y-3 border-t border-black/5 pt-5 first:border-t-0 first:pt-0">
      <div>
        <h3 className="text-sm font-semibold text-[#191F28]">{title}</h3>
        {description ? <p className="mt-1 text-sm text-[#6B7684]">{description}</p> : null}
      </div>
      {children}
    </section>
  );
}
```

```tsx
// apps/admin/src/features/flowers/FlowerForm.tsx
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import type { FlowerInsert } from '@/lib/types';

import { FormSection } from '@/features/dashboard/FormSection';

import { flowerSchema } from './flowerSchema';

type FlowerFormProps = {
  defaultValue?: Partial<FlowerInsert>;
  submitAction?: (value: FlowerInsert) => Promise<void> | void;
};

export function FlowerForm({ defaultValue, submitAction }: FlowerFormProps) {
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  async function handleSubmit(formData: FormData) {
    setErrorMessage(null);
    setSuccessMessage(null);

    const parsed = flowerSchema.safeParse({
      slug: String(formData.get('slug') ?? ''),
      name_ko: String(formData.get('name_ko') ?? ''),
      name_en: normalizeOptionalText(formData.get('name_en')),
      color_hex: String(formData.get('color_hex') ?? ''),
      season_start_month: Number(formData.get('season_start_month')),
      season_end_month: Number(formData.get('season_end_month')),
      sort_order: Number(formData.get('sort_order') ?? 0),
      is_active: formData.get('is_active') === 'on',
    });

    if (!parsed.success) {
      setErrorMessage(parsed.error.issues[0]?.message ?? '입력값을 확인해 주세요.');
      return;
    }

    try {
      await submitAction?.(parsed.data);
      setSuccessMessage('꽃 정보를 저장했습니다.');
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : '꽃 저장 중 오류가 발생했습니다.');
    }
  }

  return (
    <Card className="rounded-[24px] px-6 py-6">
      <form action={handleSubmit} className="space-y-5">
        <FormSection title="기본 정보" description="꽃 이름과 슬러그를 입력합니다.">
          <div className="grid gap-3">
            <Input name="slug" defaultValue={defaultValue?.slug ?? ''} placeholder="cherry-blossom" required />
            <Input name="name_ko" defaultValue={defaultValue?.name_ko ?? ''} placeholder="벚꽃" required />
            <Input name="name_en" defaultValue={defaultValue?.name_en ?? ''} placeholder="Cherry Blossom" />
          </div>
        </FormSection>
        <FormSection title="시즌 정보" description="운영 화면과 필터에 표시될 시즌을 설정합니다.">
          <div className="grid gap-3 md:grid-cols-3">
            <Input name="color_hex" defaultValue={defaultValue?.color_hex ?? '#F6B7C1'} required />
            <Input name="season_start_month" type="number" min={1} max={12} defaultValue={defaultValue?.season_start_month ?? 3} required />
            <Input name="season_end_month" type="number" min={1} max={12} defaultValue={defaultValue?.season_end_month ?? 4} required />
          </div>
        </FormSection>
        <FormSection title="표시 설정" description="정렬과 활성화 여부를 설정합니다.">
          <div className="grid gap-3 md:grid-cols-2">
            <Input name="sort_order" type="number" defaultValue={defaultValue?.sort_order ?? 0} />
            <label className="flex items-center gap-2 text-sm text-[#4E5968]">
              <input name="is_active" type="checkbox" defaultChecked={defaultValue?.is_active ?? true} />
              활성화
            </label>
          </div>
        </FormSection>
        {errorMessage ? <p role="alert" className="text-sm text-[#D9485F]">{errorMessage}</p> : null}
        {successMessage ? <p className="text-sm text-[#4E5968]">{successMessage}</p> : null}
        <Button type="submit">꽃 저장</Button>
      </form>
    </Card>
  );
}

function normalizeOptionalText(value: FormDataEntryValue | null) {
  if (typeof value !== 'string') {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}
```

```tsx
// apps/admin/app/(dashboard)/flowers/page.tsx
import type { SupabaseClient } from '@supabase/supabase-js';
import { revalidatePath } from 'next/cache';

import { Card } from '@/components/ui/card';
import { DashboardShell } from '@/features/dashboard/DashboardShell';
import { FlowerForm } from '@/features/flowers/FlowerForm';
import { createFlower, listFlowers } from '@/lib/data/flowers';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import type { Database, FlowerInsert, FlowerRow } from '@/lib/types';

export default async function FlowersPage() {
  const supabase = (await createServerSupabaseClient()) as unknown as SupabaseClient<Database>;
  const flowers: FlowerRow[] = await listFlowers(supabase);

  async function submitAction(value: FlowerInsert) {
    'use server';

    const client = (await createServerSupabaseClient()) as unknown as SupabaseClient<Database>;
    await createFlower(client, value);
    revalidatePath('/flowers');
    revalidatePath('/');
  }

  return (
    <DashboardShell title="꽃 관리" description="꽃 마스터와 시즌 정보를 관리합니다.">
      <div className="grid gap-6 xl:grid-cols-[minmax(0,0.9fr)_minmax(420px,0.7fr)]">
        <Card className="rounded-[24px] px-6 py-6">
          <h2 className="text-lg font-semibold text-[#191F28]">등록된 꽃</h2>
          <ul className="mt-5 space-y-3">
            {flowers.map((flower) => (
              <li key={flower.id} className="rounded-2xl border border-black/5 px-4 py-4">
                <p className="text-sm font-semibold text-[#191F28]">{flower.name_ko}</p>
                <p className="mt-1 text-sm text-[#6B7684]">
                  {flower.slug} · 시즌 {flower.season_start_month}-{flower.season_end_month}월
                </p>
              </li>
            ))}
          </ul>
        </Card>
        <FlowerForm submitAction={submitAction} />
      </div>
    </DashboardShell>
  );
}
```

- [ ] **Step 4: Run targeted verification**

Run: `cd apps/admin && pnpm test -- src/features/dashboard/DashboardShell.test.tsx`
Expected: PASS and no regression in shell rendering.

- [ ] **Step 5: Commit**

```bash
git add apps/admin/app/\(dashboard\)/flowers/page.tsx apps/admin/src/features/flowers/FlowerForm.tsx apps/admin/src/features/dashboard/FormSection.tsx
git commit -m "feat: redesign flowers management screen"
```

### Task 5: Redesign the spots screen into a dense operational workspace

**Files:**
- Modify: `apps/admin/app/(dashboard)/spots/page.tsx`
- Modify: `apps/admin/src/features/spots/SpotForm.tsx`
- Create: `apps/admin/src/features/dashboard/DataListTable.tsx`

- [ ] **Step 1: Write the failing test**

```tsx
// apps/admin/src/features/dashboard/DashboardHome.test.tsx
it('renders draft and published spot metrics with the dashboard card style', () => {
  render(
    <DashboardHome
      metrics={{ flowers: 4, spots: 12, draftSpots: 3, publishedSpots: 9 }}
      recentSpots={[]}
    />,
  );

  expect(screen.getByText('draft 수')).toBeInTheDocument();
  expect(screen.getByText('published 수')).toBeInTheDocument();
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd apps/admin && pnpm test -- src/features/dashboard/DashboardHome.test.tsx`
Expected: FAIL until the dashboard metric card surface is in place and the page uses the new layout consistently.

- [ ] **Step 3: Write the minimal implementation**

```tsx
// apps/admin/src/features/dashboard/DataListTable.tsx
import type { ReactNode } from 'react';

import { Card } from '@/components/ui/card';

export function DataListTable({
  title,
  toolbar,
  children,
}: {
  title: string;
  toolbar?: ReactNode;
  children: ReactNode;
}) {
  return (
    <Card className="rounded-[24px] px-6 py-6">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-lg font-semibold text-[#191F28]">{title}</h2>
        {toolbar}
      </div>
      <div className="mt-5">{children}</div>
    </Card>
  );
}
```

```tsx
// apps/admin/src/features/spots/SpotForm.tsx
// Preserve the current validation and submitAction logic, but wrap the form with:
// - <Card className="rounded-[24px] px-6 py-6">
// - <FormSection title="기본 정보" ... />
// - <FormSection title="위치 정보" ... />
// - <FormSection title="개화/축제 일정" ... />
// - <FormSection title="이미지와 메모" ... />
// - <FormSection title="공개 상태" ... />
// and replace native form controls with the shared Input, Textarea, Select, and Button primitives.
```

```tsx
// apps/admin/app/(dashboard)/spots/page.tsx
// Preserve existing Supabase reads and submitAction, but render:
// - a KPI row using MetricCard for total/draft/published/featured
// - a toolbar row with non-functional filter shells for 꽃 종류 / 상태 / 지역 / 검색
// - a DataListTable on the left for existing spots
// - a SpotForm panel on the right using the redesigned form sections
```

- [ ] **Step 4: Run targeted verification**

Run: `cd apps/admin && pnpm test -- src/features/import/ImportConsole.test.tsx`
Expected: PASS and no import regressions.

- [ ] **Step 5: Commit**

```bash
git add apps/admin/app/\(dashboard\)/spots/page.tsx apps/admin/src/features/spots/SpotForm.tsx apps/admin/src/features/dashboard/DataListTable.tsx
git commit -m "feat: redesign spots management workspace"
```

### Task 6: Redesign the JSON import screen and login surface

**Files:**
- Modify: `apps/admin/app/(dashboard)/spots/import/page.tsx`
- Modify: `apps/admin/src/features/import/ImportConsole.tsx`
- Modify: `apps/admin/src/features/import/ImportConsole.test.tsx`
- Modify: `apps/admin/app/login/page.tsx`

- [ ] **Step 1: Write the failing test**

```tsx
// apps/admin/src/features/import/ImportConsole.test.tsx
it('renders draft save and validation summaries in separate dashboard panels', () => {
  render(<ImportConsole />);

  expect(screen.getByRole('button', { name: '검증' })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'draft 저장' })).toBeInTheDocument();
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd apps/admin && pnpm test -- src/features/import/ImportConsole.test.tsx`
Expected: FAIL until the import page uses the two-panel dashboard layout and still exposes both actions.

- [ ] **Step 3: Write the minimal implementation**

```tsx
// apps/admin/src/features/import/ImportConsole.tsx
// Preserve validation and importAction logic, but render:
// - a desktop two-column grid
// - left Card containing a large Textarea and the two action buttons
// - right Card containing validation summary, save summary, and error messages
// - Button, Card, Textarea, Badge, and Separator primitives for all interactive/summary elements
```

```tsx
// apps/admin/app/(dashboard)/spots/import/page.tsx
// Preserve existing slug loading and importAction wiring, but wrap the page in:
// <DashboardShell
//   title="JSON 등록"
//   description="AI가 만든 JSON 초안을 검증하고 draft로 저장합니다."
// />
```

```tsx
// apps/admin/app/login/page.tsx
// Replace the plain layout with a two-column auth composition:
// - left: brand copy, short product description, and admin utility note
// - right: Card-wrapped LoginForm with the existing redirect behavior preserved
```

- [ ] **Step 4: Run targeted verification**

Run: `cd apps/admin && pnpm test -- src/features/import/ImportConsole.test.tsx`
Expected: PASS with all import console tests green.

- [ ] **Step 5: Commit**

```bash
git add apps/admin/app/\(dashboard\)/spots/import/page.tsx apps/admin/src/features/import/ImportConsole.tsx apps/admin/src/features/import/ImportConsole.test.tsx apps/admin/app/login/page.tsx
git commit -m "feat: redesign import and login surfaces"
```

### Task 7: Final integration verification and documentation refresh

**Files:**
- Modify: `apps/admin/README.md`

- [ ] **Step 1: Update README for the new dashboard shell**

```md
## UI

- Toss-inspired dashboard shell
- Sidebar navigation
- KPI-first dashboard home
- Structured CRUD panels for flowers and spots
- JSON import workspace with draft-save summary
```

- [ ] **Step 2: Run full verification**

Run: `cd apps/admin && pnpm test`
Expected: PASS with all admin Vitest suites green.

Run: `cd apps/admin && NEXT_PUBLIC_SUPABASE_URL=https://example.supabase.co NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=test-publishable-key SUPABASE_SECRET_KEY=test-secret-key pnpm build`
Expected: PASS with successful Next.js production build.

- [ ] **Step 3: Commit**

```bash
git add apps/admin/README.md
git commit -m "docs: refresh admin dashboard docs"
```
