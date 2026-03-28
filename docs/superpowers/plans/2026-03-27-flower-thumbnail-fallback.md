# 꽃 대표 썸네일 폴백 구현 플랜

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 명소 썸네일이 없을 때 해당 꽃의 대표 썸네일을 표시하여 이미지 폴백 체인을 `spot.thumbnailUrl → flower.thumbnailUrl → BloomArt` 3단계로 확장한다.

**Architecture:** Supabase `flowers` 테이블에 `thumbnail_url` 컬럼을 추가하고, 어드민에서 꽃 폼에 `ImageUploader`를 달아 업로드 가능하게 한다. 모바일은 쿼리에 `flower.thumbnail_url`을 포함하고, `resolveSpotImage()` 순수 헬퍼로 폴백 로직을 한 곳에 모은다.

**Tech Stack:** Supabase (migration), Next.js 15 + @vercel/blob (admin), React Native + @tanstack/react-query (mobile), Vitest

---

## Chunk 1: Supabase + 어드민

### Task 1: DB 마이그레이션 + 어드민 타입/스키마

**Files:**
- Create: `supabase/migrations/20260327_flower_thumbnail_url.sql`
- Modify: `apps/admin/src/lib/types.ts`
- Modify: `apps/admin/src/features/flowers/flowerSchema.ts`
- Modify: `apps/admin/src/features/flowers/flowerSchema.test.ts`

- [ ] **Step 1: 마이그레이션 파일 생성**

`supabase/migrations/20260327_flower_thumbnail_url.sql` 신규 생성:

```sql
ALTER TABLE flowers ADD COLUMN thumbnail_url text;
```

- [ ] **Step 2: types.ts 업데이트**

`apps/admin/src/lib/types.ts`의 `FlowerRow`와 `FlowerInsert`에 `thumbnail_url` 추가:

기존 `FlowerRow` (1-13줄):
```typescript
export type FlowerRow = {
  id: string;
  slug: string;
  name_ko: string;
  name_en: string | null;
  color_hex: string;
  season_start_month: number;
  season_end_month: number;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};
```

교체 후:
```typescript
export type FlowerRow = {
  id: string;
  slug: string;
  name_ko: string;
  name_en: string | null;
  color_hex: string;
  season_start_month: number;
  season_end_month: number;
  sort_order: number;
  is_active: boolean;
  thumbnail_url: string | null;
  created_at: string;
  updated_at: string;
};
```

기존 `FlowerInsert` (53-65줄):
```typescript
export type FlowerInsert = {
  slug: string;
  name_ko: string;
  name_en?: string | null;
  color_hex: string;
  season_start_month: number;
  season_end_month: number;
  sort_order?: number;
  is_active?: boolean;
  id?: string;
  created_at?: string;
  updated_at?: string;
};
```

교체 후:
```typescript
export type FlowerInsert = {
  slug: string;
  name_ko: string;
  name_en?: string | null;
  color_hex: string;
  season_start_month: number;
  season_end_month: number;
  sort_order?: number;
  is_active?: boolean;
  thumbnail_url?: string | null;
  id?: string;
  created_at?: string;
  updated_at?: string;
};
```

- [ ] **Step 3: flowerSchema.test.ts 업데이트 (테스트 먼저)**

`apps/admin/src/features/flowers/flowerSchema.test.ts` 전체를 아래로 교체:

