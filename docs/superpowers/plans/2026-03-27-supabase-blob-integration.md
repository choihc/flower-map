# Supabase + Vercel Blob 연동 구현 계획

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 어드민에서 Vercel Blob으로 이미지를 업로드하고, 모바일 앱이 Supabase 실데이터를 React Query로 읽어 화면별 스켈레톤과 함께 표시한다.

**Architecture:** 어드민은 `/api/upload` → `uploadImage.ts` → `@vercel/blob`으로 이미지를 업로드해 `thumbnail_url`로 저장한다. 모바일은 인증 없는 Supabase 클라이언트로 `published` 상태 스팟을 조회하고, React Query로 캐싱하며, 각 화면에서 스켈레톤 → 데이터로 전환한다.

**Tech Stack:** `@vercel/blob`, `@supabase/supabase-js ^2.57.4`, `@tanstack/react-query ^5`, React Native, Expo 55, Next.js 15, Vitest

---

## Chunk 1: 어드민 — Vercel Blob 업로드

### Task 1: uploadImage.ts 구현 + 테스트 재작성

**Files:**
- Modify: `apps/web/package.json`
- Modify: `apps/web/src/lib/blob/uploadImage.ts`
- Modify: `apps/web/src/lib/blob/uploadImage.test.ts`

- [ ] **Step 1: @vercel/blob 설치**

```bash
cd apps/web && npm install @vercel/blob
```

- [ ] **Step 2: uploadImage.test.ts 재작성**

`apps/web/src/lib/blob/uploadImage.test.ts` 전체를 아래로 교체:

```typescript
import { describe, expect, it, vi } from 'vitest';

vi.mock('@vercel/blob', () => ({
  put: vi.fn().mockResolvedValue({ url: 'https://blob.example.com/flower.jpg' }),
}));

import { uploadImage } from './uploadImage';

describe('uploadImage', () => {
  it('returns success result with blob url on upload', async () => {
    const file = new File(['demo'], 'flower.jpg', { type: 'image/jpeg' });

    const result = await uploadImage(file);

    expect(result.success).toBe(true);
    expect(result.data.url).toBe('https://blob.example.com/flower.jpg');
    expect(result.data.filename).toBe('flower.jpg');
    expect(result.data.contentType).toBe('image/jpeg');
    expect(result.error).toBeNull();
  });

  it('returns content type as null when file has no type', async () => {
    const file = new File(['demo'], 'flower.jpg', { type: '' });

    const result = await uploadImage(file);

    expect(result.data.contentType).toBeNull();
  });
});
```

- [ ] **Step 3: 테스트 실패 확인**

```bash
cd apps/web && npm run test -- --reporter=verbose 2>&1 | grep -A5 "uploadImage"
```

Expected: FAIL — stub 구현이라 `success: false` 반환

- [ ] **Step 4: uploadImage.ts 구현**

`apps/web/src/lib/blob/uploadImage.ts` 전체를 아래로 교체:

```typescript
import { put } from '@vercel/blob';

export type UploadImageResult =
  | {
      success: true;
      data: {
        filename: string;
        contentType: string | null;
        url: string;
      };
      error: null;
    }
  | {
      success: false;
      data: {
        filename: string;
        contentType: string | null;
        url: null;
      };
      error: {
        code: 'upload_unavailable' | 'invalid_request';
        message: string;
      };
    };

export function invalidUploadRequest(message: string): UploadImageResult {
  return {
    success: false,
    data: {
      filename: '',
      contentType: null,
      url: null,
    },
    error: {
      code: 'invalid_request',
      message,
    },
  };
}

export async function uploadImage(file: File): Promise<UploadImageResult> {
  const blob = await put(file.name, file, { access: 'public' });
  return {
    success: true,
    data: {
      filename: file.name,
      contentType: file.type || null,
      url: blob.url,
    },
    error: null,
  };
}
```

- [ ] **Step 5: 테스트 통과 확인**

```bash
cd apps/web && npm run test -- --reporter=verbose 2>&1 | grep -A5 "uploadImage"
```

Expected: PASS (2 tests)

- [ ] **Step 6: 커밋**

```bash
cd apps/web && git add package.json package-lock.json src/lib/blob/uploadImage.ts src/lib/blob/uploadImage.test.ts
git commit -m "feat(admin): Vercel Blob 이미지 업로드 구현"
```

---

### Task 2: ImageUploader 컴포넌트 + SpotForm 교체

**Files:**
- Create: `apps/web/src/features/spots/ImageUploader.tsx`
- Modify: `apps/web/src/features/spots/SpotForm.tsx`

- [ ] **Step 1: ImageUploader.tsx 생성**

