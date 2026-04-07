# EAS 푸시 알림 연동 구현 계획

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 앱 첫 실행 시 사용자의 푸시 토큰을 수집하여 Supabase에 저장하고, 어드민 패널에서 전체 사용자에게 푸시 알림을 발송하는 기능을 구현한다.

**Architecture:** 모바일 앱에서 `expo-notifications`로 토큰을 수집해 Supabase `push_tokens` 테이블에 저장한다. 어드민 Next.js 앱의 API Route가 이 토큰들을 조회하여 EAS Push API(`exp.host`)에 100개 단위 배치로 발송한다.

**Tech Stack:** expo-notifications, expo-device, Supabase (RLS), Next.js API Route, EAS Push API

---

## 파일 구조

### 신규 파일
| 파일 | 역할 |
|------|------|
| `supabase/migrations/20260329_push_tokens.sql` | push_tokens 테이블 + RLS 정책 |
| `apps/mobile/src/__mocks__/expo-notifications.ts` | vitest용 네이티브 모듈 목 |
| `apps/mobile/src/__mocks__/expo-device.ts` | vitest용 네이티브 모듈 목 |
| `apps/mobile/src/shared/lib/pushNotifications.ts` | 토큰 수집 + Supabase 저장 로직 |
| `apps/web/src/lib/notifications/easPushClient.ts` | EAS Push API 배치 발송 클라이언트 |
| `apps/web/src/lib/notifications/easPushClient.test.ts` | easPushClient 단위 테스트 |
| `apps/web/app/api/notifications/send/route.ts` | 발송 API Route |
| `apps/web/app/(dashboard)/notifications/page.tsx` | 어드민 발송 UI 페이지 |

### 수정 파일
| 파일 | 변경 내용 |
|------|----------|
| `apps/mobile/app.json` | expo-notifications 플러그인 추가 |
| `apps/mobile/vitest.config.ts` | expo-notifications, expo-device alias 추가 |
| `apps/mobile/app/_layout.tsx` | registerPushToken() 호출 추가 |
| `apps/web/src/features/dashboard/AdminSidebar.tsx` | "알림 발송" 메뉴 항목 추가 |
| `apps/web/src/features/dashboard/AdminSidebar.test.tsx` | 새 메뉴 항목 검증 추가 |

---

## Chunk 1: Supabase 마이그레이션 + 모바일 앱

### Task 1: Supabase push_tokens 테이블 마이그레이션

**Files:**
- Create: `supabase/migrations/20260329_push_tokens.sql`

- [ ] **Step 1: 마이그레이션 파일 작성**

```sql
-- supabase/migrations/20260329_push_tokens.sql
CREATE TABLE push_tokens (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  token       text        NOT NULL UNIQUE
                          CHECK (token LIKE 'ExponentPushToken[%]'),
  platform    text        NOT NULL CHECK (platform IN ('ios', 'android')),
  user_id     uuid        REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE push_tokens ENABLE ROW LEVEL SECURITY;

-- 앱(비로그인 포함)에서 토큰 등록 허용. CHECK constraint로 유효 토큰만 통과.
CREATE POLICY "push_tokens_insert"
ON push_tokens
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- 어드민 API(service_role)만 조회 허용
CREATE POLICY "push_tokens_select"
ON push_tokens
FOR SELECT
TO service_role
USING (true);
```

- [ ] **Step 2: Supabase 대시보드 또는 CLI로 마이그레이션 적용**

```bash
# Supabase CLI가 설정된 경우
npx supabase db push

# 또는 Supabase 대시보드 → SQL Editor에서 위 SQL 직접 실행
```

- [ ] **Step 3: 커밋**

```bash
git add supabase/migrations/20260329_push_tokens.sql
git commit -m "feat(supabase): push_tokens 테이블 및 RLS 정책 추가"
```

---

### Task 2: 모바일 앱 패키지 설치 및 설정

**Files:**
- Modify: `apps/mobile/app.json`
- Modify: `apps/mobile/vitest.config.ts`

- [ ] **Step 1: 패키지 설치**

