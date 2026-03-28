# 명소 사진 갤러리 구현 계획

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 명소 상세보기에서 텍스트 후기(ReviewSection)를 제거하고, spot_photos 테이블에서 불러온 갤러리 사진을 메인+썸네일+전체화면 뷰어 형태로 표시한다.

**Architecture:** Supabase에 spot_photos 테이블 추가 → import 파이프라인에서 photos 필드 upsert → 모바일에서 별도 useQuery로 사진 fetch → SpotPhotoGallery 컴포넌트 표시. 어드민 SpotForm에 독립적인 사진 CRUD 섹션 추가.

**Tech Stack:** Supabase (PostgreSQL + RLS), React Native (react-native Image/Modal), TanStack Query, Next.js 16 Server Actions, Zod, Vitest

---

## Chunk 1: DB 마이그레이션 + 타입 정의

### Task 1: spot_photos 마이그레이션 파일 생성

**Files:**
- Create: `supabase/migrations/20260328_spot_photos.sql`

- [ ] **Step 1: 마이그레이션 파일 작성**

```sql
-- supabase/migrations/20260328_spot_photos.sql

CREATE TABLE spot_photos (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  spot_id     uuid NOT NULL REFERENCES spots(id) ON DELETE CASCADE,
  url         text NOT NULL,
  sort_order  integer NOT NULL DEFAULT 0,
  caption     text,
  created_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE spot_photos ENABLE ROW LEVEL SECURITY;

-- anon + authenticated 모두 읽기 (published spot의 photos만)
CREATE POLICY "spot_photos_select"
ON spot_photos
FOR SELECT
TO anon, authenticated
USING (
  EXISTS (
    SELECT 1 FROM spots
    WHERE spots.id = spot_photos.spot_id
      AND spots.status = 'published'
  )
);

-- 어드민만 삽입
CREATE POLICY "spot_photos_insert"
ON spot_photos
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid())
);

-- 어드민만 삭제
CREATE POLICY "spot_photos_delete"
ON spot_photos
FOR DELETE
TO authenticated
USING (
  EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid())
);
```

- [ ] **Step 2: Supabase에 마이그레이션 적용**

```bash
# Supabase Dashboard SQL Editor에서 실행하거나:
supabase db push
```

- [ ] **Step 3: 커밋**

```bash
git add supabase/migrations/20260328_spot_photos.sql
git commit -m "feat(db): spot_photos 테이블 및 RLS 정책 추가"
```

---

### Task 2: 어드민 types.ts에 SpotPhoto 타입 추가

**Files:**
- Modify: `apps/admin/src/lib/types.ts`

- [ ] **Step 1: SpotPhotoRow, SpotPhotoInsert 타입 추가**

`apps/admin/src/lib/types.ts` 파일에 아래 내용을 기존 타입들 뒤에 추가:

```ts
export type SpotPhotoRow = {
  id: string;
  spot_id: string;
  url: string;
  sort_order: number;
  caption: string | null;
  created_at: string;
};

export type SpotPhotoInsert = {
  spot_id: string;
  url: string;
  sort_order?: number;
  caption?: string | null;
  id?: string;
  created_at?: string;
};
```

`Database` 타입의 `public.Tables`에 `spot_photos` 항목 추가 (`spots` 테이블 정의 아래):

```ts
      spot_photos: {
        Row: SpotPhotoRow;
        Insert: SpotPhotoInsert;
        Update: Partial<Omit<SpotPhotoInsert, 'id' | 'created_at'>>;
      };
```

- [ ] **Step 2: 커밋**

```bash
git add apps/admin/src/lib/types.ts
git commit -m "feat(admin): SpotPhotoRow, SpotPhotoInsert 타입 추가"
```

---

### Task 3: 어드민 데이터 접근 함수 생성

**Files:**
- Create: `apps/admin/src/lib/data/spotPhotos.ts`

- [ ] **Step 1: 파일 작성**

```ts
import type { SupabaseClient } from '@supabase/supabase-js';

import type { Database, SpotPhotoInsert, SpotPhotoRow } from '@/lib/types';

export async function listSpotPhotos(
  client: SupabaseClient<Database>,
  spotId: string,
): Promise<SpotPhotoRow[]> {
  const { data, error } = await (client.from('spot_photos') as any)
    .select('*')
    .eq('spot_id', spotId)
    .order('sort_order', { ascending: true });

  if (error != null) throw error;
  return (data ?? []) as SpotPhotoRow[];
}

export async function createSpotPhoto(
  client: SupabaseClient<Database>,
  input: SpotPhotoInsert,
): Promise<SpotPhotoRow> {
  const { data, error } = await (client.from('spot_photos') as any)
    .insert(input)
    .select()
    .single();

  if (error != null) throw error;
  return data as SpotPhotoRow;
}

export async function deleteSpotPhoto(
  client: SupabaseClient<Database>,
  photoId: string,
): Promise<void> {
  const { error } = await (client.from('spot_photos') as any)
    .delete()
    .eq('id', photoId);

  if (error != null) throw error;
}

export async function replaceSpotPhotos(
  client: SupabaseClient<Database>,
  spotId: string,
  photos: Array<{ url: string; sort_order?: number; caption?: string | null }>,
): Promise<void> {
  const { error: deleteError } = await (client.from('spot_photos') as any)
    .delete()
    .eq('spot_id', spotId);

  if (deleteError != null) throw deleteError;

  if (photos.length === 0) return;

  const { error: insertError } = await (client.from('spot_photos') as any).insert(
    photos.map((p) => ({
      spot_id: spotId,
      url: p.url,
      sort_order: p.sort_order ?? 0,
      caption: p.caption ?? null,
    })),
  );

  if (insertError != null) throw insertError;
}
```