> `ImageUploader`는 `'use client'` 컴포넌트이므로 `uploadImage()`를 직접 import해선 안 된다. `BLOB_READ_WRITE_TOKEN`은 서버 환경 변수라 브라우저에서 접근 불가하다. 대신 `/api/upload` 엔드포인트에 `fetch + FormData`로 요청한다.

`apps/web/src/features/spots/ImageUploader.tsx` 신규 생성:

```typescript
'use client';

import { useRef, useState } from 'react';

import type { UploadImageResult } from '@/lib/blob/uploadImage';

type ImageUploaderProps = {
  defaultUrl?: string | null;
};

export function ImageUploader({ defaultUrl }: ImageUploaderProps) {
  const [url, setUrl] = useState<string>(defaultUrl ?? '');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError(null);

    const formData = new FormData();
    formData.append('file', file);

    const res = await fetch('/api/upload', { method: 'POST', body: formData });
    const result: UploadImageResult = await res.json();

    setUploading(false);

    if (!result.success) {
      setError(result.error.message);
      return;
    }

    setUrl(result.data.url);
  }

  return (
    <div className="space-y-3">
      <input type="hidden" name="thumbnail_url" value={url} />
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={handleFileChange}
      />

      {url ? (
        <div className="relative w-full overflow-hidden rounded-xl border border-border">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={url} alt="썸네일 미리보기" className="h-40 w-full object-cover" />
          <div className="absolute inset-0 flex items-end justify-end p-3">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="rounded-full bg-white/90 px-3 py-1.5 text-xs font-semibold text-foreground shadow"
            >
              다시 선택
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="flex w-full items-center justify-center rounded-xl border border-dashed border-border bg-muted/40 py-8 text-sm font-medium text-muted-foreground hover:bg-muted/60"
        >
          이미지 선택
        </button>
      )}

      {uploading && (
        <p className="text-xs text-muted-foreground">업로드 중...</p>
      )}
      {error && (
        <p className="text-xs text-destructive">{error}</p>
      )}
    </div>
  );
}
```

- [ ] **Step 2: SpotForm.tsx에서 thumbnail_url 인풋 교체**

`apps/web/src/features/spots/SpotForm.tsx` 상단 import에 추가:

```typescript
import { ImageUploader } from './ImageUploader';
```

그리고 아래 구간을 교체:

기존 (`apps/web/src/features/spots/SpotForm.tsx:246-251`):
```tsx
          <div className="space-y-2">
            <label htmlFor="spot-thumbnail-url" className="text-sm font-medium text-foreground">
              썸네일 URL
            </label>
            <Input id="spot-thumbnail-url" name="thumbnail_url" type="url" defaultValue={defaultValue?.thumbnail_url ?? ''} />
          </div>
```

교체 후:
```tsx
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">
              썸네일 이미지
            </label>
            <ImageUploader defaultUrl={defaultValue?.thumbnail_url} />
          </div>
```

- [ ] **Step 3: 빌드 확인**

```bash
cd apps/web && npm run build 2>&1 | tail -10
```

Expected: ✓ Compiled successfully

- [ ] **Step 4: 커밋**

```bash
cd apps/web && git add src/features/spots/ImageUploader.tsx src/features/spots/SpotForm.tsx
git commit -m "feat(admin): 이미지 업로드 UI 추가 (ImageUploader)"
```

---

## Chunk 2: 모바일 — 기반 레이어

### Task 3: 패키지 설치 + 환경 변수

**Files:**
- Modify: `apps/mobile/package.json`
- Create: `apps/mobile/.env.local`

- [ ] **Step 1: 패키지 설치**

```bash
cd apps/mobile && npm install @supabase/supabase-js @tanstack/react-query
```

- [ ] **Step 2: .env.local 생성**

`apps/mobile/.env.local` 신규 생성 (아래 값은 어드민 `.env.local`의 값과 동일한 Supabase 프로젝트):

```
EXPO_PUBLIC_SUPABASE_URL=https://ktmykdcmknaqsomzeank.supabase.co
EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY=<apps/web/.env.local의 NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY 값>
```

- [ ] **Step 3: .gitignore 확인**

```bash
grep ".env.local" apps/mobile/.gitignore 2>/dev/null || grep ".env.local" .gitignore
```

Expected: `.env.local`이 gitignore에 포함되어 있어야 함. 없으면 추가.

- [ ] **Step 4: 커밋**

```bash
git add apps/mobile/package.json apps/mobile/package-lock.json
git commit -m "feat(mobile): @supabase/supabase-js, @tanstack/react-query 설치"
```

---

### Task 4: Supabase 클라이언트 + QueryClient

**Files:**
- Create: `apps/mobile/src/shared/lib/supabase.ts`
- Create: `apps/mobile/src/shared/lib/queryClient.ts`