```bash
cd apps/mobile
npx expo install expo-notifications expo-device
```

> `expo install`을 사용해야 현재 Expo SDK(~55)와 호환되는 버전이 설치된다.

- [ ] **Step 2: app.json에 expo-notifications 플러그인 추가**

`apps/mobile/app.json`의 `plugins` 배열에 추가:

```json
["expo-notifications", {
  "icon": "./assets/images/kkkoteodieicon.png",
  "color": "#FFF9F3"
}]
```

iOS `infoPlist`에 권한 설명 추가:

```json
"NSUserNotificationsUsageDescription": "주요 꽃 행사 소식을 알려드리기 위해 알림을 사용합니다."
```

최종 `app.json` 관련 부분:
```json
{
  "expo": {
    "ios": {
      "supportsTablet": true,
      "icon": "./assets/images/kkkoteodieicon.png",
      "bundleIdentifier": "com.kkoteodi.mobile",
      "infoPlist": {
        "LSApplicationQueriesSchemes": ["nmap"],
        "NSUserNotificationsUsageDescription": "주요 꽃 행사 소식을 알려드리기 위해 알림을 사용합니다."
      }
    },
    "plugins": [
      "expo-router",
      ["@mj-studio/react-native-naver-map", { "client_id": "jbgn2o8h0j" }],
      ["expo-notifications", {
        "icon": "./assets/images/kkkoteodieicon.png",
        "color": "#FFF9F3"
      }]
    ]
  }
}
```

- [ ] **Step 3: vitest.config.ts에 alias 추가**

```ts
// apps/mobile/vitest.config.ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    alias: {
      'expo-location': new URL('./src/__mocks__/expo-location.ts', import.meta.url).pathname,
      'expo-notifications': new URL('./src/__mocks__/expo-notifications.ts', import.meta.url).pathname,
      'expo-device': new URL('./src/__mocks__/expo-device.ts', import.meta.url).pathname,
    },
  },
});
```

- [ ] **Step 4: 커밋**

```bash
git add apps/mobile/app.json apps/mobile/vitest.config.ts
git commit -m "feat(mobile): expo-notifications 플러그인 추가 및 vitest alias 설정"
```

---

### Task 3: 모바일 푸시 토큰 수집 로직

**Files:**
- Create: `apps/mobile/src/__mocks__/expo-notifications.ts`
- Create: `apps/mobile/src/__mocks__/expo-device.ts`
- Create: `apps/mobile/src/shared/lib/pushNotifications.ts`
- Modify: `apps/mobile/app/_layout.tsx`

> **주의:** `expo-notifications`는 네이티브 모듈이므로 `requestAndGetLocation`과 동일한 패턴을 따른다.
> `registerPushToken` 함수 자체의 단위 테스트는 작성하지 않으며, mock 파일은 vitest가 모듈을 임포트할 수 있도록 최소한으로 구현한다.
> 검증은 실기기 테스트(Task 6)에서 수행한다.

- [ ] **Step 1: expo-notifications 목 파일 작성**

```ts
// apps/mobile/src/__mocks__/expo-notifications.ts
// vitest 환경에서 expo-notifications 네이티브 모듈 mock
// registerPushToken은 단위 테스트에서 직접 테스트하지 않으므로 최소한으로 구현한다.

export const AndroidImportance = { MAX: 5 } as const;

export async function requestPermissionsAsync() {
  return { status: 'granted' };
}

export async function getExpoPushTokenAsync(_options: { projectId?: string }) {
  return { data: 'ExponentPushToken[test-token]' };
}

export async function setNotificationChannelAsync(
  _channelId: string,
  _channel: object,
) {
  return null;
}
```

- [ ] **Step 2: expo-device 목 파일 작성**

```ts
// apps/mobile/src/__mocks__/expo-device.ts
// vitest 환경에서 expo-device 네이티브 모듈 mock

export const isDevice = true;
```

- [ ] **Step 3: pushNotifications.ts 작성**