- [ ] **Step 2: 커밋**

```bash
git add apps/admin/src/lib/data/spotPhotos.ts
git commit -m "feat(admin): spot_photos 데이터 접근 함수 추가"
```

---

## Chunk 2: Import 파이프라인

### Task 4: importSchema.ts에 photos 필드 추가

**Files:**
- Modify: `apps/admin/src/features/import/importSchema.ts`
- Modify: `apps/admin/src/features/import/importSchema.test.ts`

- [ ] **Step 1: 실패 테스트 작성**

`importSchema.test.ts` 파일에 아래 테스트 케이스 추가:

```ts
it('accepts photos array in spot', () => {
  const result = importPayloadSchema.safeParse({
    flower_slug: 'cherry-blossom',
    spot: {
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
      photos: [
        { url: 'https://example.com/photo1.jpg', sort_order: 0, caption: '전경' },
        { url: 'https://example.com/photo2.jpg', sort_order: 1 },
      ],
    },
  });

  expect(result.success).toBe(true);
  if (!result.success) throw new Error('Expected parse success');
  if (!('spot' in result.data)) throw new Error('Expected single-spot payload');
  expect(result.data.spot.photos).toHaveLength(2);
  expect(result.data.spot.photos[0].url).toBe('https://example.com/photo1.jpg');
});

it('defaults photos to empty array when omitted', () => {
  const result = importPayloadSchema.safeParse({
    flower_slug: 'cherry-blossom',
    spot: {
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
  });

  expect(result.success).toBe(true);
  if (!result.success) throw new Error('Expected parse success');
  if (!('spot' in result.data)) throw new Error('Expected single-spot payload');
  expect(result.data.spot.photos).toEqual([]);
});
```

- [ ] **Step 2: 테스트 실패 확인**

```bash
cd apps/admin && npm test -- importSchema
```

Expected: FAIL (photos field not yet defined)

- [ ] **Step 3: importSchema.ts 수정**

`importSchema.ts` 파일을 아래와 같이 수정:

```ts
import { z } from 'zod';

import { flowerSchema } from '../flowers/flowerSchema';
import { spotSchema } from '../spots/spotSchema';

const { flower_id: _flowerId, ...importedSpotShape } = spotSchema.shape;

const importedPhotoSchema = z.object({
  url: z.string().url(),
  sort_order: z.number().int().optional().default(0),
  caption: z.string().nullable().optional(),
});

const importedSpotSchema = z
  .object({
    ...importedSpotShape,
    thumbnail_url: z.preprocess((value) => (value === '' ? undefined : value), spotSchema.shape.thumbnail_url),
    photos: z.array(importedPhotoSchema).optional().default([]),
  })
  .superRefine((value, ctx) => {
    if (value.bloom_start_at > value.bloom_end_at) {
      ctx.addIssue({
        code: 'custom',
        message: 'bloom_start_at must be on or before bloom_end_at',
        path: ['bloom_end_at'],
      });
    }

    if (value.festival_start_at != null && value.festival_end_at != null && value.festival_start_at > value.festival_end_at) {
      ctx.addIssue({
        code: 'custom',
        message: 'festival_start_at must be on or before festival_end_at',
        path: ['festival_end_at'],
      });
    }
  });

export const importPayloadSchema = z.union([
  z.object({
    flower: flowerSchema,
    spots: z.array(importedSpotSchema).min(1),
  }),
  z.object({
    flower_slug: z.string().trim().min(2).regex(/^[a-z0-9-]+$/),
    spot: importedSpotSchema,
  }),
]);

export type ImportPayload = z.infer<typeof importPayloadSchema>;
```

- [ ] **Step 4: 테스트 통과 확인**

```bash
cd apps/admin && npm test -- importSchema
```

Expected: PASS (4 tests)

- [ ] **Step 5: 커밋**

```bash
git add apps/admin/src/features/import/importSchema.ts apps/admin/src/features/import/importSchema.test.ts
git commit -m "feat(import): importedSpotSchema에 photos 배열 필드 추가"
```

---

### Task 5: planImportWrite.ts 타입 수정