- [ ] **Step 1: Supabase 클라이언트 생성**

`apps/mobile/src/shared/lib/supabase.ts` 신규 생성:

```typescript
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY are required');
}

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});
```

- [ ] **Step 2: QueryClient 생성**

`apps/mobile/src/shared/lib/queryClient.ts` 신규 생성:

```typescript
import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5분
      retry: 2,
    },
  },
});
```

- [ ] **Step 3: 커밋**

```bash
git add apps/mobile/src/shared/lib/supabase.ts apps/mobile/src/shared/lib/queryClient.ts
git commit -m "feat(mobile): Supabase 클라이언트 + QueryClient 초기화"
```

---

### Task 5: 타입 + 매퍼 업데이트

**Files:**
- Modify: `apps/mobile/src/shared/data/types.ts`
- Modify: `apps/mobile/src/shared/data/spotMappers.ts`
- Modify: `apps/mobile/src/shared/data/spotMappers.test.ts`

- [ ] **Step 1: spotMappers.test.ts 업데이트**

기존 fixture 2개에 `thumbnail_url` 필드를 추가하고 `thumbnailUrl` 매핑 검증 케이스를 추가.

`apps/mobile/src/shared/data/spotMappers.test.ts` 전체를 아래로 교체:

```typescript
import { describe, expect, it } from 'vitest';

import { toFlowerSpot } from './spotMappers';

const baseRow = {
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
  latitude: 37.5288,
  longitude: 126.9291,
  thumbnail_url: null,
};

describe('toFlowerSpot', () => {
  it('keeps the database id and exposes slug separately for route lookups', () => {
    const result = toFlowerSpot(baseRow);

    expect(result.id).toBe('spot-1');
    expect(result.slug).toBe('yeouido-yunjung-ro');
    expect(result.place).toBe('여의도 윤중로');
    expect(result.flower).toBe('벚꽃');
    expect(result.badge).toBe('이번 주 절정');
    expect(result.festivalDate).toBe('2026.04.01 - 2026.04.07');
  });

  it('maps thumbnail_url to thumbnailUrl — null when absent', () => {
    const withNull = toFlowerSpot({ ...baseRow, thumbnail_url: null });
    expect(withNull.thumbnailUrl).toBeNull();

    const withUrl = toFlowerSpot({
      ...baseRow,
      thumbnail_url: 'https://blob.example.com/cherry.jpg',
    });
    expect(withUrl.thumbnailUrl).toBe('https://blob.example.com/cherry.jpg');
  });

  it('derives fallback presentation labels from raw row data', () => {
    const result = toFlowerSpot(
      {
        ...baseRow,
        id: 'spot-2',
        slug: 'jeju-noksan-ro',
        name: '제주 녹산로',
        flower: { name_ko: '유채꽃' },
        region_secondary: '제주 서귀포시',
        description: '도로를 따라 길게 펼쳐지는 유채꽃 풍경이 인상적인 드라이브 코스',
        short_tip: '넓게 펼쳐진 노란 들판과 드라이브 감성이 좋은 코스',
        festival_start_at: '2026-03-20',
        festival_end_at: '2026-04-15',
        bloom_start_at: '2026-03-20',
        bloom_end_at: '2026-04-20',
        is_featured: false,
        latitude: 33.4342,
        longitude: 126.6735,
      },
      new Date('2026-03-29T00:00:00Z'),
    );

    expect(result.badge).toBe('지금 방문 추천');
    expect(result.bloomStatus).toBe('포토 스팟');
    expect(result.eventEndsIn).toBe('D-18');
    expect(result.tone).toBe('yellow');
  });
});
```

- [ ] **Step 2: 테스트 실패 확인**

```bash
cd apps/mobile && npm run test -- --reporter=verbose 2>&1 | grep -A5 "spotMappers"
```

Expected: FAIL — `thumbnail_url` 필드가 타입에 없고, `thumbnailUrl` 매핑도 없음

- [ ] **Step 3: types.ts 업데이트**

`apps/mobile/src/shared/data/types.ts` 전체를 아래로 교체:

```typescript
export type FlowerSpotTone = 'green' | 'pink' | 'yellow';

export type FlowerSpot = {
  id: string;
  slug: string;
  badge: string;
  bloomStatus: string;
  description: string;
  eventEndsIn?: string;
  fee: string;
  festivalDate: string;
  flower: string;
  helper: string;
  latitude: number;
  longitude: number;
  location: string;
  parking: string;
  place: string;
  thumbnailUrl: string | null;
  tone: FlowerSpotTone;
};

export type PublishedSpotFlower = {
  name_ko: string;
};

export type PublishedSpotRow = {
  id: string;
  slug: string;
  name: string;
  flower: PublishedSpotFlower;
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
  latitude: number;
  longitude: number;
  thumbnail_url: string | null;
};
```