```typescript
import { describe, expect, it } from 'vitest';

import { flowerSchema } from './flowerSchema';

describe('flowerSchema', () => {
  it('accepts a valid flower payload', () => {
    const result = flowerSchema.safeParse({
      slug: 'cherry-blossom',
      name_ko: '벚꽃',
      name_en: null,
      color_hex: '#F6B7C1',
      season_start_month: 3,
      season_end_month: 4,
      sort_order: 1,
      is_active: true,
    });

    expect(result.success).toBe(true);
  });

  it('accepts a flower payload with thumbnail_url', () => {
    const result = flowerSchema.safeParse({
      slug: 'cherry-blossom',
      name_ko: '벚꽃',
      color_hex: '#F6B7C1',
      season_start_month: 3,
      season_end_month: 4,
      thumbnail_url: 'https://blob.example.com/cherry.jpg',
    });

    expect(result.success).toBe(true);
    expect(result.data?.thumbnail_url).toBe('https://blob.example.com/cherry.jpg');
  });

  it('accepts a flower payload with thumbnail_url as null', () => {
    const result = flowerSchema.safeParse({
      slug: 'cherry-blossom',
      name_ko: '벚꽃',
      color_hex: '#F6B7C1',
      season_start_month: 3,
      season_end_month: 4,
      thumbnail_url: null,
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

- [ ] **Step 4: 테스트 실패 확인**

```bash
cd /Users/user/workspace/flower-map/apps/admin && npm run test -- --reporter=verbose 2>&1 | grep -A5 "flowerSchema"
```

Expected: FAIL — `thumbnail_url` 필드가 스키마에 없으므로 새 케이스 실패

- [ ] **Step 5: flowerSchema.ts 업데이트**

`apps/admin/src/features/flowers/flowerSchema.ts` 전체를 아래로 교체:

```typescript
import { z } from 'zod';

const monthSchema = z.number().int().min(1).max(12);