**Files:**
- Modify: `apps/admin/src/features/import/planImportWrite.ts`

Task 4 이후 `ImportPayload`의 spot 타입에 `photos` 필드가 추가된다.
`buildImportedSpotInput`에서 `photos`를 제거해야 `SpotInsert`로 변환 시 타입 오류가 없다.
또한 `PlannedSpotUpdate`에 `slug` 필드를 추가해 `actions.ts`에서 안전하게 참조할 수 있게 한다.

- [ ] **Step 1: planImportWrite.ts 수정**

```ts
import type { SpotInsert, SpotRow, SpotUpdate } from '@/lib/types';
import { buildSpotWriteInput } from '@/lib/data/spots';

import { classifyImport } from './classifyImport';
import type { ImportPayload } from './importSchema';

type ExistingSpot = Pick<SpotRow, 'id' | 'slug'>;

type PlanImportWriteOptions = {
  flowerId: string;
  existingSpots: ExistingSpot[];
};

type PlannedSpotUpdate = {
  id: string;
  slug: string;         // actions.ts에서 photosMap 조회에 사용
  input: SpotUpdate;
};

type PlanImportWriteResult = {
  toCreate: SpotInsert[];
  toUpdate: PlannedSpotUpdate[];
  errors: string[];
};

// photos 필드는 SpotInsert에 없으므로 unknown[]으로 허용 후 제거
type ImportedSpotInput = Omit<SpotInsert, 'flower_id'> & { photos?: unknown[] };

export function planImportWrite(payload: ImportPayload, options: PlanImportWriteOptions): PlanImportWriteResult {
  const incomingSpots = 'spot' in payload ? [payload.spot] : payload.spots;
  const classified = classifyImport(incomingSpots, options.existingSpots);

  if (classified.duplicates.length > 0) {
    return {
      toCreate: [],
      toUpdate: [],
      errors: classified.duplicates.map((duplicate) => `${duplicate.slug} slug is duplicated in the import payload`),
    };
  }

  return {
    toCreate: classified.toCreate.map((spot) => buildImportedSpotInput(spot as ImportedSpotInput, options.flowerId)),
    toUpdate: classified.toUpdate.map(({ incoming, existing }) => ({
      id: existing.id,
      slug: incoming.slug,   // photosMap 조회용
      input: buildImportedSpotInput(incoming as ImportedSpotInput, options.flowerId),
    })),
    errors: [],
  };
}

// photos를 destructure로 제거하고 나머지만 SpotInsert로 변환
function buildImportedSpotInput({ photos: _photos, ...spot }: ImportedSpotInput, flowerId: string): SpotInsert {
  return buildSpotWriteInput({
    ...spot,
    flower_id: flowerId,
    source_type: 'manual_json',
  });
}
```

- [ ] **Step 2: 기존 테스트 통과 확인**

```bash
cd apps/admin && npm test -- planImportWrite
```

Expected: PASS (기존 테스트 모두 통과)

- [ ] **Step 3: 커밋**

```bash
git add apps/admin/src/features/import/planImportWrite.ts
git commit -m "fix(import): PlannedSpotUpdate에 slug 추가, photos 필드 제거 처리"
```

---

### Task 6: actions.ts에 photos upsert 추가

**Files:**
- Modify: `apps/admin/src/features/import/actions.ts`

- [ ] **Step 1: actions.ts 수정**

`saveImportPayloadAction` 함수에서 spot upsert 후 photos upsert를 추가한다.
`replaceSpotPhotos` import 추가 및 slug → photos 맵 구성:

```ts
'use server';

import { revalidatePath } from 'next/cache';
import type { SupabaseClient } from '@supabase/supabase-js';

import { createFlower } from '@/lib/data/flowers';
import { createSpot, updateSpot } from '@/lib/data/spots';
import { replaceSpotPhotos } from '@/lib/data/spotPhotos';
import type { Database, FlowerRow, SpotRow } from '@/lib/types';
import { createServerSupabaseClient } from '@/lib/supabase/server';

import type { ValidationSummary } from './ImportConsole';
import { importPayloadSchema } from './importSchema';
import { planImportWrite } from './planImportWrite';

export async function saveImportPayloadAction(payload: string): Promise<ValidationSummary> {
  let parsedJson: unknown;

  try {
    parsedJson = JSON.parse(payload);
  } catch {
    return {
      created: 0,
      updated: 0,
      errors: ['유효한 JSON을 입력해 주세요.'],
    };
  }

  const parsed = importPayloadSchema.safeParse(parsedJson);

  if (!parsed.success) {
    console.error('[import] Zod validation failed:', JSON.stringify(parsed.error.issues, null, 2));
    return {
      created: 0,
      updated: 0,
      errors: parsed.error.issues.map((issue) => `[${issue.path.join('.')}] ${issue.message}`),
    };
  }

  try {
    const supabase = await createServerSupabaseClient();
    const writeClient = supabase as unknown as SupabaseClient<Database>;
    const flowerId = await resolveFlowerId(supabase, parsed.data);
    const incomingSpots = 'spot' in parsed.data ? [parsed.data.spot] : parsed.data.spots;
    const incomingSlugs = incomingSpots.map((spot) => spot.slug);
    const existingSpots = await listSpotIdentitiesBySlugs(supabase, incomingSlugs);
    const plan = planImportWrite(parsed.data, {
      flowerId,
      existingSpots,
    });

    if (plan.errors.length > 0) {
      return {
        created: 0,
        updated: 0,
        errors: plan.errors,
      };
    }

    // slug → photos 맵 구성
    const photosMap = new Map<string, Array<{ url: string; sort_order: number; caption?: string | null }>>();
    for (const spot of incomingSpots) {
      photosMap.set(spot.slug, (spot.photos ?? []).map((p) => ({
        url: p.url,
        sort_order: p.sort_order ?? 0,
        caption: p.caption ?? null,
      })));
    }

    for (const spot of plan.toCreate) {
      const created = await createSpot(writeClient, spot);
      const photos = photosMap.get(spot.slug) ?? [];
      await replaceSpotPhotos(writeClient, created.id, photos);
    }

    for (const spot of plan.toUpdate) {
      await updateSpot(writeClient, spot.id, spot.input);
      const photos = photosMap.get(spot.slug) ?? [];  // PlannedSpotUpdate.slug 사용 (string 보장)
      await replaceSpotPhotos(writeClient, spot.id, photos);
    }

    revalidatePath('/flowers');
    revalidatePath('/spots');
    revalidatePath('/spots/import');

    return {
      created: plan.toCreate.length,
      updated: plan.toUpdate.length,
      errors: [],
    };
  } catch (error) {
    console.error('[import] Unexpected error during save:', error);
    return {
      created: 0,
      updated: 0,
      errors: [getErrorMessage(error)],
    };
  }
}

// resolveFlowerId, findFlowerBySlug, listSpotIdentitiesBySlugs, getErrorMessage 함수는 기존과 동일하게 유지
```

- [ ] **Step 2: 타입 오류 확인**

```bash
cd apps/admin && npx tsc --noEmit 2>&1 | grep actions
```

Expected: 오류 없음

- [ ] **Step 3: 커밋**

```bash
git add apps/admin/src/features/import/actions.ts
git commit -m "feat(import): spot upsert 시 spot_photos 동기화 추가"
```

---

### Task 7: JSON import 파일에 photos 배열 추가 (수동 작업)

**Files:**
- Modify: `docs/import-data/*.json` (8개 파일)

> **주의**: 이 작업은 실제 대표 사진 URL을 웹에서 찾아서 입력하는 수동 작업입니다.
> Unsplash, 공식 관광청, 지자체 사이트 등 hotlinking이 허용된 출처의 URL을 사용하세요.

- [ ] **Step 1: 각 spot에 photos 배열 추가**

각 JSON 파일의 spot 객체에 아래 형식으로 추가:

```json
{
  "slug": "spot-slug",
  "name": "명소명",
  "photos": [
    { "url": "https://...", "sort_order": 0, "caption": "사진 설명" },
    { "url": "https://...", "sort_order": 1, "caption": null },
    { "url": "https://...", "sort_order": 2, "caption": null },
    { "url": "https://...", "sort_order": 3, "caption": null },
    { "url": "https://...", "sort_order": 4, "caption": null }
  ]
}
```

사진이 없는 경우 `"photos": []` 또는 필드 생략 (기본값 `[]`로 처리됨)

- [ ] **Step 2: 어드민 import 콘솔에서 각 JSON을 다시 import하여 photos 동기화**

- [ ] **Step 3: 커밋**

```bash
git add docs/import-data/
git commit -m "data: 각 명소에 대표 사진 URL 추가"
```

---

## Chunk 3: 모바일 앱

### Task 8: photoRepository.ts 작성

**Files:**
- Create: `apps/mobile/src/shared/data/photoRepository.ts`
- Create: `apps/mobile/src/shared/data/photoRepository.test.ts`

- [ ] **Step 1: 실패 테스트 작성**