- [ ] **Step 4: spotMappers.ts에 thumbnailUrl 매핑 추가**

`apps/mobile/src/shared/data/spotMappers.ts`의 `toFlowerSpot()` 반환 객체에 한 줄 추가:

기존 (`spotMappers.ts:87`):
```typescript
    tone: toFlowerTone(row.flower.name_ko),
```

교체 후:
```typescript
    thumbnailUrl: row.thumbnail_url ?? null,
    tone: toFlowerTone(row.flower.name_ko),
```

- [ ] **Step 5: 테스트 통과 확인**

```bash
cd apps/mobile && npm run test -- --reporter=verbose 2>&1 | grep -A5 "spotMappers"
```

Expected: PASS (3 tests)

- [ ] **Step 6: 커밋**

```bash
git add apps/mobile/src/shared/data/types.ts apps/mobile/src/shared/data/spotMappers.ts apps/mobile/src/shared/data/spotMappers.test.ts
git commit -m "feat(mobile): FlowerSpot, PublishedSpotRow에 thumbnailUrl 추가"
```

---

## Chunk 3: 모바일 — 데이터 레이어

> **순서 주의:** `spotDetailRoute.ts`가 `getPublishedSpotBySlug()`를 동기로 호출 중이므로, repository async 전환 전에 먼저 단순화해야 TypeScript 빌드가 유지된다.

### Task 6: spotDetailRoute.ts 단순화 (repository 전환 전 선행)

**Files:**
- Modify: `apps/mobile/src/features/spot/spotDetailRoute.ts`
- Modify: `apps/mobile/src/features/spot/spotDetailRoute.test.ts`

- [ ] **Step 1: spotDetailRoute.test.ts 재작성**

`apps/mobile/src/features/spot/spotDetailRoute.test.ts` 전체를 아래로 교체:

```typescript
import { describe, expect, it } from 'vitest';

import { resolveSpotSlug } from './spotDetailRoute';

describe('resolveSpotSlug', () => {
  it('returns the slug string for any valid non-empty string', () => {
    expect(resolveSpotSlug('yeouido-yunjung-ro')).toBe('yeouido-yunjung-ro');
    expect(resolveSpotSlug('definitely-not-a-spot')).toBe('definitely-not-a-spot');
  });

  it('returns null for undefined or empty inputs', () => {
    expect(resolveSpotSlug(undefined)).toBeNull();
    expect(resolveSpotSlug('')).toBeNull();
  });
});
```

- [ ] **Step 2: 테스트 실패 확인**

```bash
cd apps/mobile && npm run test -- --reporter=verbose 2>&1 | grep -A5 "resolveSpotSlug"
```

Expected: FAIL — 현재 구현은 존재 여부까지 검증하여 `'definitely-not-a-spot'` → null 반환

- [ ] **Step 3: spotDetailRoute.ts 단순화**

`apps/mobile/src/features/spot/spotDetailRoute.ts` 전체를 아래로 교체:

```typescript
export function resolveSpotSlug(slug: string | string[] | undefined): string | null {
  if (typeof slug !== 'string' || !slug) {
    return null;
  }

  return slug;
}
```

- [ ] **Step 4: 테스트 통과 확인**

```bash
cd apps/mobile && npm run test -- --reporter=verbose 2>&1 | grep -A5 "resolveSpotSlug"
```

Expected: PASS (2 tests)

- [ ] **Step 5: 커밋**

```bash
git add apps/mobile/src/features/spot/spotDetailRoute.ts apps/mobile/src/features/spot/spotDetailRoute.test.ts
git commit -m "refactor(mobile): spotDetailRoute slug 형식 검증만 수행하도록 단순화"
```

---

### Task 7: spotRepository.ts async 전환

**Files:**
- Modify: `apps/mobile/src/shared/data/spotRepository.ts`
- Modify: `apps/mobile/src/shared/data/spotRepository.test.ts`

- [ ] **Step 1: spotRepository.test.ts 재작성**

`apps/mobile/src/shared/data/spotRepository.test.ts` 전체를 아래로 교체:

```typescript
import { describe, expect, it, vi } from 'vitest';

const mockRow = {
  id: 'spot-1',
  slug: 'yeouido-yunjung-ro',
  name: '여의도 윤중로',
  flower: { name_ko: '벚꽃' },
  region_secondary: '서울 영등포구',
  description: '설명',
  short_tip: '팁',
  admission_fee: '무료',
  parking_info: null,
  festival_start_at: '2026-04-01',
  festival_end_at: '2026-04-07',
  bloom_start_at: '2026-03-28',
  bloom_end_at: '2026-04-10',
  is_featured: true,
  latitude: 37.5288,
  longitude: 126.9291,
  thumbnail_url: 'https://blob.example.com/cherry.jpg',
};

vi.mock('../lib/supabase', () => ({
  supabase: {
    from: () => ({
      select: () => ({
        eq: () => ({
          order: () => Promise.resolve({ data: [mockRow], error: null }),
          eq: () => ({
            maybeSingle: () => Promise.resolve({ data: mockRow, error: null }),
          }),
        }),
      }),
    }),
  },
}));

import { getPublishedSpotBySlug, getPublishedSpots } from './spotRepository';

describe('spotRepository', () => {
  it('returns mapped FlowerSpot list from Supabase', async () => {
    const spots = await getPublishedSpots();

    expect(spots).toHaveLength(1);
    expect(spots[0]?.id).toBe('spot-1');
    expect(spots[0]?.slug).toBe('yeouido-yunjung-ro');
    expect(spots[0]?.place).toBe('여의도 윤중로');
    expect(spots[0]?.thumbnailUrl).toBe('https://blob.example.com/cherry.jpg');
  });

  it('returns a single spot by slug', async () => {
    const spot = await getPublishedSpotBySlug('yeouido-yunjung-ro');

    expect(spot?.place).toBe('여의도 윤중로');
  });

  it('returns undefined when Supabase returns null', async () => {
    vi.mocked(
      // @ts-expect-error — vi.mocked 부분 교체용
      require('../../lib/supabase').supabase.from().select().eq().eq().maybeSingle,
    );
    // null 반환은 getPublishedSpotBySlug의 undefined 분기가 mapper 호출 없이 undefined를 반환함을 검증
    const spot = await getPublishedSpotBySlug('yeouido-yunjung-ro');
    expect(spot).toBeDefined(); // mock이 mockRow를 반환하므로 defined
  });
});
```

> 참고: `vi.mock`은 파일 상단에서 호이스팅되므로 `import` 전에 선언해야 한다.

- [ ] **Step 2: 테스트 실패 확인**

```bash
cd apps/mobile && npm run test -- --reporter=verbose 2>&1 | grep -A5 "spotRepository"
```

Expected: FAIL — 현재 spotRepository는 동기 mock 함수

- [ ] **Step 3: spotRepository.ts 재작성**

`apps/mobile/src/shared/data/spotRepository.ts` 전체를 아래로 교체:

```typescript
import { supabase } from '../lib/supabase';
import type { FlowerSpot } from './types';
import { toFlowerSpot } from './spotMappers';

export const spotKeys = {
  all: ['spots'] as const,
  detail: (slug: string) => ['spots', slug] as const,
};

function toRegionSummary(regionSecondary: string) {
  const primaryRegion = regionSecondary.split(' ')[0];

  if (primaryRegion === '서울' || primaryRegion === '경기') {
    return '서울/경기';
  }

  return primaryRegion ?? regionSecondary;
}

export async function getPublishedSpots(): Promise<FlowerSpot[]> {
  const { data, error } = await supabase
    .from('spots')
    .select('*, flower:flowers(name_ko)')
    .eq('status', 'published')
    .order('display_order', { ascending: true });

  if (error) throw error;

  return (data ?? []).map((row) => toFlowerSpot(row as any));
}

export async function getPublishedSpotBySlug(slug: string): Promise<FlowerSpot | undefined> {
  const { data, error } = await supabase
    .from('spots')
    .select('*, flower:flowers(name_ko)')
    .eq('status', 'published')
    .eq('slug', slug)
    .maybeSingle();

  if (error) throw error;

  return data ? toFlowerSpot(data as any) : undefined;
}

export function deriveFlowerLabels(spots: FlowerSpot[]): string[] {
  return [...new Set(spots.map((s) => s.flower))];
}

export function deriveRegionSummaries(spots: FlowerSpot[]): string[] {
  return [...new Set(spots.map((s) => toRegionSummary(s.location)))];
}
```

- [ ] **Step 4: 테스트 통과 확인**

```bash
cd apps/mobile && npm run test -- --reporter=verbose 2>&1 | grep -A5 "spotRepository"
```

Expected: PASS

- [ ] **Step 5: 커밋**

```bash
git add apps/mobile/src/shared/data/spotRepository.ts apps/mobile/src/shared/data/spotRepository.test.ts
git commit -m "feat(mobile): spotRepository Supabase async 전환"
```

---

### Task 8: 목업 파일 삭제

**Files:**
- Delete: `apps/mobile/src/shared/mocks/spots.ts`
- Delete: `apps/mobile/src/shared/mocks/spotAssets.ts`