```ts
// apps/mobile/src/shared/lib/pushNotifications.ts
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import { supabase } from './supabase';

const EAS_PROJECT_ID = 'c4af274d-b7c9-4d43-a479-00e6ae4d1944';

export async function registerPushToken(): Promise<void> {
  // 시뮬레이터/에뮬레이터에서는 푸시 토큰 획득 불가
  if (!Device.isDevice) return;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
    });
  }

  const { status } = await Notifications.requestPermissionsAsync();
  if (status !== 'granted') return;

  const { data: token } = await Notifications.getExpoPushTokenAsync({
    projectId: EAS_PROJECT_ID,
  });

  const platform = Platform.OS as 'ios' | 'android';
  await supabase
    .from('push_tokens')
    .upsert({ token, platform }, { onConflict: 'token', ignoreDuplicates: true });
}
```

- [ ] **Step 4: _layout.tsx에 registerPushToken 호출 추가**

```tsx
// apps/mobile/app/_layout.tsx
import { useEffect } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { Stack } from 'expo-router';

import { AuthProvider } from '../src/shared/context/AuthContext';
import { queryClient } from '../src/shared/lib/queryClient';
import { registerPushToken } from '../src/shared/lib/pushNotifications';

export default function RootLayout() {
  useEffect(() => {
    registerPushToken();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="list" />
          <Stack.Screen name="filters" />
          <Stack.Screen name="spot/[slug]" />
          <Stack.Screen name="auth/callback" />
          <Stack.Screen name="+not-found" />
        </Stack>
      </AuthProvider>
    </QueryClientProvider>
  );
}
```

- [ ] **Step 5: 커밋**

```bash
git add apps/mobile/src/__mocks__/expo-notifications.ts \
        apps/mobile/src/__mocks__/expo-device.ts \
        apps/mobile/src/shared/lib/pushNotifications.ts \
        apps/mobile/app/_layout.tsx
git commit -m "feat(mobile): 푸시 토큰 수집 및 Supabase 저장 로직 추가"
```

---

## Chunk 2: 어드민 API + UI

> **선행 조건:** Chunk 1 완료 후 진행 (Supabase `push_tokens` 테이블이 존재해야 Task 5 API Route가 동작함)

### Task 4: EAS Push 클라이언트 (TDD)

**Files:**
- Create: `apps/web/src/lib/notifications/easPushClient.ts`
- Create: `apps/web/src/lib/notifications/easPushClient.test.ts`

- [ ] **Step 1: 테스트 파일 작성 (실패 상태로)**