```ts
// apps/mobile/src/shared/data/photoRepository.test.ts
import { describe, expect, it, vi } from 'vitest';

const mockPhotos = [
  {
    id: 'photo-1',
    spot_id: 'spot-1',
    url: 'https://example.com/photo1.jpg',
    sort_order: 0,
    caption: '전경',
    created_at: '2026-03-28T00:00:00Z',
  },
  {
    id: 'photo-2',
    spot_id: 'spot-1',
    url: 'https://example.com/photo2.jpg',
    sort_order: 1,
    caption: null,
    created_at: '2026-03-28T00:00:00Z',
  },
];

vi.mock('../lib/supabase', () => ({
  supabase: {
    from: () => ({
      select: () => ({
        eq: () => ({
          order: () => Promise.resolve({ data: mockPhotos, error: null }),
        }),
      }),
    }),
  },
}));

describe('photoRepository', () => {
  it('getPhotosBySpotId returns mapped SpotPhoto array in sort_order', async () => {
    const { getPhotosBySpotId } = await import('./photoRepository');
    const result = await getPhotosBySpotId('spot-1');

    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({
      id: 'photo-1',
      spotId: 'spot-1',
      url: 'https://example.com/photo1.jpg',
      sortOrder: 0,
      caption: '전경',
      createdAt: '2026-03-28T00:00:00Z',
    });
  });

  it('returns empty array when no photos', async () => {
    vi.doMock('../lib/supabase', () => ({
      supabase: {
        from: () => ({
          select: () => ({
            eq: () => ({
              order: () => Promise.resolve({ data: null, error: null }),
            }),
          }),
        }),
      },
    }));

    const { getPhotosBySpotId } = await import('./photoRepository');
    const result = await getPhotosBySpotId('spot-no-photos');
    expect(result).toEqual([]);
  });
});
```

- [ ] **Step 2: 테스트 실패 확인**

```bash
cd apps/mobile && npm test -- photoRepository
```

Expected: FAIL (module not found)

- [ ] **Step 3: photoRepository.ts 작성**

```ts
// apps/mobile/src/shared/data/photoRepository.ts
import { supabase } from '../lib/supabase';

export type SpotPhoto = {
  id: string;
  spotId: string;
  url: string;
  sortOrder: number;
  caption: string | null;
  createdAt: string;
};

type SpotPhotoRow = {
  id: string;
  spot_id: string;
  url: string;
  sort_order: number;
  caption: string | null;
  created_at: string;
};

function toSpotPhoto(row: SpotPhotoRow): SpotPhoto {
  return {
    id: row.id,
    spotId: row.spot_id,
    url: row.url,
    sortOrder: row.sort_order,
    caption: row.caption,
    createdAt: row.created_at,
  };
}

export const photoKeys = {
  bySpot: (spotId: string) => ['photos', spotId] as const,
};

export async function getPhotosBySpotId(spotId: string): Promise<SpotPhoto[]> {
  const { data, error } = await supabase
    .from('spot_photos')
    .select('*')
    .eq('spot_id', spotId)
    .order('sort_order', { ascending: true });

  if (error) throw error;
  return (data ?? []).map((row) => toSpotPhoto(row as SpotPhotoRow));
}
```

- [ ] **Step 4: 테스트 통과 확인**

```bash
cd apps/mobile && npm test -- photoRepository
```

Expected: PASS

- [ ] **Step 5: 커밋**

```bash
git add apps/mobile/src/shared/data/photoRepository.ts apps/mobile/src/shared/data/photoRepository.test.ts
git commit -m "feat(mobile): photoRepository 추가 (getPhotosBySpotId)"
```

---

### Task 9: SpotPhotoGallery 컴포넌트 작성

**Files:**
- Create: `apps/mobile/src/features/spot/components/SpotPhotoGallery.tsx`

- [ ] **Step 1: 컴포넌트 작성**