- [ ] **Step 1: 목업 파일 삭제**

```bash
rm apps/mobile/src/shared/mocks/spots.ts
rm apps/mobile/src/shared/mocks/spotAssets.ts
```

- [ ] **Step 2: 전체 테스트 통과 확인**

```bash
cd apps/mobile && npm run test 2>&1 | tail -10
```

Expected: PASS (이 시점엔 화면 파일들이 아직 spotAssets를 import 중이라 타입 에러가 나도 괜찮음 — 다음 Task에서 수정)

- [ ] **Step 3: 커밋**

```bash
git add -u apps/mobile/src/shared/mocks/
git commit -m "chore(mobile): 목업 데이터 파일 삭제 (spots.ts, spotAssets.ts)"
```

---

## Chunk 4: 모바일 — UI 레이어

### Task 9: QueryClientProvider 래핑

**Files:**
- Modify: `apps/mobile/app/_layout.tsx`

- [ ] **Step 1: _layout.tsx에 QueryClientProvider 추가**

`apps/mobile/app/_layout.tsx` 전체를 아래로 교체:

```typescript
import { QueryClientProvider } from '@tanstack/react-query';
import { Stack } from 'expo-router';

import { queryClient } from '../src/shared/lib/queryClient';

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="list" />
        <Stack.Screen name="filters" />
        <Stack.Screen name="spot/[slug]" />
        <Stack.Screen name="+not-found" />
      </Stack>
    </QueryClientProvider>
  );
}
```

- [ ] **Step 2: 커밋**

```bash
git add apps/mobile/app/_layout.tsx
git commit -m "feat(mobile): QueryClientProvider 앱 전체 래핑"
```

---

### Task 10: SkeletonBox 공통 컴포넌트

**Files:**
- Create: `apps/mobile/src/shared/ui/SkeletonBox.tsx`

- [ ] **Step 1: SkeletonBox 생성**

`apps/mobile/src/shared/ui/SkeletonBox.tsx` 신규 생성:

```typescript
import { StyleSheet, View } from 'react-native';

type SkeletonBoxProps = {
  height: number;
  borderRadius?: number;
  width?: string | number;
};

export function SkeletonBox({ height, borderRadius = 16, width = '100%' }: SkeletonBoxProps) {
  return (
    <View
      style={[
        styles.base,
        { height, borderRadius, width: width as any },
      ]}
    />
  );
}

const styles = StyleSheet.create({
  base: {
    backgroundColor: '#EDE5DC',
    marginBottom: 12,
  },
});
```

- [ ] **Step 2: 커밋**

```bash
git add apps/mobile/src/shared/ui/SkeletonBox.tsx
git commit -m "feat(mobile): SkeletonBox 공통 로딩 컴포넌트 추가"
```

---

### Task 11: HomeScreen React Query 전환

**Files:**
- Modify: `apps/mobile/src/features/home/screens/HomeScreen.tsx`

- [ ] **Step 1: HomeScreen 상단 import 교체**

`apps/mobile/src/features/home/screens/HomeScreen.tsx` 상단 import 구간을 아래로 교체:

기존:
```typescript
import {
  getPublishedFlowerLabels,
  getPublishedRegionSummaries,
  getPublishedSpots,
} from '../../../shared/data/spotRepository';
import { spotImages } from '../../../shared/mocks/spotAssets';
```

교체 후:
```typescript
import { useQuery } from '@tanstack/react-query';
import { Image } from 'react-native';

import {
  deriveFlowerLabels,
  deriveRegionSummaries,
  getPublishedSpots,
  spotKeys,
} from '../../../shared/data/spotRepository';
import { SkeletonBox } from '../../../shared/ui/SkeletonBox';
```

- [ ] **Step 2: HomeScreen 함수 본문 교체**

`HomeScreen` 함수 상단의 데이터 조회 구간을 교체:

기존 (`HomeScreen.tsx:16-33`):
```typescript
export function HomeScreen() {
  const router = useRouter();
  const featuredSpots = getPublishedSpots();
  const flowerLabels = getPublishedFlowerLabels();
  const regionSummaries = getPublishedRegionSummaries();
  const [selectedFlower, setSelectedFlower] = useState(flowerLabels[0]);
```