```ts
// apps/web/src/lib/notifications/easPushClient.test.ts
import { afterEach, describe, expect, it, vi } from 'vitest';

import { chunkArray, sendEasPushNotifications } from './easPushClient';

describe('chunkArray', () => {
  it('빈 배열은 빈 배열을 반환한다', () => {
    expect(chunkArray([], 100)).toEqual([]);
  });

  it('size보다 작은 배열은 단일 청크를 반환한다', () => {
    expect(chunkArray([1, 2, 3], 100)).toEqual([[1, 2, 3]]);
  });

  it('정확히 size인 배열은 단일 청크를 반환한다', () => {
    const arr = Array.from({ length: 100 }, (_, i) => i);
    const result = chunkArray(arr, 100);
    expect(result).toHaveLength(1);
    expect(result[0]).toHaveLength(100);
  });

  it('250개 배열을 100 단위로 분할하면 [100, 100, 50] 청크가 된다', () => {
    const arr = Array.from({ length: 250 }, (_, i) => i);
    const result = chunkArray(arr, 100);
    expect(result).toHaveLength(3);
    expect(result[0]).toHaveLength(100);
    expect(result[1]).toHaveLength(100);
    expect(result[2]).toHaveLength(50);
  });
});

describe('sendEasPushNotifications', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('토큰이 없으면 fetch를 호출하지 않고 { successCount: 0, failureCount: 0 }을 반환한다', async () => {
    const fetchSpy = vi.spyOn(global, 'fetch');

    const result = await sendEasPushNotifications([], '제목', '내용');

    expect(fetchSpy).not.toHaveBeenCalled();
    expect(result).toEqual({ successCount: 0, failureCount: 0 });
  });

  it('50개 토큰은 단일 EAS API 요청으로 발송한다', async () => {
    const tokens = Array.from({ length: 50 }, (_, i) => `ExponentPushToken[token-${i}]`);
    vi.spyOn(global, 'fetch').mockResolvedValue(
      new Response(
        JSON.stringify({
          data: tokens.map(() => ({ status: 'ok' })),
        }),
        { status: 200 },
      ),
    );

    const result = await sendEasPushNotifications(tokens, '제목', '내용');

    expect(global.fetch).toHaveBeenCalledTimes(1);
    expect(result.successCount).toBe(50);
    expect(result.failureCount).toBe(0);
  });

  it('250개 토큰은 3번 EAS API를 호출한다', async () => {
    const tokens = Array.from({ length: 250 }, (_, i) => `ExponentPushToken[token-${i}]`);
    vi.spyOn(global, 'fetch').mockImplementation((_url, options) => {
      const body = JSON.parse((options as RequestInit).body as string) as Array<{ to: string }>;
      return Promise.resolve(
        new Response(
          JSON.stringify({ data: body.map(() => ({ status: 'ok' })) }),
          { status: 200 },
        ),
      );
    });

    const result = await sendEasPushNotifications(tokens, '제목', '내용');

    expect(global.fetch).toHaveBeenCalledTimes(3);
    expect(result.successCount).toBe(250);
    expect(result.failureCount).toBe(0);
  });

  it('EAS API가 일부 토큰에 error 상태를 반환하면 failureCount에 반영한다', async () => {
    const tokens = ['ExponentPushToken[ok]', 'ExponentPushToken[fail]'];
    vi.spyOn(global, 'fetch').mockResolvedValue(
      new Response(
        JSON.stringify({
          data: [{ status: 'ok' }, { status: 'error', message: 'DeviceNotRegistered' }],
        }),
        { status: 200 },
      ),
    );

    const result = await sendEasPushNotifications(tokens, '제목', '내용');

    expect(result.successCount).toBe(1);
    expect(result.failureCount).toBe(1);
  });
});
```

- [ ] **Step 2: 테스트 실행 — 실패 확인**

```bash
cd apps/web && pnpm test -- src/lib/notifications/easPushClient.test.ts
```

Expected: `Cannot find module './easPushClient'`

- [ ] **Step 3: easPushClient.ts 구현**

```ts
// apps/web/src/lib/notifications/easPushClient.ts

const EAS_PUSH_URL = 'https://exp.host/--/api/v2/push/send';

type EasPushTicket =
  | { status: 'ok' }
  | { status: 'error'; message: string };

type SendResult = { successCount: number; failureCount: number };

export function chunkArray<T>(arr: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    chunks.push(arr.slice(i, i + size));
  }
  return chunks;
}

export async function sendEasPushNotifications(
  tokens: string[],
  title: string,
  body: string,
  accessToken?: string,
): Promise<SendResult> {
  if (tokens.length === 0) {
    return { successCount: 0, failureCount: 0 };
  }

  const chunks = chunkArray(tokens, 100);
  let successCount = 0;
  let failureCount = 0;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  };
  if (accessToken) {
    headers['Authorization'] = `Bearer ${accessToken}`;
  }

  for (const chunk of chunks) {
    const messages = chunk.map((to) => ({ to, title, body, sound: 'default' }));

    const res = await fetch(EAS_PUSH_URL, {
      method: 'POST',
      headers,
      body: JSON.stringify(messages),
    });

    const json = (await res.json()) as { data: EasPushTicket[] };
    for (const ticket of json.data) {
      if (ticket.status === 'ok') {
        successCount++;
      } else {
        failureCount++;
      }
    }
  }

  return { successCount, failureCount };
}
```

- [ ] **Step 4: 테스트 실행 — 통과 확인**

```bash
cd apps/web && pnpm test -- src/lib/notifications/easPushClient.test.ts
```

Expected: 모든 테스트 PASS

- [ ] **Step 5: 커밋**