```tsx
// apps/mobile/src/features/spot/components/SpotPhotoGallery.tsx
import React, { useState } from 'react';
import {
  Dimensions,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import type { SpotPhoto } from '../../../shared/data/photoRepository';
import { colors } from '../../../shared/theme/colors';
import { SectionCard } from '../../../shared/ui/SectionCard';

type SpotPhotoGalleryProps = {
  photos: SpotPhoto[];
};

const SCREEN_WIDTH = Dimensions.get('window').width;
const THUMBNAIL_SIZE = 64;

export function SpotPhotoGallery({ photos }: SpotPhotoGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isViewerOpen, setIsViewerOpen] = useState(false);

  if (photos.length === 0) return null;

  const mainPhoto = photos[selectedIndex] ?? photos[0];

  return (
    <SectionCard title="사진">
      <Pressable
        onPress={() => setIsViewerOpen(true)}
        accessibilityRole="button"
        accessibilityLabel="사진 전체화면으로 보기"
      >
        <Image
          source={{ uri: mainPhoto.url }}
          style={styles.mainImage}
          resizeMode="cover"
        />
      </Pressable>

      {photos.length > 1 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.thumbnailRow}
          contentContainerStyle={styles.thumbnailContent}
        >
          {photos.map((photo, index) => (
            <Pressable
              key={photo.id}
              onPress={() => setSelectedIndex(index)}
              accessibilityRole="button"
              accessibilityLabel={`${index + 1}번째 사진 선택`}
            >
              <Image
                source={{ uri: photo.url }}
                style={[
                  styles.thumbnail,
                  index === selectedIndex && styles.thumbnailActive,
                ]}
                resizeMode="cover"
              />
            </Pressable>
          ))}
        </ScrollView>
      )}

      <Modal
        visible={isViewerOpen}
        transparent
        statusBarTranslucent
        onRequestClose={() => setIsViewerOpen(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setIsViewerOpen(false)}
          accessibilityRole="button"
          accessibilityLabel="닫기"
        >
          <SafeAreaView style={styles.modalContent} pointerEvents="box-none">
            <Image
              source={{ uri: mainPhoto.url }}
              style={styles.fullImage}
              resizeMode="contain"
            />
            {mainPhoto.caption != null && (
              <Text style={styles.caption}>{mainPhoto.caption}</Text>
            )}
            <View style={styles.closeHint}>
              <Text style={styles.closeHintText}>화면을 탭하면 닫힙니다</Text>
            </View>
          </SafeAreaView>
        </Pressable>
      </Modal>
    </SectionCard>
  );
}

const styles = StyleSheet.create({
  mainImage: {
    borderRadius: 16,
    height: SCREEN_WIDTH - 72,
    width: '100%',
  },
  thumbnailRow: {
    marginTop: 10,
  },
  thumbnailContent: {
    gap: 8,
    paddingHorizontal: 2,
  },
  thumbnail: {
    borderColor: colors.border,
    borderRadius: 10,
    borderWidth: 2,
    height: THUMBNAIL_SIZE,
    width: THUMBNAIL_SIZE,
  },
  thumbnailActive: {
    borderColor: colors.primary,
    borderWidth: 2.5,
  },
  modalOverlay: {
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.92)',
    flex: 1,
    justifyContent: 'center',
  },
  modalContent: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    width: '100%',
  },
  fullImage: {
    height: '75%',
    width: '100%',
  },
  caption: {
    color: '#fff',
    fontSize: 14,
    marginTop: 12,
    paddingHorizontal: 24,
    textAlign: 'center',
  },
  closeHint: {
    bottom: 40,
    position: 'absolute',
  },
  closeHintText: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 12,
  },
});
```

- [ ] **Step 2: 커밋**

```bash
git add apps/mobile/src/features/spot/components/SpotPhotoGallery.tsx
git commit -m "feat(mobile): SpotPhotoGallery 컴포넌트 추가 (메인+썸네일+전체화면)"
```

---

### Task 10: SpotDetailScreen 수정

**Files:**
- Modify: `apps/mobile/src/features/spot/screens/SpotDetailScreen.tsx`

- [ ] **Step 1: ReviewSection 제거, SpotPhotoGallery 추가**

`SpotDetailScreen.tsx`에서 아래 변경 적용:

1. import 변경:
```ts
// 제거:
import { ReviewSection } from '../components/ReviewSection';

// 추가 (useQuery는 이미 import되어 있으므로 중복 추가 안 함):
import { SpotPhotoGallery } from '../components/SpotPhotoGallery';
import { getPhotosBySpotId, photoKeys } from '../../../shared/data/photoRepository';
```

2. **Hook 위치 주의**: photos useQuery는 `if (isLoading)` early return **이전**, `allSpots` query 바로 아래에 선언해야 한다. React 훅은 조건부 블록 안에 넣으면 안 된다.

```ts
  const { data: spot, isLoading } = useQuery({
    queryKey: spotKeys.detail(slug),
    queryFn: () => getPublishedSpotBySlug(slug),
  });

  const { data: allSpots = [] } = useQuery({
    queryKey: spotKeys.all,
    queryFn: getPublishedSpots,
  });

  // ↓ early return 이전에 선언 (enabled로 spot 로드 후에만 실행)
  const { data: photos = [] } = useQuery({
    queryKey: photoKeys.bySpot(spot?.id ?? ''),
    queryFn: () => getPhotosBySpotId(spot!.id),
    enabled: spot !== undefined,
  });

  if (isLoading) { ... }  // early return
  if (!spot) { ... }      // early return
```

3. JSX에서 `<ReviewSection spotId={spot.id} />` 라인을 제거하고, `<SpotHeroCard ... />` 닫힌 태그 바로 아래에 추가:
```tsx
      <SpotPhotoGallery photos={photos} />
```

최종 배치 순서:
```tsx
<SpotHeroCard ... />

<SpotPhotoGallery photos={photos} />

<LikeButton ... />
<View style={styles.metaRow}>...</View>
<SectionCard title="방문 정보">...</SectionCard>
<SectionCard title="소개">...</SectionCard>
<SectionCard title="운영 팁">...</SectionCard>
{/* ReviewSection 제거 */}
<SectionCard title="비슷한 꽃 명소">...</SectionCard>
```

- [ ] **Step 2: TypeScript 오류 확인**

```bash
cd apps/mobile && npx tsc --noEmit 2>&1 | grep SpotDetailScreen
```

Expected: 오류 없음

- [ ] **Step 3: 커밋**

```bash
git add apps/mobile/src/features/spot/screens/SpotDetailScreen.tsx
git commit -m "feat(mobile): ReviewSection 제거 후 SpotPhotoGallery 추가"
```