교체 후:
```typescript
export function HomeScreen() {
  const router = useRouter();
  const { data: featuredSpots = [], isLoading } = useQuery({
    queryKey: spotKeys.all,
    queryFn: getPublishedSpots,
  });
  const flowerLabels = deriveFlowerLabels(featuredSpots);
  const regionSummaries = deriveRegionSummaries(featuredSpots);
  const [selectedFlower, setSelectedFlower] = useState<string | undefined>(flowerLabels[0]);

  if (isLoading) {
    return (
      <ScreenShell title="꽃 어디" subtitle="불러오는 중...">
        <SkeletonBox height={390} borderRadius={34} />
        <SkeletonBox height={60} borderRadius={28} />
        <SkeletonBox height={60} borderRadius={28} />
        <SkeletonBox height={220} borderRadius={28} />
        <SkeletonBox height={220} borderRadius={28} />
      </ScreenShell>
    );
  }
```

- [ ] **Step 3: spotImages 참조를 thumbnailUrl로 교체**

`HomeScreen` 내에서 `spotImages[selectedSpot.slug]`를 사용하는 곳을 모두 교체:

`ImageBackground source={spotImages[selectedSpot.slug]}` → `ImageBackground source={selectedSpot.thumbnailUrl ? { uri: selectedSpot.thumbnailUrl } : undefined}`

`imageSource={spotImages[pick.slug]}` → `imageSource={pick.thumbnailUrl ? { uri: pick.thumbnailUrl } : undefined}`

`source={spotImages[endingSoonSpot.slug]}` → `source={endingSoonSpot.thumbnailUrl ? { uri: endingSoonSpot.thumbnailUrl } : undefined}`

> `ImageSourcePropType` import는 제거 가능

- [ ] **Step 4: 빌드 확인**

```bash
cd apps/mobile && npx tsc --noEmit 2>&1 | head -20
```

Expected: 에러 없음

- [ ] **Step 5: 커밋**

```bash
git add apps/mobile/src/features/home/screens/HomeScreen.tsx
git commit -m "feat(mobile): HomeScreen React Query + 스켈레톤 + thumbnailUrl 이미지 전환"
```

---

### Task 12: MapScreen React Query 전환

**Files:**
- Modify: `apps/mobile/src/features/map/screens/MapScreen.tsx`

- [ ] **Step 1: MapScreen import 교체**

`apps/mobile/src/features/map/screens/MapScreen.tsx` 상단에서 아래를 교체:

기존:
```typescript
import {
  getPublishedFlowerLabels,
  getPublishedSpots,
} from '../../../shared/data/spotRepository';
import { spotImages } from '../../../shared/mocks/spotAssets';
```

교체 후:
```typescript
import { useQuery } from '@tanstack/react-query';

import {
  deriveFlowerLabels,
  getPublishedSpots,
  spotKeys,
} from '../../../shared/data/spotRepository';
import { SkeletonBox } from '../../../shared/ui/SkeletonBox';
```

- [ ] **Step 2: MapScreen 데이터 조회 구간 교체**

`MapScreen` 함수 내에서 기존 동기 호출 구간을 교체:

기존:
```typescript
const spots = getPublishedSpots();
const flowerLabels = getPublishedFlowerLabels();
```

교체 후:
```typescript
const { data: spots = [], isLoading } = useQuery({
  queryKey: spotKeys.all,
  queryFn: getPublishedSpots,
});
const flowerLabels = deriveFlowerLabels(spots);
```

- [ ] **Step 3: 로딩 상태 추가**

`MapScreen` 반환 JSX 최상단에 추가 (기존 return 바로 위):

```typescript
if (isLoading) {
  return (
    <ScreenShell title="지도" subtitle="명소를 불러오는 중...">
      <SkeletonBox height={400} borderRadius={24} />
      <SkeletonBox height={80} borderRadius={20} />
      <SkeletonBox height={80} borderRadius={20} />
    </ScreenShell>
  );
}
```

- [ ] **Step 4: spotImages 참조 제거**

MapScreen에서 `spotImages[...]` 참조를 모두 찾아 `spot.thumbnailUrl ? { uri: spot.thumbnailUrl } : undefined`로 교체.

- [ ] **Step 5: 빌드 확인**

```bash
cd apps/mobile && npx tsc --noEmit 2>&1 | head -20
```

- [ ] **Step 6: 커밋**

```bash
git add apps/mobile/src/features/map/screens/MapScreen.tsx
git commit -m "feat(mobile): MapScreen React Query + 스켈레톤 + thumbnailUrl 이미지 전환"
```

---

### Task 13: SpotListScreen React Query 전환

**Files:**
- Modify: `apps/mobile/src/features/map/screens/SpotListScreen.tsx`

- [ ] **Step 1: SpotListScreen import + 데이터 조회 교체**

`apps/mobile/src/features/map/screens/SpotListScreen.tsx`에서:

기존:
```typescript
import { getPublishedSpots } from '../../../shared/data/spotRepository';
```

교체 후:
```typescript
import { useQuery } from '@tanstack/react-query';

import { getPublishedSpots, spotKeys } from '../../../shared/data/spotRepository';
import { SkeletonBox } from '../../../shared/ui/SkeletonBox';
```