export const flowerSchema = z.object({
  slug: z.string().trim().min(2).regex(/^[a-z0-9-]+$/),
  name_ko: z.string().trim().min(1),
  name_en: z.string().trim().min(1).nullable().optional(),
  color_hex: z.string().trim().regex(/^#([A-Fa-f0-9]{6})$/),
  season_start_month: monthSchema,
  season_end_month: monthSchema,
  sort_order: z.number().int().default(0),
  is_active: z.boolean().default(true),
  thumbnail_url: z.string().url().nullable().optional(),
});

export type FlowerSchema = z.infer<typeof flowerSchema>;
```

- [ ] **Step 6: 테스트 통과 확인**

```bash
cd /Users/user/workspace/flower-map/apps/admin && npm run test -- --reporter=verbose 2>&1 | grep -A5 "flowerSchema"
```

Expected: PASS (4 tests)

- [ ] **Step 7: 커밋**

```bash
cd /Users/user/workspace/flower-map && git add supabase/migrations/20260327_flower_thumbnail_url.sql apps/admin/src/lib/types.ts apps/admin/src/features/flowers/flowerSchema.ts apps/admin/src/features/flowers/flowerSchema.test.ts && git commit -m "feat(admin): flowers 테이블 thumbnail_url 컬럼 추가 + 타입/스키마 업데이트"
```

---

### Task 2: 어드민 데이터 함수 업데이트

**Files:**
- Modify: `apps/admin/src/lib/data/flowers.ts`

- [ ] **Step 1: flowers.ts 업데이트**

`apps/admin/src/lib/data/flowers.ts`의 `buildFlowerWriteInput` 함수에 `thumbnail_url` 처리 추가:

기존:
```typescript
export function buildFlowerWriteInput(input: FlowerWriteDraft): FlowerInsert {
  return {
    ...input,
    name_en: emptyToNull(input.name_en),
    sort_order: input.sort_order ?? 0,
    is_active: input.is_active ?? true,
  };
}
```

교체 후:
```typescript
export function buildFlowerWriteInput(input: FlowerWriteDraft): FlowerInsert {
  return {
    ...input,
    name_en: emptyToNull(input.name_en),
    thumbnail_url: emptyToNull(input.thumbnail_url),
    sort_order: input.sort_order ?? 0,
    is_active: input.is_active ?? true,
  };
}
```

- [ ] **Step 2: 빌드 확인**

```bash
cd /Users/user/workspace/flower-map/apps/admin && npm run build 2>&1 | tail -5
```

Expected: ✓ Compiled successfully

- [ ] **Step 3: 커밋**

```bash
cd /Users/user/workspace/flower-map && git add apps/admin/src/lib/data/flowers.ts && git commit -m "feat(admin): buildFlowerWriteInput에 thumbnail_url 처리 추가"
```

---

### Task 3: FlowerForm에 ImageUploader 추가

**Files:**
- Modify: `apps/admin/src/features/flowers/FlowerForm.tsx`

- [ ] **Step 1: FlowerForm.tsx 업데이트**

`apps/admin/src/features/flowers/FlowerForm.tsx`에서:

**import 추가** (기존 imports 아래에):
```typescript
import { ImageUploader } from '@/features/spots/ImageUploader';
```

**handleSubmit의 safeParse 호출에 thumbnail_url 추가**:

기존:
```typescript
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
```

교체 후:
```typescript
    const parsed = flowerSchema.safeParse({
      slug: String(formData.get('slug') ?? ''),
      name_ko: String(formData.get('name_ko') ?? ''),
      name_en: normalizeOptionalText(formData.get('name_en')),
      color_hex: String(formData.get('color_hex') ?? ''),
      season_start_month: Number(formData.get('season_start_month')),
      season_end_month: Number(formData.get('season_end_month')),
      sort_order: Number(formData.get('sort_order') ?? 0),
      is_active: formData.get('is_active') === 'on',
      thumbnail_url: normalizeOptionalText(formData.get('thumbnail_url')),
    });
```

**"표시 설정" FormSection 아래, Separator 바로 앞에 새 섹션 추가**:

`</FormSection>` (표시 설정 섹션 닫는 태그) 바로 뒤, 마지막 `{errorMessage ...}` 전에 아래를 삽입:

```tsx
      <Separator />

      <FormSection
        title="대표 썸네일"
        description="명소 썸네일이 없을 때 표시될 꽃 대표 이미지입니다."
      >
        <ImageUploader defaultUrl={defaultValue?.thumbnail_url} />
      </FormSection>
```

- [ ] **Step 2: 빌드 확인**

```bash
cd /Users/user/workspace/flower-map/apps/admin && npm run build 2>&1 | tail -5
```

Expected: ✓ Compiled successfully

- [ ] **Step 3: 커밋**

```bash
cd /Users/user/workspace/flower-map && git add apps/admin/src/features/flowers/FlowerForm.tsx && git commit -m "feat(admin): FlowerForm에 대표 썸네일 이미지 업로드 UI 추가"
```

---

## Chunk 2: 모바일 데이터 레이어

### Task 4: 모바일 타입 + 매퍼 업데이트

**Files:**
- Modify: `apps/mobile/src/shared/data/types.ts`
- Modify: `apps/mobile/src/shared/data/spotMappers.ts`
- Modify: `apps/mobile/src/shared/data/spotMappers.test.ts`

- [ ] **Step 1: spotMappers.test.ts 업데이트 (테스트 먼저)**

`apps/mobile/src/shared/data/spotMappers.test.ts`의 `baseRow.flower`에 `thumbnail_url` 추가 + `flowerThumbnailUrl` 매핑 케이스 추가:

전체를 아래로 교체:

```typescript
import { describe, expect, it } from 'vitest';

import { toFlowerSpot } from './spotMappers';

const baseRow = {
  id: 'spot-1',
  slug: 'yeouido-yunjung-ro',
  name: '여의도 윤중로',
  flower: { name_ko: '벚꽃', thumbnail_url: null },
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

  it('maps flower.thumbnail_url to flowerThumbnailUrl', () => {
    const withNull = toFlowerSpot({ ...baseRow, flower: { name_ko: '벚꽃', thumbnail_url: null } });
    expect(withNull.flowerThumbnailUrl).toBeNull();

    const withUrl = toFlowerSpot({
      ...baseRow,
      flower: { name_ko: '벚꽃', thumbnail_url: 'https://blob.example.com/flower-cherry.jpg' },
    });
    expect(withUrl.flowerThumbnailUrl).toBe('https://blob.example.com/flower-cherry.jpg');
  });

  it('derives fallback presentation labels from raw row data', () => {
    const result = toFlowerSpot(
      {
        ...baseRow,
        id: 'spot-2',
        slug: 'jeju-noksan-ro',
        name: '제주 녹산로',
        flower: { name_ko: '유채꽃', thumbnail_url: null },
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
cd /Users/user/workspace/flower-map/apps/mobile && npm run test -- --reporter=verbose 2>&1 | grep -A10 "spotMappers"
```

Expected: FAIL — `flowerThumbnailUrl` 필드가 타입/매퍼에 없음

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
  flowerThumbnailUrl: string | null;
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
  thumbnail_url: string | null;
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

- [ ] **Step 4: spotMappers.ts 업데이트**

`apps/mobile/src/shared/data/spotMappers.ts`의 `toFlowerSpot()` 반환 객체에 `flowerThumbnailUrl` 추가:

기존:
```typescript
    thumbnailUrl: row.thumbnail_url ?? null,
    tone: toFlowerTone(row.flower.name_ko),
```

교체 후:
```typescript
    thumbnailUrl: row.thumbnail_url ?? null,
    flowerThumbnailUrl: row.flower.thumbnail_url ?? null,
    tone: toFlowerTone(row.flower.name_ko),
```

- [ ] **Step 5: 테스트 통과 확인**

```bash
cd /Users/user/workspace/flower-map/apps/mobile && npm run test -- --reporter=verbose 2>&1 | grep -A10 "spotMappers"
```

Expected: PASS (4 tests)

- [ ] **Step 6: 커밋**

```bash
cd /Users/user/workspace/flower-map && git add apps/mobile/src/shared/data/types.ts apps/mobile/src/shared/data/spotMappers.ts apps/mobile/src/shared/data/spotMappers.test.ts && git commit -m "feat(mobile): FlowerSpot에 flowerThumbnailUrl 추가 + 매퍼 업데이트"
```

---

### Task 5: resolveSpotImage 헬퍼 + 테스트

**Files:**
- Create: `apps/mobile/src/shared/lib/resolveSpotImage.ts`
- Create: `apps/mobile/src/shared/lib/resolveSpotImage.test.ts`

- [ ] **Step 1: 테스트 먼저 작성**

`apps/mobile/src/shared/lib/resolveSpotImage.test.ts` 신규 생성:

```typescript
import { describe, expect, it } from 'vitest';

import { resolveSpotImage } from './resolveSpotImage';
import type { FlowerSpot } from '../data/types';

const baseSpot: FlowerSpot = {
  id: 'spot-1',
  slug: 'test-slug',
  badge: '테스트',
  bloomStatus: '테스트',
  description: '설명',
  fee: '무료',
  festivalDate: '2026.04.01 - 2026.04.07',
  flower: '벚꽃',
  flowerThumbnailUrl: null,
  helper: '팁',
  latitude: 37.5,
  longitude: 126.9,
  location: '서울',
  parking: '정보 없음',
  place: '테스트 명소',
  thumbnailUrl: null,
  tone: 'pink',
};

describe('resolveSpotImage', () => {
  it('returns spot URL when thumbnailUrl is set', () => {
    const spot = { ...baseSpot, thumbnailUrl: 'https://blob.example.com/spot.jpg' };

    expect(resolveSpotImage(spot)).toEqual({ uri: 'https://blob.example.com/spot.jpg' });
  });

  it('returns flower URL when thumbnailUrl is null but flowerThumbnailUrl is set', () => {
    const spot = {
      ...baseSpot,
      thumbnailUrl: null,
      flowerThumbnailUrl: 'https://blob.example.com/flower.jpg',
    };

    expect(resolveSpotImage(spot)).toEqual({ uri: 'https://blob.example.com/flower.jpg' });
  });

  it('prefers spot URL over flower URL when both are set', () => {
    const spot = {
      ...baseSpot,
      thumbnailUrl: 'https://blob.example.com/spot.jpg',
      flowerThumbnailUrl: 'https://blob.example.com/flower.jpg',
    };

    expect(resolveSpotImage(spot)).toEqual({ uri: 'https://blob.example.com/spot.jpg' });
  });

  it('returns null when both thumbnailUrl and flowerThumbnailUrl are null', () => {
    expect(resolveSpotImage(baseSpot)).toBeNull();
  });
});
```

- [ ] **Step 2: 테스트 실패 확인**

```bash
cd /Users/user/workspace/flower-map/apps/mobile && npm run test -- --reporter=verbose 2>&1 | grep -A10 "resolveSpotImage"
```

Expected: FAIL — 파일이 존재하지 않으므로 에러

- [ ] **Step 3: resolveSpotImage.ts 구현**

`apps/mobile/src/shared/lib/resolveSpotImage.ts` 신규 생성:

```typescript
import type { FlowerSpot } from '../data/types';

export function resolveSpotImage(spot: FlowerSpot): { uri: string } | null {
  const url = spot.thumbnailUrl ?? spot.flowerThumbnailUrl;
  return url ? { uri: url } : null;
}
```

- [ ] **Step 4: 테스트 통과 확인**

```bash
cd /Users/user/workspace/flower-map/apps/mobile && npm run test -- --reporter=verbose 2>&1 | grep -A10 "resolveSpotImage"
```

Expected: PASS (4 tests)

- [ ] **Step 5: 커밋**

```bash
cd /Users/user/workspace/flower-map && git add apps/mobile/src/shared/lib/resolveSpotImage.ts apps/mobile/src/shared/lib/resolveSpotImage.test.ts && git commit -m "feat(mobile): resolveSpotImage 폴백 헬퍼 추가"
```

---

### Task 6: spotRepository 쿼리 업데이트

**Files:**
- Modify: `apps/mobile/src/shared/data/spotRepository.ts`
- Modify: `apps/mobile/src/shared/data/spotRepository.test.ts`

- [ ] **Step 1: spotRepository.test.ts 업데이트**

`apps/mobile/src/shared/data/spotRepository.test.ts`의 `mockRow.flower`에 `thumbnail_url` 추가:

기존:
```typescript
const mockRow = {
  ...
  flower: { name_ko: '벚꽃' },
  ...
};
```

교체 후:
```typescript
const mockRow = {
  id: 'spot-1',
  slug: 'yeouido-yunjung-ro',
  name: '여의도 윤중로',
  flower: { name_ko: '벚꽃', thumbnail_url: 'https://blob.example.com/flower-cherry.jpg' },
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
```

그리고 첫 번째 테스트에 `flowerThumbnailUrl` 검증 추가:

기존:
```typescript
    expect(spots[0]?.thumbnailUrl).toBe('https://blob.example.com/cherry.jpg');
```

교체 후:
```typescript
    expect(spots[0]?.thumbnailUrl).toBe('https://blob.example.com/cherry.jpg');
    expect(spots[0]?.flowerThumbnailUrl).toBe('https://blob.example.com/flower-cherry.jpg');
```

- [ ] **Step 2: 테스트 실행 (현재 통과 여부 확인)**

```bash
cd /Users/user/workspace/flower-map/apps/mobile && npm run test -- --reporter=verbose 2>&1 | grep -A10 "spotRepository"
```

Expected: FAIL — `flowerThumbnailUrl` 검증 실패 (쿼리에 `thumbnail_url` 미포함)

- [ ] **Step 3: spotRepository.ts 쿼리 업데이트**

`apps/mobile/src/shared/data/spotRepository.ts`에서 두 함수의 select 문을 모두 변경:

기존 (2곳):
```typescript
    .select('*, flower:flowers(name_ko)')
```

교체 후 (2곳 모두):
```typescript
    .select('*, flower:flowers(name_ko, thumbnail_url)')
```

- [ ] **Step 4: 테스트 통과 확인**

```bash
cd /Users/user/workspace/flower-map/apps/mobile && npm run test -- --reporter=verbose 2>&1 | grep -A10 "spotRepository"
```

Expected: PASS

- [ ] **Step 5: 커밋**

```bash
cd /Users/user/workspace/flower-map && git add apps/mobile/src/shared/data/spotRepository.ts apps/mobile/src/shared/data/spotRepository.test.ts && git commit -m "feat(mobile): spotRepository 쿼리에 flower.thumbnail_url 추가"
```

---

## Chunk 3: 모바일 화면

### Task 7: HomeScreen resolveSpotImage 적용

**Files:**
- Modify: `apps/mobile/src/features/home/screens/HomeScreen.tsx`

- [ ] **Step 1: HomeScreen import 추가**

`apps/mobile/src/features/home/screens/HomeScreen.tsx` 상단 import에 추가:

```typescript
import { resolveSpotImage } from '../../../shared/lib/resolveSpotImage';
```

- [ ] **Step 2: thumbnailUrl 인라인 표현식 3곳 교체**

**55번 줄 근처:**
```tsx
// 기존
source={selectedSpot.thumbnailUrl ? { uri: selectedSpot.thumbnailUrl } : undefined}

// 교체 후
source={resolveSpotImage(selectedSpot) ?? undefined}
```

**131번 줄 근처:**
```tsx
// 기존
imageSource={pick.thumbnailUrl ? { uri: pick.thumbnailUrl } : undefined}

// 교체 후
imageSource={resolveSpotImage(pick) ?? undefined}
```

**146번 줄 근처:**
```tsx
// 기존
source={endingSoonSpot.thumbnailUrl ? { uri: endingSoonSpot.thumbnailUrl } : undefined}

// 교체 후
source={resolveSpotImage(endingSoonSpot) ?? undefined}
```

- [ ] **Step 3: TypeScript 확인**

```bash
cd /Users/user/workspace/flower-map/apps/mobile && npx tsc --noEmit 2>&1 | head -20
```

Expected: 에러 없음

- [ ] **Step 4: 커밋**

```bash
cd /Users/user/workspace/flower-map && git add apps/mobile/src/features/home/screens/HomeScreen.tsx && git commit -m "feat(mobile): HomeScreen resolveSpotImage 폴백 적용"
```

---

### Task 8: MapScreen resolveSpotImage 적용

**Files:**
- Modify: `apps/mobile/src/features/map/screens/MapScreen.tsx`

- [ ] **Step 1: MapScreen import 추가**

`apps/mobile/src/features/map/screens/MapScreen.tsx` 상단 import에 추가:

```typescript
import { resolveSpotImage } from '../../../shared/lib/resolveSpotImage';
```

- [ ] **Step 2: thumbnailUrl 사용 구간 교체**

MapScreen에서 `selectedSpot.thumbnailUrl`을 사용하는 구간을 찾아 교체.

**137번 줄 `selectedSpot` 선언 바로 다음 줄(138번 줄)에** `spotImage` 로컬 변수 추가:

기존 (`MapScreen.tsx:136-138`):
```tsx
  const visibleSpots = selectedFlower === '전체' ? spots : spots.filter((spot) => spot.flower === selectedFlower);
  const selectedSpot = visibleSpots.find((spot) => spot.slug === selectedSpotSlug) ?? visibleSpots[0] ?? spots[0];

  useEffect(() => {
```

교체 후:
```tsx
  const visibleSpots = selectedFlower === '전체' ? spots : spots.filter((spot) => spot.flower === selectedFlower);
  const selectedSpot = visibleSpots.find((spot) => spot.slug === selectedSpotSlug) ?? visibleSpots[0] ?? spots[0];
  const spotImage = resolveSpotImage(selectedSpot);

  useEffect(() => {
```

**208번 줄 근처의 JSX 블록 교체:**

기존:
```tsx
        {selectedSpot.thumbnailUrl ? (
          <ImageBackground imageStyle={styles.summaryImageInner} source={{ uri: selectedSpot.thumbnailUrl }} style={styles.summaryImage}>
            <View style={styles.summaryImageShade} />
          </ImageBackground>
        ) : (
          <View style={styles.summaryArt}>
            <BloomArt size="md" tone="pink" />
          </View>
        )}
```

교체 후:
```tsx
        {spotImage ? (
          <ImageBackground imageStyle={styles.summaryImageInner} source={spotImage} style={styles.summaryImage}>
            <View style={styles.summaryImageShade} />
          </ImageBackground>
        ) : (
          <View style={styles.summaryArt}>
            <BloomArt size="md" tone="pink" />
          </View>
        )}
```

- [ ] **Step 3: TypeScript 확인**

```bash
cd /Users/user/workspace/flower-map/apps/mobile && npx tsc --noEmit 2>&1 | head -20
```

Expected: 에러 없음

- [ ] **Step 4: 커밋**

```bash
cd /Users/user/workspace/flower-map && git add apps/mobile/src/features/map/screens/MapScreen.tsx && git commit -m "feat(mobile): MapScreen resolveSpotImage 폴백 적용"
```

---

### Task 9: SpotDetailScreen resolveSpotImage 적용

**Files:**
- Modify: `apps/mobile/src/features/spot/screens/SpotDetailScreen.tsx`

- [ ] **Step 1: SpotDetailScreen import 추가**

`apps/mobile/src/features/spot/screens/SpotDetailScreen.tsx` 상단 import에 추가:

```typescript
import { resolveSpotImage } from '../../../shared/lib/resolveSpotImage';
```

- [ ] **Step 2: 두 곳 교체**

**56번 줄 근처 (imageSource prop):**
```tsx
// 기존
imageSource={spot.thumbnailUrl ? { uri: spot.thumbnailUrl } : undefined}

// 교체 후
imageSource={resolveSpotImage(spot) ?? undefined}
```

**88번 줄 근처 (BloomArt 조건):**
```tsx
// 기존
{!spot.thumbnailUrl ? <BloomArt size="lg" tone={spot.tone} /> : null}

// 교체 후
{!resolveSpotImage(spot) ? <BloomArt size="lg" tone={spot.tone} /> : null}
```

- [ ] **Step 3: TypeScript 확인**

```bash
cd /Users/user/workspace/flower-map/apps/mobile && npx tsc --noEmit 2>&1 | head -20
```

Expected: 에러 없음

- [ ] **Step 4: 전체 테스트 통과 확인**

```bash
cd /Users/user/workspace/flower-map/apps/mobile && npm run test 2>&1 | tail -5
```

Expected: PASS (전체)

```bash
cd /Users/user/workspace/flower-map/apps/admin && npm run test 2>&1 | tail -5
```

Expected: PASS (전체)

- [ ] **Step 5: 커밋**

```bash
cd /Users/user/workspace/flower-map && git add apps/mobile/src/features/spot/screens/SpotDetailScreen.tsx && git commit -m "feat(mobile): SpotDetailScreen resolveSpotImage 폴백 적용"
```

---

## 완료 검증

- [ ] 어드민 꽃 편집 화면에서 썸네일 이미지 업로드 가능
- [ ] 어드민 테스트 전체 통과: `cd apps/admin && npm run test`
- [ ] 모바일 테스트 전체 통과: `cd apps/mobile && npm run test`
- [ ] 명소 썸네일 없는 경우 꽃 썸네일 표시 (3개 화면)
- [ ] 명소 썸네일 있는 경우 명소 썸네일 우선 표시
- [ ] 둘 다 없는 경우 BloomArt 표시