```bash
git add apps/web/src/lib/notifications/easPushClient.ts \
        apps/web/src/lib/notifications/easPushClient.test.ts
git commit -m "feat(admin): EAS 푸시 알림 배치 발송 클라이언트 추가"
```

---

### Task 5: 어드민 알림 발송 API Route

**Files:**
- Create: `apps/web/app/api/notifications/send/route.ts`

> API Route 핸들러는 Next.js 런타임에 강하게 결합되어 있어 단위 테스트 대신 실기기 테스트(Task 6)로 검증한다.

- [ ] **Step 1: API Route 작성**

```ts
// apps/web/app/api/notifications/send/route.ts
import { NextResponse } from 'next/server';

import { createAdminSupabaseClient } from '@/lib/supabase/admin';
import { sendEasPushNotifications } from '@/lib/notifications/easPushClient';

export async function POST(request: Request) {
  const body = (await request.json()) as { title?: string; body?: string };

  if (!body.title?.trim() || !body.body?.trim()) {
    return NextResponse.json({ error: '제목과 내용을 입력해주세요.' }, { status: 400 });
  }

  const supabase = createAdminSupabaseClient();
  const { data: rows, error } = await supabase
    .from('push_tokens')
    .select('token');

  if (error) {
    return NextResponse.json({ error: 'DB 조회 실패' }, { status: 500 });
  }

  const tokens = (rows ?? []).map((r) => r.token);
  const accessToken = process.env.EXPO_ACCESS_TOKEN;

  const result = await sendEasPushNotifications(tokens, body.title, body.body, accessToken);

  return NextResponse.json({
    ...result,
    totalTokens: tokens.length,
  });
}
```

- [ ] **Step 2: 커밋**

```bash
git add apps/web/app/api/notifications/send/route.ts
git commit -m "feat(admin): 푸시 알림 발송 API Route 추가"
```

---

### Task 6: 어드민 발송 UI 페이지 + 사이드바

**Files:**
- Create: `apps/web/app/(dashboard)/notifications/page.tsx`
- Modify: `apps/web/src/features/dashboard/AdminSidebar.tsx`
- Modify: `apps/web/src/features/dashboard/AdminSidebar.test.tsx`

- [ ] **Step 1: AdminSidebar 테스트 먼저 업데이트 (TDD)**

기존 테스트에 "알림 발송" 링크 검증 추가:

```tsx
// apps/web/src/features/dashboard/AdminSidebar.test.tsx
import React from 'react';
import { render, screen } from '@testing-library/react';
import { within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { AdminSidebar } from './AdminSidebar';

describe('AdminSidebar', () => {
  it('renders the main navigation group including notifications menu', () => {
    render(<AdminSidebar />);

    expect(screen.getByText('꽃 어디 Admin')).toBeInTheDocument();
    const mainNav = screen.getByRole('navigation', { name: '관리 메뉴' });

    expect(within(mainNav).getByRole('link', { name: '대시보드' })).toHaveAttribute('href', '/');
    expect(within(mainNav).getByRole('link', { name: '꽃 관리' })).toHaveAttribute('href', '/flowers');
    expect(within(mainNav).getByRole('link', { name: '명소 관리' })).toHaveAttribute('href', '/spots');
    expect(within(mainNav).getByRole('link', { name: 'JSON 등록' })).toHaveAttribute('href', '/spots/import');
    expect(within(mainNav).getByRole('link', { name: '알림 발송' })).toHaveAttribute('href', '/notifications');
    expect(within(mainNav).getByRole('link', { name: '설정' })).toHaveAttribute('href', '/settings');
    expect(screen.queryByRole('navigation', { name: '환경' })).not.toBeInTheDocument();
  });
});
```

- [ ] **Step 2: 테스트 실행 — 실패 확인**

```bash
cd apps/web && pnpm test -- src/features/dashboard/AdminSidebar.test.tsx
```

Expected: `Unable to find role="link" {name: "알림 발송"}`

- [ ] **Step 3: AdminSidebar.tsx 수정**

`primaryNavItems` 배열에 알림 발송 항목 추가 (`설정` 앞에 위치):