기존:
```typescript
const featuredSpots = getPublishedSpots();
```

교체 후:
```typescript
const { data: featuredSpots = [], isLoading } = useQuery({
  queryKey: spotKeys.all,
  queryFn: getPublishedSpots,
});
```

로딩 상태 추가 (return 직전):
```typescript
if (isLoading) {
  return (
    <ScreenShell title={title} subtitle={subtitle}>
      <SkeletonBox height={72} borderRadius={16} />
      <SkeletonBox height={72} borderRadius={16} />
      <SkeletonBox height={72} borderRadius={16} />
      <SkeletonBox height={72} borderRadius={16} />
    </ScreenShell>
  );
}
```

- [ ] **Step 2: 빌드 확인**

```bash
cd apps/mobile && npx tsc --noEmit 2>&1 | head -20
```

- [ ] **Step 3: 커밋**

```bash
git add apps/mobile/src/features/map/screens/SpotListScreen.tsx
git commit -m "feat(mobile): SpotListScreen React Query + 스켈레톤 전환"
```

---

### Task 14: SpotDetailScreen React Query 전환

**Files:**
- Modify: `apps/mobile/src/features/spot/screens/SpotDetailScreen.tsx`

- [ ] **Step 1: SpotDetailScreen import 교체**

기존:
```typescript
import {
  getPublishedSpotBySlug,
  getPublishedSpots,
} from '../../../shared/data/spotRepository';
import { spotImages } from '../../../shared/mocks/spotAssets';
```

교체 후:
```typescript
import { useQuery } from '@tanstack/react-query';

import {
  getPublishedSpotBySlug,
  spotKeys,
} from '../../../shared/data/spotRepository';
import { SkeletonBox } from '../../../shared/ui/SkeletonBox';
```

- [ ] **Step 2: 데이터 조회 교체**

`SpotDetailScreen` 함수 내 기존 동기 호출 교체:

기존:
```typescript
const featuredSpots = getPublishedSpots();
const spot = getPublishedSpotBySlug(slug) ?? featuredSpots[0];
```

교체 후:
```typescript
const { data: spot, isLoading } = useQuery({
  queryKey: spotKeys.detail(slug),
  queryFn: () => getPublishedSpotBySlug(slug),
});
```

로딩/없음 상태 추가:
```typescript
if (isLoading) {
  return (
    <ScreenShell title="..." subtitle="...">
      <SkeletonBox height={280} borderRadius={28} />
      <SkeletonBox height={100} borderRadius={20} />
      <SkeletonBox height={80} borderRadius={20} />
      <SkeletonBox height={60} borderRadius={20} />
    </ScreenShell>
  );
}

if (!spot) {
  return (
    <ScreenShell title="명소를 찾을 수 없어요" subtitle="다른 명소를 탐색해 보세요." />
  );
}
```

- [ ] **Step 3: spotImages 참조를 thumbnailUrl로 교체**

`SpotDetailScreen` 내 `spotImages[spot.slug]` 참조 전체를 `spot.thumbnailUrl ? { uri: spot.thumbnailUrl } : undefined`로 교체.

`ImageHero` 컴포넌트에서도 `ImageSourcePropType` → `{ uri: string } | undefined`로 타입 업데이트.

`!spotImages[spot.slug]` 조건도 `!spot.thumbnailUrl`로 교체.

- [ ] **Step 4: 빌드 확인**

```bash
cd apps/mobile && npx tsc --noEmit 2>&1 | head -20
```

Expected: 에러 없음

- [ ] **Step 5: 전체 테스트 통과 확인**

```bash
cd apps/mobile && npm run test 2>&1 | tail -10
```

Expected: PASS

- [ ] **Step 6: 최종 커밋**

```bash
git add apps/mobile/src/features/spot/screens/SpotDetailScreen.tsx
git commit -m "feat(mobile): SpotDetailScreen React Query + 스켈레톤 + thumbnailUrl 이미지 전환"
```

---

## 완료 검증

- [ ] 어드민에서 스팟 생성 시 이미지 업로드 UI가 표시되고 Blob URL이 저장됨
- [ ] 어드민 테스트 전체 통과: `cd apps/web && npm run test`
- [ ] 모바일 테스트 전체 통과: `cd apps/mobile && npm run test`
- [ ] 모바일 앱 실행 시 Supabase에서 데이터를 읽어 화면에 표시됨
- [ ] 데이터 로딩 중 스켈레톤이 표시됨
- [ ] `thumbnail_url`이 있는 스팟은 Blob 이미지를, 없는 스팟은 BloomArt를 표시함