---

## Chunk 4: 어드민 패널

### Task 11: photoActions.ts Server Actions 작성

**Files:**
- Create: `apps/admin/src/features/spots/photoActions.ts`

- [ ] **Step 1: 파일 작성**

```ts
// apps/admin/src/features/spots/photoActions.ts
'use server';

import type { SupabaseClient } from '@supabase/supabase-js';
import { revalidatePath } from 'next/cache';

import {
  createSpotPhoto,
  deleteSpotPhoto,
  listSpotPhotos,
} from '@/lib/data/spotPhotos';
import type { Database, SpotPhotoRow } from '@/lib/types';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export async function addSpotPhotoAction(
  spotId: string,
  data: { url: string; sort_order: number; caption: string | null },
): Promise<void> {
  const supabase = await createServerSupabaseClient();
  const client = supabase as unknown as SupabaseClient<Database>;
  await createSpotPhoto(client, {
    spot_id: spotId,
    url: data.url,
    sort_order: data.sort_order,
    caption: data.caption,
  });
  revalidatePath(`/spots/${spotId}`);
}

export async function deleteSpotPhotoAction(
  spotId: string,
  photoId: string,
): Promise<void> {
  const supabase = await createServerSupabaseClient();
  const client = supabase as unknown as SupabaseClient<Database>;
  await deleteSpotPhoto(client, photoId);
  revalidatePath(`/spots/${spotId}`);
}

export async function listSpotPhotosAction(spotId: string): Promise<SpotPhotoRow[]> {
  const supabase = await createServerSupabaseClient();
  const client = supabase as unknown as SupabaseClient<Database>;
  return listSpotPhotos(client, spotId);
}
```

- [ ] **Step 2: 커밋**

```bash
git add apps/admin/src/features/spots/photoActions.ts
git commit -m "feat(admin): spot_photos Server Actions 추가"
```

---

### Task 12: SpotForm.tsx에 사진 관리 섹션 추가

**Files:**
- Modify: `apps/admin/src/features/spots/SpotForm.tsx`

- [ ] **Step 1: SpotForm.tsx 수정**

파일 상단에 import 추가 (기존 `useState` import에 `useTransition` 추가):
```ts
// 기존:
import React, { useState } from 'react';
// 변경:
import React, { useState, useTransition } from 'react';

// 새로 추가:
import type { SpotPhotoRow } from '@/lib/types';
import { addSpotPhotoAction, deleteSpotPhotoAction, listSpotPhotosAction } from './photoActions';
```

`SpotFormProps` 타입에 선택적 props 추가:
```ts
type SpotFormProps = {
  defaultValue?: Partial<SpotInsert>;
  flowers: Array<Pick<FlowerRow, 'id' | 'name_ko' | 'slug'>>;
  submitAction: (value: SpotInsert) => Promise<void> | void;
  spotId?: string;
  initialPhotos?: SpotPhotoRow[];
};
```

`SpotForm` 컴포넌트 반환값을 Fragment로 감싸고 사진 관리 섹션 추가:

```tsx
export function SpotForm({ defaultValue, flowers, submitAction, spotId, initialPhotos }: SpotFormProps) {
  // ... 기존 state 유지 ...

  return (
    <>
      <form action={handleSubmit} className="space-y-6">
        {/* 기존 FormSection 내용 전부 유지 */}
      </form>

      {spotId != null && (
        <SpotPhotoManager
          spotId={spotId}
          initialPhotos={initialPhotos ?? []}
        />
      )}
    </>
  );
}
```

파일 하단(getOptionalText 함수 아래)에 `SpotPhotoManager` 컴포넌트 추가:

```tsx
function SpotPhotoManager({
  spotId,
  initialPhotos,
}: {
  spotId: string;
  initialPhotos: SpotPhotoRow[];
}) {
  const [photos, setPhotos] = React.useState<SpotPhotoRow[]>(initialPhotos);
  const [url, setUrl] = React.useState('');
  const [sortOrder, setSortOrder] = React.useState(0);
  const [caption, setCaption] = React.useState('');
  const [isPending, startTransition] = useTransition();
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);

  function refreshPhotos() {
    startTransition(async () => {
      const updated = await listSpotPhotosAction(spotId);
      setPhotos(updated);
    });
  }

  function handleAdd() {
    if (!url.trim()) return;
    setErrorMsg(null);
    startTransition(async () => {
      try {
        await addSpotPhotoAction(spotId, {
          url: url.trim(),
          sort_order: sortOrder,
          caption: caption.trim() || null,
        });
        setUrl('');
        setCaption('');
        setSortOrder(photos.length);
        const updated = await listSpotPhotosAction(spotId);
        setPhotos(updated);
      } catch (e) {
        setErrorMsg(e instanceof Error ? e.message : '사진 추가 중 오류가 발생했습니다.');
      }
    });
  }

  function handleDelete(photoId: string) {
    startTransition(async () => {
      await deleteSpotPhotoAction(spotId, photoId);
      const updated = await listSpotPhotosAction(spotId);
      setPhotos(updated);
    });
  }

  return (
    <div className="mt-6 space-y-4">
      <Separator />
      <FormSection
        title="사진 관리"
        description="명소 갤러리에 표시할 외부 URL 사진을 관리합니다."
      >
        {/* 현재 사진 목록 */}
        {photos.length > 0 && (
          <div className="space-y-2 mb-4">
            {photos.map((photo) => (
              <div
                key={photo.id}
                className="flex items-center gap-3 rounded-xl border border-border bg-background p-3 text-sm"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={photo.url}
                  alt={photo.caption ?? '사진'}
                  className="h-12 w-12 rounded-lg object-cover flex-shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <p className="truncate text-foreground font-medium">{photo.url}</p>
                  <p className="text-muted-foreground text-xs">
                    순서: {photo.sort_order}{photo.caption != null ? ` · ${photo.caption}` : ''}
                  </p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDelete(photo.id)}
                  disabled={isPending}
                >
                  삭제
                </Button>
              </div>
            ))}
          </div>
        )}

        {/* 사진 추가 폼 */}
        <div className="grid gap-3">
          <div className="space-y-1">
            <label className="text-sm font-medium text-foreground">URL</label>
            <Input
              placeholder="https://example.com/photo.jpg"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              disabled={isPending}
            />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <label className="text-sm font-medium text-foreground">순서</label>
              <Input
                type="number"
                value={sortOrder}
                onChange={(e) => setSortOrder(Number(e.target.value))}
                disabled={isPending}
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-foreground">캡션 (선택)</label>
              <Input
                placeholder="사진 설명"
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                disabled={isPending}
              />
            </div>
          </div>
          {errorMsg != null && (
            <p role="alert" className="text-sm text-destructive">{errorMsg}</p>
          )}
          <div className="flex justify-end">
            <Button
              type="button"
              onClick={handleAdd}
              disabled={isPending || !url.trim()}
            >
              {isPending ? '처리 중...' : '사진 추가'}
            </Button>
          </div>
        </div>
      </FormSection>
    </div>
  );
}
```

주의: `Button` 컴포넌트가 `variant`, `size` prop을 지원하지 않을 수 있음. `apps/admin/src/components/ui/button.tsx`를 확인하고 맞게 조정.

- [ ] **Step 2: TypeScript 오류 확인**

```bash
cd apps/admin && npx tsc --noEmit 2>&1 | grep SpotForm
```

Expected: 오류 없음

- [ ] **Step 3: 커밋**

```bash
git add apps/admin/src/features/spots/SpotForm.tsx
git commit -m "feat(admin): SpotForm에 사진 관리 섹션 추가"
```

---

### Task 13: spots/[id]/page.tsx에서 photos 로드

**Files:**
- Modify: `apps/admin/app/(dashboard)/spots/[id]/page.tsx`

- [ ] **Step 1: page.tsx 수정**

`listSpotPhotos` import 추가 및 `Promise.all`에 photos 조회 추가:

```ts
import { listSpotPhotos } from '@/lib/data/spotPhotos';
import type { Database, SpotInsert, SpotPhotoRow } from '@/lib/types';
```

```ts
  const [spot, flowers, photos] = await Promise.all([
    getSpot(dataClient, id),
    listFlowers(dataClient),
    listSpotPhotos(dataClient, id),
  ]);
```

`SpotForm` 렌더링 시 props 추가:

```tsx
          <SpotForm
            flowers={flowers}
            defaultValue={spot}
            submitAction={updateAction}
            spotId={id}
            initialPhotos={photos}
          />
```

- [ ] **Step 2: TypeScript 오류 확인**

```bash
cd apps/admin && npx tsc --noEmit 2>&1 | grep "spots/\[id\]"
```

Expected: 오류 없음

- [ ] **Step 3: 최종 빌드 확인**

```bash
cd apps/admin && npx tsc --noEmit
```

Expected: 오류 없음

- [ ] **Step 4: 커밋**

```bash
git add apps/admin/app/(dashboard)/spots/[id]/page.tsx
git commit -m "feat(admin): spot 편집 페이지에서 photos 로드 및 SpotForm에 전달"
```

---

## 완료 기준

- [ ] `spot_photos` 테이블이 Supabase에 생성되고 RLS 적용
- [ ] JSON import 시 `photos` 배열이 `spot_photos` 테이블에 동기화됨
- [ ] 모바일 SpotDetailScreen에서 `ReviewSection`이 사라지고 `SpotPhotoGallery`가 표시됨
- [ ] 사진 없는 명소는 갤러리 섹션이 숨겨짐
- [ ] 어드민 spot 편집 페이지에서 사진 추가/삭제 가능
- [ ] `npm test` (admin + mobile) 모두 통과