```tsx
const primaryNavItems = [
  { href: '/', label: '대시보드' },
  { href: '/flowers', label: '꽃 관리' },
  { href: '/spots', label: '명소 관리' },
  { href: '/spots/import', label: 'JSON 등록' },
  { href: '/notifications', label: '알림 발송' },
  { href: '/settings', label: '설정' },
];
```

- [ ] **Step 4: 테스트 실행 — 통과 확인**

```bash
cd apps/web && pnpm test -- src/features/dashboard/AdminSidebar.test.tsx
```

Expected: PASS

- [ ] **Step 5: 발송 UI 페이지 작성**

```tsx
// apps/web/app/(dashboard)/notifications/page.tsx
'use client';

import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

type SendResult = {
  totalTokens: number;
  successCount: number;
  failureCount: number;
};

export default function NotificationsPage() {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<SendResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSend() {
    if (!title.trim() || !body.trim()) return;

    setLoading(true);
    setResult(null);
    setError(null);

    try {
      const res = await fetch('/api/notifications/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, body }),
      });

      if (!res.ok) {
        const json = (await res.json()) as { error?: string };
        setError(json.error ?? '발송에 실패했습니다.');
        return;
      }

      const json = (await res.json()) as SendResult;
      setResult(json);
      setTitle('');
      setBody('');
    } catch {
      setError('네트워크 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-lg space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">알림 발송</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          앱을 설치한 전체 사용자에게 푸시 알림을 발송합니다.
        </p>
      </div>

      <div className="space-y-4">
        <div className="space-y-1.5">
          <label className="text-sm font-medium" htmlFor="notif-title">제목</label>
          <Input
            id="notif-title"
            placeholder="예: 벚꽃 축제 시작!"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium" htmlFor="notif-body">내용</label>
          <Textarea
            id="notif-body"
            placeholder="예: 여의도 윤중로 벚꽃이 만개했습니다. 지금 바로 확인해보세요!"
            rows={4}
            value={body}
            onChange={(e) => setBody(e.target.value)}
          />
        </div>

        <Button
          onClick={handleSend}
          disabled={loading || !title.trim() || !body.trim()}
          className="w-full"
        >
          {loading ? '발송 중...' : '전체 발송'}
        </Button>
      </div>

      {result && (
        <div className="rounded-lg border border-green-200 bg-green-50 p-4 text-sm">
          <p className="font-medium text-green-800">발송 완료</p>
          <p className="mt-1 text-green-700">
            총 {result.totalTokens}명 중 성공 {result.successCount}건, 실패 {result.failureCount}건
          </p>
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm">
          <p className="font-medium text-red-800">오류</p>
          <p className="mt-1 text-red-700">{error}</p>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 6: 전체 어드민 테스트 실행**

```bash
cd apps/web && pnpm test
```

Expected: 모든 테스트 PASS

- [ ] **Step 7: 커밋**

```bash
git add apps/web/app/\(dashboard\)/notifications/page.tsx \
        apps/web/src/features/dashboard/AdminSidebar.tsx \
        apps/web/src/features/dashboard/AdminSidebar.test.tsx
git commit -m "feat(admin): 푸시 알림 발송 UI 및 사이드바 메뉴 추가"
```

---

## 실기기 테스트 체크리스트

Task 4-6 완료 후 아래 시나리오를 실기기로 검증한다.

> **iOS 주의:** 반드시 실기기 필요 (시뮬레이터에서 푸시 토큰 획득 불가)
> **Android 주의:** 에뮬레이터 사용 시 Google Play Services 탑재 이미지 필요 (Pixel 계열 권장)

- [ ] 앱 첫 실행 시 알림 권한 다이얼로그 표시 확인
- [ ] 권한 수락 후 Supabase `push_tokens` 테이블에 토큰 저장 확인
- [ ] 권한 거부 시 에러 없이 정상 동작 확인
- [ ] 어드민 `/notifications` 페이지 접근 확인
- [ ] 제목/내용 입력 후 발송 버튼 클릭 시 실제 디바이스로 알림 수신 확인
- [ ] 발송 완료 후 성공/실패 건수 UI 표시 확인
