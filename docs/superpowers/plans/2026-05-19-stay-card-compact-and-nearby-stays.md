# StayCard 컴팩트화 + 명소→호텔 연계 구현 플랜

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** StayCard를 가로형(112×112)으로 컴팩트화하고 길찾기 버튼을 제거하면서, 명소 상세 화면에 '주변 호텔' 섹션을 신설해 꽃 명소 ↔ 호텔 연계 동선을 강화한다.

**Architecture:** 의존성이 가장 적은 순수 헬퍼(`proximityLabel`) → 순수 함수(`findNearbyStays`) → UI 컴포넌트(`StayCard` 리뉴얼 + 호출부 2곳 정리) → 통합(`NearbyStaysSection` 신설 + `SpotDetailScreen` 삽입) 순으로 4청크 TDD. 각 청크는 독립적으로 그린 상태(타입체크 + 테스트)에 도달해야 다음 청크로 진행한다.

**Tech Stack:** TypeScript · React Native · Expo Router · vitest + @testing-library/react-native · TanStack Query

**관련 스펙:** `docs/superpowers/specs/2026-05-19-stay-card-compact-and-nearby-stays-design.md`

---

## 사전 점검

- [ ] **0-1. working tree 클린 확인 후 작업 브랜치 정리**

Run:
```bash
git status
git log --oneline -1
```
Expected: working tree clean. 현재 브랜치는 `feat/home-hocance-integration` 위에서 이어 작업 (스펙 커밋 `b91dd29` 이후).

- [ ] **0-2. 스펙 의존 사실 재확인**

Run:
```bash
grep -n "export function haversineKm" apps/mobile/src/shared/lib/location.ts
grep -n "export function isValidCoordinate" apps/mobile/src/shared/lib/coordinate.ts
grep -n "export function formatDistance" apps/mobile/src/shared/lib/location.ts
```
Expected: 세 export 모두 존재. 없으면 즉시 보고하고 중단.

- [ ] **0-3. 전체 베이스라인 그린 확인**

Run: `cd apps/mobile && pnpm test -- --run` (또는 프로젝트의 동등 명령)
Expected: 전부 PASS. 실패 케이스는 본 작업과 무관해도 베이스라인 회복 후 시작.

---

## Chunk 1: 기반 헬퍼 — `proximityLabel`

**의도:** "이 명소에서 6.2km" / "장미공원에서 5.6km" / "이 명소 바로 옆" 같은 거리 라벨을 호출부 컨텍스트별로 생성하는 단일 헬퍼. `<0.1km` 가드 정책의 단일 출처.

### Task 1: `formatProximity` 순수 함수 + 테스트

**Files:**
- Create: `apps/mobile/src/shared/lib/proximityLabel.ts`
- Create: `apps/mobile/src/shared/lib/proximityLabel.test.ts`

- [ ] **1-1. 실패 테스트 작성**

`apps/mobile/src/shared/lib/proximityLabel.test.ts`:

```ts
import { describe, expect, it } from 'vitest';

import { formatProximity } from './proximityLabel';

describe('formatProximity', () => {
  it('distanceKm가 0이면 "<subject> 바로 옆"을 반환한다', () => {
    expect(formatProximity(0, '이 명소')).toBe('이 명소 바로 옆');
  });

  it('distanceKm가 0.099 (경계 미만) 이면 "<subject> 바로 옆"을 반환한다', () => {
    expect(formatProximity(0.099, '이 명소')).toBe('이 명소 바로 옆');
  });

  it('distanceKm가 0.1 (경계 포함) 이면 formatDistance 결과를 사용한다', () => {
    // formatDistance(0.1) = "100m"
    expect(formatProximity(0.1, '이 명소')).toBe('이 명소에서 100m');
  });

  it('distanceKm가 1.0이면 "<subject>에서 1km"', () => {
    expect(formatProximity(1.0, '장미공원')).toBe('장미공원에서 1km');
  });

  it('distanceKm가 6.2면 "<subject>에서 6.2km"', () => {
    expect(formatProximity(6.2, '장미공원')).toBe('장미공원에서 6.2km');
  });

  it('subject가 빈 문자열이어도 정상 동작한다 (방어적 처리는 호출부 책임)', () => {
    expect(formatProximity(5.0, '')).toBe('에서 5km');
  });
});
```

- [ ] **1-2. 테스트 실패 확인**

Run: `cd apps/mobile && pnpm test -- --run src/shared/lib/proximityLabel.test.ts`
Expected: FAIL — "Cannot find module './proximityLabel'"

- [ ] **1-3. 최소 구현**

`apps/mobile/src/shared/lib/proximityLabel.ts`:

```ts
import { formatDistance } from './location';

const VERY_CLOSE_THRESHOLD_KM = 0.1;

/**
 * 호텔/장소 간 근접도를 사람이 읽을 수 있는 라벨로 변환한다.
 *
 * - `distanceKm < 0.1`(~100m 미만)이면 "<subject> 바로 옆"으로 치환.
 *   "이 명소에서 0m" 같은 어색한 표기를 막기 위한 가드.
 * - 그 외에는 기존 `formatDistance` 출력을 그대로 사용한다.
 */
export function formatProximity(distanceKm: number, subject: string): string {
  if (distanceKm < VERY_CLOSE_THRESHOLD_KM) {
    return `${subject} 바로 옆`;
  }
  return `${subject}에서 ${formatDistance(distanceKm)}`;
}
```

- [ ] **1-4. 테스트 통과 확인**

Run: `cd apps/mobile && pnpm test -- --run src/shared/lib/proximityLabel.test.ts`
Expected: 6 passed

- [ ] **1-5. 타입 체크**

Run: `cd apps/mobile && pnpm tsc --noEmit`
Expected: 0 errors

- [ ] **1-6. 커밋**

```bash
git add apps/mobile/src/shared/lib/proximityLabel.ts apps/mobile/src/shared/lib/proximityLabel.test.ts
git commit -m "$(cat <<'EOF'
feat(shared): formatProximity 거리 라벨 헬퍼 추가 (<0.1km는 "바로 옆")

호캉스 카드 부스트 라벨 / 명소 상세 주변 호텔 라벨을 단일 헬퍼로 통일.
formatDistance를 내부 재사용해 거리 포매팅 로직 중복을 막는다.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

### Chunk 1 종료 체크포인트

- [ ] **C1-1. 전체 타입 체크 + 전체 테스트**

Run: `cd apps/mobile && pnpm tsc --noEmit && pnpm test -- --run`
Expected: 0 type errors, 모든 기존 테스트 PASS + 신규 6건 PASS

---

## Chunk 2: 큐레이션 순수 함수 — `findNearbyStays`

**의도:** 명소 좌표 기준 1차 30km · fallback 60km 후보 산출. `usedFallback` 메타로 섹션 헤더 분기 정보까지 노출.

### Task 2: `findNearbyStays` 순수 함수 + 테스트

**Files:**
- Create: `apps/mobile/src/features/spot/lib/findNearbyStays.ts`
- Create: `apps/mobile/src/features/spot/lib/findNearbyStays.test.ts`

- [ ] **2-1. 실패 테스트 작성**

`apps/mobile/src/features/spot/lib/findNearbyStays.test.ts`:

```ts
import { describe, expect, it } from 'vitest';

import type { FlowerSpot, Stay } from '../../../shared/data/types';
import { findNearbyStays } from './findNearbyStays';

function makeStay(overrides: Partial<Stay> & { id: string; latitude: number; longitude: number }): Stay {
  return {
    id: overrides.id, slug: `slug-${overrides.id}`, name: `Stay ${overrides.id}`,
    regionPrimary: '서울', regionSecondary: '', address: '',
    latitude: overrides.latitude, longitude: overrides.longitude,
    stayType: 'city', seasonTags: [],
    seasonWindowStart: null, seasonWindowEnd: null,
    shortTagline: '', description: '', recommendationPoints: [],
    thumbnailUrl: null, bookingQueryOverride: null,
    naverRating: null, googleRating: null, ratingCapturedAt: null,
    isFeatured: false, displayOrder: 0,
    ...overrides,
  };
}

function makeSpot(id: string, latitude: number, longitude: number, place = `Spot ${id}`): FlowerSpot {
  return {
    id, slug: `spot-${id}`, badge: '', bloomEndAt: '', bloomStartAt: '',
    bloomStatus: '', description: '', fee: '', festivalDate: '',
    flower: '벚꽃', flowerIsActive: true, flowerThumbnailUrl: null,
    helper: '', latitude, longitude, location: '', parking: '',
    place, thumbnailUrl: null, tone: 'pink',
  };
}

// 위도 1도 ≈ 111km. 좌표 거리 계산을 단순화하기 위해 위도만 조정.
// (0,0) 기준: lat 0.1 ≈ 11.1km, lat 0.27 ≈ 30km, lat 0.45 ≈ 50km, lat 0.55 ≈ 61km

describe('findNearbyStays', () => {
  const spot = makeSpot('s1', 0, 0, '학동흑진주몽돌해변');

  it('좌표 결측 호텔은 후보에서 제외된다', () => {
    const stays = [
      makeStay({ id: 'a', latitude: 0.05, longitude: 0 }),                  // ~5.6km, 유효
      makeStay({ id: 'b', latitude: Number.NaN, longitude: 0 }),            // 결측
      makeStay({ id: 'c', latitude: 200, longitude: 0 }),                   // 범위 초과
    ];
    const result = findNearbyStays(spot, stays);
    expect(result.stays.map((s) => s.stay.id)).toEqual(['a']);
    expect(result.usedFallback).toBe(false);
  });

  it('30km 이내 후보가 있으면 fallback이 발동되지 않는다', () => {
    const stays = [
      makeStay({ id: 'near1', latitude: 0.1, longitude: 0 }),   // ~11km
      makeStay({ id: 'far1',  latitude: 0.45, longitude: 0 }),  // ~50km (fallback 범위)
    ];
    const result = findNearbyStays(spot, stays);
    expect(result.usedFallback).toBe(false);
    expect(result.stays.every((s) => s.distanceKm <= 30)).toBe(true);
    expect(result.stays.map((s) => s.stay.id)).toEqual(['near1']);
  });

  it('30km 이내 0개 + 60km 이내 N개면 fallback이 발동된다', () => {
    const stays = [
      makeStay({ id: 'mid1', latitude: 0.35, longitude: 0 }),  // ~39km
      makeStay({ id: 'mid2', latitude: 0.45, longitude: 0 }),  // ~50km
    ];
    const result = findNearbyStays(spot, stays);
    expect(result.usedFallback).toBe(true);
    expect(result.stays).toHaveLength(2);
  });

  it('30km/60km 모두 0개면 stays:[] + usedFallback:false', () => {
    const stays = [
      makeStay({ id: 'too-far', latitude: 0.6, longitude: 0 }),  // ~67km
    ];
    const result = findNearbyStays(spot, stays);
    expect(result.stays).toEqual([]);
    expect(result.usedFallback).toBe(false);
  });

  it('limit=3 초과 후보가 있을 때 3개로 잘린다', () => {
    const stays = [
      makeStay({ id: 'a', latitude: 0.01, longitude: 0 }),
      makeStay({ id: 'b', latitude: 0.02, longitude: 0 }),
      makeStay({ id: 'c', latitude: 0.03, longitude: 0 }),
      makeStay({ id: 'd', latitude: 0.04, longitude: 0 }),
      makeStay({ id: 'e', latitude: 0.05, longitude: 0 }),
    ];
    const result = findNearbyStays(spot, stays);
    expect(result.stays).toHaveLength(3);
  });

  it('동일 score (평점 동일·거리 동일)일 때 안정적 정렬: distanceKm 오름차순', () => {
    // 거리만 미세 차이, 평점 모두 동일
    const stays = [
      makeStay({ id: 'closer', latitude: 0.01, longitude: 0,
        naverRating: { score: 4.0, url: '' } }),
      makeStay({ id: 'farther', latitude: 0.02, longitude: 0,
        naverRating: { score: 4.0, url: '' } }),
    ];
    const result = findNearbyStays(spot, stays);
    expect(result.stays.map((s) => s.stay.id)).toEqual(['closer', 'farther']);
  });

  it('평점이 더 높아도 거리 차이가 크면 가까운 쪽이 우선 (0.7 거리 가중)', () => {
    // closer: ~1.1km, rating 3.0
    // farther: ~28km, rating 5.0
    // score_closer = 0.7*(1 - 1.1/60) + 0.3*(3/5) ≈ 0.687 + 0.180 = 0.867
    // score_farther = 0.7*(1 - 28/60) + 0.3*(5/5) ≈ 0.373 + 0.300 = 0.673
    const stays = [
      makeStay({ id: 'closer-low', latitude: 0.01, longitude: 0,
        naverRating: { score: 3.0, url: '' } }),
      makeStay({ id: 'farther-high', latitude: 0.25, longitude: 0,
        naverRating: { score: 5.0, url: '' } }),
    ];
    const result = findNearbyStays(spot, stays);
    expect(result.stays[0].stay.id).toBe('closer-low');
  });

  it('options.limit / primaryRadiusKm / fallbackRadiusKm를 커스터마이즈할 수 있다', () => {
    const stays = [
      makeStay({ id: 'a', latitude: 0.1, longitude: 0 }),   // ~11km
      makeStay({ id: 'b', latitude: 0.15, longitude: 0 }),  // ~17km
    ];
    const result = findNearbyStays(spot, stays, { limit: 1, primaryRadiusKm: 5 });
    // 1차 5km 내에는 0개 → fallback 60km로 확장
    expect(result.usedFallback).toBe(true);
    expect(result.stays).toHaveLength(1);
  });

  it('반환된 각 NearbyStay에 distanceKm와 score가 포함된다', () => {
    const stays = [makeStay({ id: 'a', latitude: 0.05, longitude: 0 })];
    const result = findNearbyStays(spot, stays);
    expect(result.stays[0]).toEqual(
      expect.objectContaining({
        stay: expect.any(Object),
        distanceKm: expect.any(Number),
        score: expect.any(Number),
      }),
    );
  });
});
```

- [ ] **2-2. 테스트 실패 확인**

Run: `cd apps/mobile && pnpm test -- --run src/features/spot/lib/findNearbyStays.test.ts`
Expected: FAIL — "Cannot find module './findNearbyStays'"

- [ ] **2-3. 구현**

`apps/mobile/src/features/spot/lib/findNearbyStays.ts`:

```ts
import type { FlowerSpot, Stay, StayRating } from '../../../shared/data/types';
import { isValidCoordinate } from '../../../shared/lib/coordinate';
import { haversineKm } from '../../../shared/lib/location';

export type NearbyStay = {
  stay: Stay;
  distanceKm: number;
  score: number;
};

export type NearbyStaysResult = {
  stays: NearbyStay[];
  usedFallback: boolean;
};

export type FindNearbyOptions = {
  limit?: number;
  primaryRadiusKm?: number;
  fallbackRadiusKm?: number;
};

const DEFAULTS = { limit: 3, primaryRadiusKm: 30, fallbackRadiusKm: 60 } as const;

function isValidRating(r: StayRating | null): r is StayRating {
  return r !== null && Number.isFinite(r.score);
}

function combineRating(stay: Stay): number | null {
  const candidates = [stay.naverRating, stay.googleRating].filter(isValidRating);
  if (candidates.length === 0) return null;
  return candidates.reduce((sum, r) => sum + r.score, 0) / candidates.length;
}

function normalizedRating(stay: Stay): number {
  const r = combineRating(stay);
  if (r === null) return 0;
  return Math.min(Math.max(r, 0), 5) / 5;
}

/**
 * 명소 좌표 기준으로 주변 호텔을 큐레이션한다.
 *
 * 처리 순서: (1) 좌표 결측 제외 → (2) 1차 반경 필터 → 0건이면 fallback 반경 필터 →
 * (3) 점수 계산 → (4) 정렬 → (5) limit 잘림.
 *
 * 점수식:
 *   score = 0.7 * (1 - distanceKm / fallbackRadiusKm) + 0.3 * normalizedRating
 *
 * 분모를 항상 fallbackRadiusKm로 고정하는 이유: 1차/2차 모두 동일 척도로 점수
 * 비교가 가능하다. 1차 반경 내 후보는 점수가 최소 (1 - primary/fallback) 이상이
 * 보장되어 fallback 후보보다 항상 높게 평가되는 구조 — 의도된 일관성.
 */
export function findNearbyStays(
  spot: FlowerSpot,
  stays: Stay[],
  options: FindNearbyOptions = {},
): NearbyStaysResult {
  const limit = options.limit ?? DEFAULTS.limit;
  const primaryRadiusKm = options.primaryRadiusKm ?? DEFAULTS.primaryRadiusKm;
  const fallbackRadiusKm = options.fallbackRadiusKm ?? DEFAULTS.fallbackRadiusKm;

  const validCoords = stays.filter((stay) =>
    isValidCoordinate(stay.latitude, stay.longitude),
  );

  const withDistance = validCoords.map((stay) => ({
    stay,
    distanceKm: haversineKm(
      { latitude: spot.latitude, longitude: spot.longitude },
      { latitude: stay.latitude, longitude: stay.longitude },
    ),
  }));

  function rank(candidates: Array<{ stay: Stay; distanceKm: number }>): NearbyStay[] {
    return candidates
      .map(({ stay, distanceKm }) => ({
        stay,
        distanceKm,
        score:
          0.7 * (1 - distanceKm / fallbackRadiusKm) +
          0.3 * normalizedRating(stay),
      }))
      .sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score;
        return a.distanceKm - b.distanceKm;
      })
      .slice(0, limit);
  }

  const primaryCandidates = withDistance.filter((c) => c.distanceKm <= primaryRadiusKm);
  if (primaryCandidates.length > 0) {
    return { stays: rank(primaryCandidates), usedFallback: false };
  }

  const fallbackCandidates = withDistance.filter((c) => c.distanceKm <= fallbackRadiusKm);
  if (fallbackCandidates.length > 0) {
    return { stays: rank(fallbackCandidates), usedFallback: true };
  }

  return { stays: [], usedFallback: false };
}
```

- [ ] **2-4. 테스트 통과 확인**

Run: `cd apps/mobile && pnpm test -- --run src/features/spot/lib/findNearbyStays.test.ts`
Expected: 9 passed

- [ ] **2-5. 타입 체크**

Run: `cd apps/mobile && pnpm tsc --noEmit`
Expected: 0 errors

- [ ] **2-6. 커밋**

```bash
git add apps/mobile/src/features/spot/lib/findNearbyStays.ts apps/mobile/src/features/spot/lib/findNearbyStays.test.ts
git commit -m "$(cat <<'EOF'
feat(spot): findNearbyStays 순수 함수 추가 (30km 우선, 60km fallback)

명소 좌표 기준 주변 호텔 큐레이션 로직. 점수 = 0.7×거리 + 0.3×평점.
좌표 결측 호텔 제외, 1차 0건 시 fallback, 동점 시 distanceKm 오름차순.
반환 구조에 usedFallback 메타 포함 (섹션 헤더 분기용).

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

### Chunk 2 종료 체크포인트

- [ ] **C2-1. 전체 타입 체크 + 전체 테스트**

Run: `cd apps/mobile && pnpm tsc --noEmit && pnpm test -- --run`
Expected: 0 type errors, 기존 모든 테스트 + 신규 15건(누적) PASS

---

## Chunk 3: StayCard 가로형 리뉴얼 + 호출부 정리

**의도:** `StayCard`를 가로형으로 전면 리뉴얼하면서 길찾기 prop을 제거하고, `boostBadge` 시그니처를 `{ label: string }`으로 일반화한다. 호출부 두 곳(`HocanceTop5Section`, `StayListScreen`)을 새 시그니처에 맞춘다.

### Task 3: StayCard 테스트 갱신 (Breaking change 전제)

**Files:**
- Modify: `apps/mobile/src/features/stays/components/StayCard.test.tsx`

- [ ] **3-1. 테스트 파일 전면 교체**

기존 `directionsDisabled` / `onPressDirections` 관련 테스트는 모두 삭제하고, 새 시그니처를 반영한다.

`apps/mobile/src/features/stays/components/StayCard.test.tsx` (전체 교체):

```tsx
import { describe, expect, it, vi } from 'vitest';
import { render } from '@testing-library/react-native';

import type { Stay } from '../../../shared/data/types';
import { StayCard } from './StayCard';

function asEl(node: unknown): HTMLElement {
  return node as unknown as HTMLElement;
}

const baseStay: Stay = {
  id: 'stay-1',
  slug: 'hotel-naru',
  name: '호텔 나루',
  regionPrimary: '인천',
  regionSecondary: '중구',
  address: '인천 중구 어디로 1',
  latitude: 37.4513,
  longitude: 126.6312,
  stayType: 'city',
  seasonTags: ['루프탑', '오션뷰', '도심야경'],
  seasonWindowStart: null,
  seasonWindowEnd: null,
  shortTagline: '인천 앞바다와 야경을 동시에',
  description: '인천 앞바다와 야경을 동시에 누리는 도심 호텔이에요.',
  recommendationPoints: [],
  thumbnailUrl: null,
  bookingQueryOverride: null,
  naverRating: null,
  googleRating: null,
  ratingCapturedAt: null,
  isFeatured: true,
  displayOrder: 1,
};

describe('StayCard (가로형)', () => {
  it('호텔명·지역·태그를 렌더링한다', () => {
    const { getByText } = render(
      <StayCard stay={baseStay} onPress={vi.fn()} onPressBook={vi.fn()} />,
    );
    expect(getByText('호텔 나루')).toBeTruthy();
    expect(getByText('인천 · 중구')).toBeTruthy();
    expect(getByText('루프탑')).toBeTruthy();
    expect(getByText('오션뷰')).toBeTruthy();
  });

  it('seasonTags는 최대 2개까지만 노출된다 (가로형 컴팩트 제약)', () => {
    const stay: Stay = { ...baseStay, seasonTags: ['t1', 't2', 't3', 't4'] };
    const { queryByText } = render(
      <StayCard stay={stay} onPress={vi.fn()} onPressBook={vi.fn()} />,
    );
    expect(queryByText('t1')).toBeTruthy();
    expect(queryByText('t2')).toBeTruthy();
    expect(queryByText('t3')).toBeNull();
  });

  it('seasonTags가 0개면 태그 영역이 미렌더', () => {
    const stay: Stay = { ...baseStay, seasonTags: [] };
    const { queryByTestId } = render(
      <StayCard stay={stay} onPress={vi.fn()} onPressBook={vi.fn()} />,
    );
    expect(queryByTestId('stay-card-tags')).toBeNull();
  });

  it('shortTagline은 가로형에서 더 이상 노출되지 않는다', () => {
    const { queryByText } = render(
      <StayCard stay={baseStay} onPress={vi.fn()} onPressBook={vi.fn()} />,
    );
    expect(queryByText('인천 앞바다와 야경을 동시에')).toBeNull();
  });

  it('길찾기 버튼이 더 이상 렌더되지 않는다', () => {
    const { queryByTestId } = render(
      <StayCard stay={baseStay} onPress={vi.fn()} onPressBook={vi.fn()} />,
    );
    expect(queryByTestId('stay-card-directions')).toBeNull();
  });

  it('두 평점이 모두 있으면 score가 높은 쪽이 표시된다', () => {
    const stay: Stay = {
      ...baseStay,
      naverRating: { score: 4.2, url: 'https://naver.com/x' },
      googleRating: { score: 4.8, url: 'https://google.com/x' },
    };
    const { getByTestId } = render(
      <StayCard stay={stay} onPress={vi.fn()} onPressBook={vi.fn()} />,
    );
    const text = asEl(getByTestId('stay-card-rating')).textContent ?? '';
    expect(text).toContain('4.8');
  });

  it('두 평점이 모두 NaN이면 평점 칩이 미렌더', () => {
    const stay: Stay = {
      ...baseStay,
      naverRating: { score: NaN, url: 'x' },
      googleRating: { score: NaN, url: 'x' },
    };
    const { queryByTestId } = render(
      <StayCard stay={stay} onPress={vi.fn()} onPressBook={vi.fn()} />,
    );
    expect(queryByTestId('stay-card-rating')).toBeNull();
  });

  it('boostBadge.label 전달 시 부스트 라인을 렌더한다', () => {
    const { getByText } = render(
      <StayCard
        stay={baseStay}
        onPress={vi.fn()}
        onPressBook={vi.fn()}
        boostBadge={{ label: '장미공원에서 5.6km' }}
      />,
    );
    // 카드 내부 렌더 텍스트는 "🌸 {label}" 형태이므로 정규식으로 부분 매칭한다.
    expect(getByText(/장미공원에서 5\.6km/)).toBeTruthy();
  });

  it('boostBadge가 null이면 부스트 라인을 미렌더', () => {
    const { queryByTestId } = render(
      <StayCard
        stay={baseStay}
        onPress={vi.fn()}
        onPressBook={vi.fn()}
        boostBadge={null}
      />,
    );
    expect(queryByTestId('stay-card-boost-badge')).toBeNull();
  });

  it('boostBadge.label이 빈 문자열이면 부스트 라인을 미렌더 (가드)', () => {
    const { queryByTestId } = render(
      <StayCard
        stay={baseStay}
        onPress={vi.fn()}
        onPressBook={vi.fn()}
        boostBadge={{ label: '' }}
      />,
    );
    expect(queryByTestId('stay-card-boost-badge')).toBeNull();
  });

  it('카드 전체 onPress 콜백이 호출된다', () => {
    const onPress = vi.fn();
    const { getByTestId } = render(
      <StayCard stay={baseStay} onPress={onPress} onPressBook={vi.fn()} />,
    );
    asEl(getByTestId('stay-card')).dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('예약 칩 탭 시 onPressBook이 호출된다', () => {
    const onPressBook = vi.fn();
    const { getByTestId } = render(
      <StayCard stay={baseStay} onPress={vi.fn()} onPressBook={onPressBook} />,
    );
    asEl(getByTestId('stay-card-book')).dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(onPressBook).toHaveBeenCalledTimes(1);
  });
});
```

- [ ] **3-2. 테스트 실패 확인**

Run: `cd apps/mobile && pnpm test -- --run src/features/stays/components/StayCard.test.tsx`
Expected: FAIL (구 prop을 받는 컴포넌트와 새 테스트의 시그니처 불일치)

### Task 4: `StayCard` 가로형 구현

**Files:**
- Modify: `apps/mobile/src/features/stays/components/StayCard.tsx` (전체 교체)

- [ ] **4-1. StayCard 전체 교체**

`apps/mobile/src/features/stays/components/StayCard.tsx`:

```tsx
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';

import type { Stay, StayRating } from '../../../shared/data/types';
import { colors } from '../../../shared/theme/colors';
import { formatStayTypeBadge } from '../lib/stayType';

export type StayCardProps = {
  stay: Stay;
  onPress: () => void;
  onPressBook: () => void;
  boostBadge?: { label: string } | null;
};

const TAG_TONE_BG = [colors.surfaceGreen, colors.softPink];
const TAG_TONE_FG = ['#2E6B35', '#8B3A4A'];

const TYPE_BADGE_BG = 'rgba(31, 41, 51, 0.92)';

function isValidRating(r: StayRating | null): r is StayRating {
  return r !== null && Number.isFinite(r.score);
}

function pickTopRating(stay: Stay): StayRating | null {
  const candidates = [stay.naverRating, stay.googleRating].filter(isValidRating);
  if (candidates.length === 0) return null;
  return candidates.reduce((a, b) => (a.score >= b.score ? a : b));
}

export function StayCard({ stay, onPress, onPressBook, boostBadge }: StayCardProps) {
  const tags = stay.seasonTags.slice(0, 2);
  const rating = pickTopRating(stay);
  const showBoost = boostBadge != null && boostBadge.label.length > 0;

  return (
    <Pressable testID="stay-card" onPress={onPress} style={styles.card}>
      <View style={styles.hero}>
        {stay.thumbnailUrl ? (
          <Image
            testID="stay-card-thumbnail"
            resizeMode="cover"
            source={{ uri: stay.thumbnailUrl }}
            style={styles.heroImage}
          />
        ) : (
          <View style={[styles.heroImage, styles.heroPlaceholder]} />
        )}
        <View style={styles.typeBadge}>
          <Text style={styles.typeBadgeText}>{formatStayTypeBadge(stay.stayType)}</Text>
        </View>
      </View>

      <View style={styles.body}>
        <View style={styles.nameRow}>
          <Text style={styles.name} numberOfLines={1}>{stay.name}</Text>
          {rating ? (
            <Text testID="stay-card-rating" style={styles.rating}>
              ★ {rating.score.toFixed(1)}
            </Text>
          ) : null}
        </View>

        <Text style={styles.region} numberOfLines={1}>
          {stay.regionPrimary} · {stay.regionSecondary}
        </Text>

        {showBoost ? (
          <Text testID="stay-card-boost-badge" style={styles.boost} numberOfLines={1}>
            🌸 {boostBadge!.label}
          </Text>
        ) : null}

        <View style={styles.ctaRow}>
          {tags.length > 0 ? (
            <View testID="stay-card-tags" style={styles.tagRow}>
              {tags.map((tag, idx) => (
                <View
                  key={tag}
                  style={[styles.tag, { backgroundColor: TAG_TONE_BG[idx] ?? colors.surfaceGreen }]}
                >
                  <Text style={[styles.tagText, { color: TAG_TONE_FG[idx] ?? colors.text }]}>{tag}</Text>
                </View>
              ))}
            </View>
          ) : <View />}
          <Pressable
            testID="stay-card-book"
            onPress={onPressBook}
            style={styles.ctaBook}
          >
            <Text style={styles.ctaBookText}>예약 →</Text>
          </Pressable>
        </View>
      </View>
    </Pressable>
  );
}

const HERO = 112;

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.background,
    borderRadius: 18,
    flexDirection: 'row',
    marginBottom: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  hero: {
    height: HERO,
    width: HERO,
    flexShrink: 0,
    position: 'relative',
  },
  heroImage: {
    height: '100%',
    width: '100%',
  },
  heroPlaceholder: {
    backgroundColor: colors.cardAlt,
  },
  typeBadge: {
    backgroundColor: TYPE_BADGE_BG,
    borderRadius: 999,
    left: 6,
    paddingHorizontal: 7,
    paddingVertical: 3,
    position: 'absolute',
    top: 6,
  },
  typeBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },
  body: {
    flex: 1,
    flexDirection: 'column',
    gap: 4,
    minWidth: 0,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  nameRow: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: 6,
    justifyContent: 'space-between',
  },
  name: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: -0.3,
    flex: 1,
  },
  rating: {
    color: colors.inkDeep,
    flexShrink: 0,
    fontSize: 11,
    fontWeight: '700',
  },
  region: {
    color: colors.textMuted,
    fontSize: 11,
  },
  boost: {
    color: '#8B3A4A',
    fontSize: 11,
    fontWeight: '700',
  },
  ctaRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 6,
    justifyContent: 'space-between',
    marginTop: 'auto',
  },
  tagRow: {
    flexDirection: 'row',
    gap: 4,
  },
  tag: {
    borderRadius: 999,
    paddingHorizontal: 7,
    paddingVertical: 3,
  },
  tagText: {
    fontSize: 10,
    fontWeight: '700',
  },
  ctaBook: {
    backgroundColor: colors.primary,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  ctaBookText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
});
```

- [ ] **4-2. StayCard 단위 테스트 통과 확인**

Run: `cd apps/mobile && pnpm test -- --run src/features/stays/components/StayCard.test.tsx`
Expected: 11 passed

- [ ] **4-3. 타입 체크 (점진)**

Run: `cd apps/mobile && pnpm tsc --noEmit`
Expected: 호출부 두 곳에서 타입 에러 발생 예정 (다음 Task에서 해소)
```
HocanceTop5Section.tsx: Property 'onPressDirections' does not exist on type 'StayCardProps'
HocanceTop5Section.tsx: 'boostReason' is not assignable to type '{ label: string } | null | undefined'
StayListScreen.tsx: Property 'onPressDirections' does not exist on type 'StayCardProps'
```
이는 의도된 Breaking change. Task 5에서 해소.

### Task 5: 호출부 정리 — `HocanceTop5Section`

**Files:**
- Modify: `apps/mobile/src/features/home/components/HocanceTop5Section.tsx`

- [ ] **5-1. HocanceTop5Section 갱신**

`apps/mobile/src/features/home/components/HocanceTop5Section.tsx` 의 본문을 다음으로 교체:

```tsx
import { useMemo } from 'react';
import { useRouter } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';

import { getTopSpots, spotKeys } from '../../../shared/data/spotRepository';
import { getPublishedStays, stayKeys } from '../../../shared/data/stayRepository';
import { formatProximity } from '../../../shared/lib/proximityLabel';
import { colors } from '../../../shared/theme/colors';
import { StayCard } from '../../stays/components/StayCard';
import { openAgodaHotelSearch } from '../../stays/lib/affiliateHotel';
import { staysDetailPath } from '../../stays/routes';
import { rankStaysForHome } from '../lib/rankStays';

const HOCANCE_TOP_N_SPOTS = 10;

export function HocanceTop5Section() {
  const router = useRouter();
  const { data: stays = [] } = useQuery({
    queryKey: stayKeys.all,
    queryFn: getPublishedStays,
  });
  const { data: topSpots = [] } = useQuery({
    queryKey: spotKeys.top(HOCANCE_TOP_N_SPOTS),
    queryFn: () => getTopSpots(HOCANCE_TOP_N_SPOTS),
  });

  const ranked = useMemo(() => rankStaysForHome(stays, topSpots), [stays, topSpots]);

  if (ranked.length === 0) return null;

  return (
    <View testID="hocance-top5-section" style={styles.container}>
      <Text style={styles.title}>꽃 명소 주변 호텔보기</Text>
      <View style={styles.list}>
        {ranked.map(({ stay, boostReason }) => {
          const boostBadge = boostReason
            ? { label: formatProximity(boostReason.distanceKm, boostReason.spotName) }
            : null;
          return (
            <StayCard
              key={stay.id}
              stay={stay}
              boostBadge={boostBadge}
              onPress={() => router.push(staysDetailPath(stay.slug))}
              onPressBook={() =>
                openAgodaHotelSearch({ name: stay.name, queryOverride: stay.bookingQueryOverride })
              }
            />
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 24,
  },
  title: {
    color: colors.text,
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: -0.4,
    marginBottom: 14,
  },
  list: {
    gap: 14,
  },
});
```

변경 요약: `isValidCoordinate`/`openNaverNavigation`/`showToast` import 제거, `onPressDirections`/`directionsDisabled` 제거, `boostReason` → `boostBadge.label` 변환 추가.

### Task 6: 호출부 정리 — `StayListScreen`

**Files:**
- Modify: `apps/mobile/src/features/stays/screens/StayListScreen.tsx`

- [ ] **6-1. StayListScreen 갱신**

`apps/mobile/src/features/stays/screens/StayListScreen.tsx` 의 본문 교체:

```tsx
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { StyleSheet, Text, View } from 'react-native';

import { getPublishedStays, stayKeys } from '../../../shared/data/stayRepository';
import { NativeSpotAd } from '../../../shared/ui/NativeSpotAd';
import { ScreenShell } from '../../../shared/ui/ScreenShell';
import { SkeletonBox } from '../../../shared/ui/SkeletonBox';
import { colors } from '../../../shared/theme/colors';
import { StayCard } from '../components/StayCard';
import { openAgodaHotelSearch } from '../lib/affiliateHotel';

export function StayListScreen() {
  const router = useRouter();
  const { data: stays = [], isLoading } = useQuery({
    queryKey: stayKeys.all,
    queryFn: getPublishedStays,
  });

  if (isLoading) {
    return (
      <ScreenShell title="호캉스" subtitle="이번 주말 어디로 떠날까">
        <SkeletonBox height={120} borderRadius={18} />
        <SkeletonBox height={120} borderRadius={18} />
        <SkeletonBox height={120} borderRadius={18} />
      </ScreenShell>
    );
  }

  if (stays.length === 0) {
    return (
      <ScreenShell title="호캉스" subtitle="준비 중인 큐레이션이에요">
        <Text style={styles.emptyText}>곧 새로운 큐레이션이 올라올 거예요.</Text>
      </ScreenShell>
    );
  }

  return (
    <ScreenShell title="호캉스" subtitle="이번 주말 어디로 떠날까">
      <View style={styles.intro}>
        <Text style={styles.introText}>{stays.length}곳을 큐레이션했어요</Text>
      </View>
      {stays.map((stay, idx) => (
        <View key={stay.id}>
          <StayCard
            stay={stay}
            onPress={() => router.push(`/stays/${stay.slug}` as never)}
            onPressBook={() =>
              openAgodaHotelSearch({ name: stay.name, queryOverride: stay.bookingQueryOverride })
            }
          />
          {(idx + 1) % 3 === 0 && idx < stays.length - 1 ? <NativeSpotAd /> : null}
        </View>
      ))}
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  emptyText: {
    color: colors.textMuted,
    fontSize: 14,
    marginTop: 12,
  },
  intro: {
    marginBottom: 12,
  },
  introText: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: '600',
  },
});
```

변경 요약: `isValidCoordinate`/`openNaverNavigation`/`showToast`/`DIRECTIONS_DISABLED_MESSAGE` import 제거, `directionsDisabled`/`onPressDirections` 호출 제거, 로딩 스켈레톤 높이를 가로 카드(120px)에 맞춤.

### Task 7: Chunk 3 통합 검증

- [ ] **7-1. 전체 타입 체크**

Run: `cd apps/mobile && pnpm tsc --noEmit`
Expected: 0 errors

- [ ] **7-2. 전체 테스트**

Run: `cd apps/mobile && pnpm test -- --run`
Expected: 모든 테스트 PASS. 특히 `rankStays.test.ts`(기존)도 PASS 유지 — 알고리즘은 미변경.

- [ ] **7-3. 커밋**

```bash
git add apps/mobile/src/features/stays/components/StayCard.tsx \
        apps/mobile/src/features/stays/components/StayCard.test.tsx \
        apps/mobile/src/features/home/components/HocanceTop5Section.tsx \
        apps/mobile/src/features/stays/screens/StayListScreen.tsx
git commit -m "$(cat <<'EOF'
feat(stays): StayCard 가로형 컴팩트화 + 길찾기 제거 + boostBadge 일반화

카드 높이 ~400px → ~112px (이미지 112×112 + 우 정보). 길찾기 prop 완전 제거,
boostBadge는 { label: string } 으로 일반화해 호출부가 컨텍스트별 라벨 결정.
호캉스 리스트 / 홈 TOP5 동일 카드로 통일.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

### Chunk 3 종료 체크포인트

- [ ] **C3-1. 전체 타입 체크 + 전체 테스트 (재확인)**

Run: `cd apps/mobile && pnpm tsc --noEmit && pnpm test -- --run`
Expected: 0 type errors, 모든 테스트 PASS

---

## Chunk 4: NearbyStaysSection + SpotDetailScreen 통합

**의도:** 명소 상세 화면에 '주변 호텔' 섹션을 신설한다. 0건이면 섹션 자체 미렌더. 1차 30km 후보 0건이면 60km로 fallback하고 헤더 칩 라벨을 분기.

### Task 8: `NearbyStaysSection` 컴포넌트 + 테스트

**Files:**
- Create: `apps/mobile/src/features/spot/components/NearbyStaysSection.tsx`
- Create: `apps/mobile/src/features/spot/components/NearbyStaysSection.test.tsx`

- [ ] **8-1. 실패 테스트 작성**

`apps/mobile/src/features/spot/components/NearbyStaysSection.test.tsx`:

```tsx
import { act } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render } from '@testing-library/react-native';
import type { ReactNode } from 'react';

import type { FlowerSpot, Stay } from '../../../shared/data/types';
import { NearbyStaysSection } from './NearbyStaysSection';

// 코드베이스 표준 ESM mock 패턴 (HocanceTop5Section.test.tsx 참고).
vi.mock('../../../shared/data/stayRepository', () => ({
  getPublishedStays: vi.fn(),
  stayKeys: { all: ['stays'] },
}));
vi.mock('expo-router', () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), back: vi.fn() }),
}));
vi.mock('../../stays/lib/affiliateHotel', () => ({
  openAgodaHotelSearch: vi.fn(),
}));

import { getPublishedStays } from '../../../shared/data/stayRepository';

function makeStay(o: Partial<Stay> & { id: string; latitude: number; longitude: number }): Stay {
  return {
    id: o.id, slug: `slug-${o.id}`, name: `Stay ${o.id}`,
    regionPrimary: '서울', regionSecondary: '강남', address: '',
    latitude: o.latitude, longitude: o.longitude,
    stayType: 'city', seasonTags: [],
    seasonWindowStart: null, seasonWindowEnd: null,
    shortTagline: '', description: '', recommendationPoints: [],
    thumbnailUrl: null, bookingQueryOverride: null,
    naverRating: null, googleRating: null, ratingCapturedAt: null,
    isFeatured: false, displayOrder: 0,
    ...o,
  };
}

function makeSpot(): FlowerSpot {
  return {
    id: 'spot-1', slug: 'spot-1', badge: '', bloomEndAt: '', bloomStartAt: '',
    bloomStatus: '', description: '', fee: '', festivalDate: '',
    flower: '벚꽃', flowerIsActive: true, flowerThumbnailUrl: null,
    helper: '', latitude: 0, longitude: 0, location: '', parking: '',
    place: '학동흑진주몽돌해변', thumbnailUrl: null, tone: 'pink',
  };
}

function wrap(node: ReactNode) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return <QueryClientProvider client={client}>{node}</QueryClientProvider>;
}

/** 비동기 쿼리 결과 반영까지 대기하는 헬퍼 (HocanceTop5Section.test.tsx 패턴) */
async function flushQueries() {
  await act(async () => {
    await new Promise<void>((resolve) => setTimeout(resolve, 50));
  });
}

describe('NearbyStaysSection', () => {
  it('주변 호텔이 0건이면 섹션 자체를 미렌더한다', async () => {
    vi.mocked(getPublishedStays).mockResolvedValue([]);
    const { queryByTestId } = render(wrap(<NearbyStaysSection spot={makeSpot()} />));
    await flushQueries();
    expect(queryByTestId('nearby-stays-section')).toBeNull();
  });

  it('1차 30km 후보가 있으면 헤더에 "30km 이내" 라벨이 노출된다', async () => {
    vi.mocked(getPublishedStays).mockResolvedValue([
      makeStay({ id: 'a', latitude: 0.1, longitude: 0 }), // ~11km
    ]);
    const { getByText } = render(wrap(<NearbyStaysSection spot={makeSpot()} />));
    await flushQueries();
    expect(getByText(/학동흑진주몽돌해변 30km 이내/)).toBeTruthy();
  });

  it('1차 0건 + 2차 N건이면 헤더에 "60km 이내" 라벨이 노출된다', async () => {
    vi.mocked(getPublishedStays).mockResolvedValue([
      makeStay({ id: 'mid', latitude: 0.4, longitude: 0 }), // ~44km
    ]);
    const { getByText } = render(wrap(<NearbyStaysSection spot={makeSpot()} />));
    await flushQueries();
    expect(getByText(/학동흑진주몽돌해변 60km 이내/)).toBeTruthy();
  });

  it('카드 부스트 라벨은 "이 명소에서 ..." 형식이다', async () => {
    vi.mocked(getPublishedStays).mockResolvedValue([
      makeStay({ id: 'a', latitude: 0.05, longitude: 0 }), // ~5.6km
    ]);
    const { getByText } = render(wrap(<NearbyStaysSection spot={makeSpot()} />));
    await flushQueries();
    expect(getByText(/이 명소에서 5\.6km/)).toBeTruthy();
  });

  it('후보가 limit(3) 이하이면 "더보기" 버튼이 미노출', async () => {
    vi.mocked(getPublishedStays).mockResolvedValue([
      makeStay({ id: 'a', latitude: 0.05, longitude: 0 }),
      makeStay({ id: 'b', latitude: 0.07, longitude: 0 }),
    ]);
    const { queryByTestId } = render(wrap(<NearbyStaysSection spot={makeSpot()} />));
    await flushQueries();
    expect(queryByTestId('nearby-stays-more')).toBeNull();
  });

  it('후보가 limit(3) 이상이면 "더보기" 버튼이 노출된다', async () => {
    vi.mocked(getPublishedStays).mockResolvedValue([
      makeStay({ id: 'a', latitude: 0.01, longitude: 0 }),
      makeStay({ id: 'b', latitude: 0.02, longitude: 0 }),
      makeStay({ id: 'c', latitude: 0.03, longitude: 0 }),
      makeStay({ id: 'd', latitude: 0.04, longitude: 0 }),
    ]);
    const { getByTestId } = render(wrap(<NearbyStaysSection spot={makeSpot()} />));
    await flushQueries();
    expect(getByTestId('nearby-stays-more')).toBeTruthy();
  });
});
```

> **참고:** 위 더보기 노출 케이스는 스펙 §6.1의 단순화(`N === limit이면 더보기 노출`)를 반영. 즉 후보가 정확히 limit(3) 이상이면 잘림 가능성 추정으로 더보기를 표시. 4건 이상에서 명확히 보이도록 테스트.

- [ ] **8-2. 테스트 실패 확인**

Run: `cd apps/mobile && pnpm test -- --run src/features/spot/components/NearbyStaysSection.test.tsx`
Expected: FAIL — "Cannot find module './NearbyStaysSection'"

- [ ] **8-3. 구현**

`apps/mobile/src/features/spot/components/NearbyStaysSection.tsx`:

```tsx
import { useRouter } from 'expo-router';
import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';

import { getPublishedStays, stayKeys } from '../../../shared/data/stayRepository';
import type { FlowerSpot } from '../../../shared/data/types';
import { formatProximity } from '../../../shared/lib/proximityLabel';
import { colors } from '../../../shared/theme/colors';
import { StayCard } from '../../stays/components/StayCard';
import { openAgodaHotelSearch } from '../../stays/lib/affiliateHotel';
import { STAYS_ROUTE, staysDetailPath } from '../../stays/routes';
import { findNearbyStays } from '../lib/findNearbyStays';

const LIMIT = 3;
const PRIMARY_RADIUS_KM = 30;
const FALLBACK_RADIUS_KM = 60;

type Props = { spot: FlowerSpot };

export function NearbyStaysSection({ spot }: Props) {
  const router = useRouter();
  const { data: stays = [] } = useQuery({
    queryKey: stayKeys.all,
    queryFn: getPublishedStays,
  });

  const result = useMemo(
    () =>
      findNearbyStays(spot, stays, {
        limit: LIMIT,
        primaryRadiusKm: PRIMARY_RADIUS_KM,
        fallbackRadiusKm: FALLBACK_RADIUS_KM,
      }),
    [spot, stays],
  );

  if (result.stays.length === 0) return null;

  const radiusLabel = result.usedFallback
    ? `${spot.place} ${FALLBACK_RADIUS_KM}km 이내`
    : `${spot.place} ${PRIMARY_RADIUS_KM}km 이내`;

  // 후보가 limit 이상이면 잘림 가능성으로 간주해 더보기 노출 (스펙 §6.1 단순화)
  const showMore = result.stays.length >= LIMIT;

  return (
    <View testID="nearby-stays-section" style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>주변 호텔</Text>
        <View style={styles.radiusChip}>
          <Text style={styles.radiusChipText} numberOfLines={1}>{radiusLabel}</Text>
        </View>
      </View>

      <View style={styles.list}>
        {result.stays.map(({ stay, distanceKm }) => (
          <StayCard
            key={stay.id}
            stay={stay}
            boostBadge={{ label: formatProximity(distanceKm, '이 명소') }}
            onPress={() => router.push(staysDetailPath(stay.slug))}
            onPressBook={() =>
              openAgodaHotelSearch({ name: stay.name, queryOverride: stay.bookingQueryOverride })
            }
          />
        ))}
      </View>

      {showMore ? (
        <Pressable
          testID="nearby-stays-more"
          onPress={() => router.push(STAYS_ROUTE as never)}
          style={styles.moreButton}
        >
          <Text style={styles.moreText}>더보기 →</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 22,
  },
  header: {
    alignItems: 'baseline',
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  title: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  radiusChip: {
    backgroundColor: colors.softPink,
    borderRadius: 999,
    paddingHorizontal: 9,
    paddingVertical: 3,
    flexShrink: 1,
  },
  radiusChipText: {
    color: '#8B3A4A',
    fontSize: 11,
    fontWeight: '700',
  },
  list: {
    gap: 10,
  },
  moreButton: {
    alignSelf: 'flex-end',
    paddingHorizontal: 8,
    paddingVertical: 10,
  },
  moreText: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '700',
  },
});
```

- [ ] **8-4. 테스트 통과 확인**

Run: `cd apps/mobile && pnpm test -- --run src/features/spot/components/NearbyStaysSection.test.tsx`
Expected: 6 passed

- [ ] **8-5. 타입 체크**

Run: `cd apps/mobile && pnpm tsc --noEmit`
Expected: 0 errors

### Task 9: `SpotDetailScreen` 통합

**Files:**
- Modify: `apps/mobile/src/features/spot/screens/SpotDetailScreen.tsx`

- [ ] **9-1. NearbyStaysSection 삽입**

`SpotDetailScreen.tsx`의 import 영역에 추가:

```tsx
import { NearbyStaysSection } from '../components/NearbyStaysSection';
```

JSX 구조의 `<SectionCard title="비슷한 꽃 명소">` **바로 위**에 다음 한 줄 삽입:

```tsx
<NearbyStaysSection spot={spot} />
```

해당 부분(현재 파일 `:108` 근처) before/after:

```tsx
      <SectionCard title="팁">
        {spot.helper.split('\n').filter(Boolean).map((tip, index) => (
          <DetailTip key={index} text={tip} />
        ))}
      </SectionCard>

      <NearbyStaysSection spot={spot} />

      <SectionCard title="비슷한 꽃 명소">
        ...
      </SectionCard>
```

- [ ] **9-2. 타입 체크**

Run: `cd apps/mobile && pnpm tsc --noEmit`
Expected: 0 errors

- [ ] **9-3. 전체 테스트**

Run: `cd apps/mobile && pnpm test -- --run`
Expected: 모든 테스트 PASS

- [ ] **9-4. 커밋**

```bash
git add apps/mobile/src/features/spot/components/NearbyStaysSection.tsx \
        apps/mobile/src/features/spot/components/NearbyStaysSection.test.tsx \
        apps/mobile/src/features/spot/screens/SpotDetailScreen.tsx
git commit -m "$(cat <<'EOF'
feat(spot): 명소 상세에 '주변 호텔' 섹션 신설

명소 좌표 기준 30km(60km fallback) 이내 호텔 최대 3개를 노출.
0건이면 섹션 자체를 숨기고, 잘림 가능성 시에만 '더보기 →' 노출.
'비슷한 꽃 명소' 섹션 위에 배치해 자고갈 곳 동선을 연결.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

### Task 10: 최종 검증

- [ ] **10-1. 전체 타입 체크**

Run: `cd apps/mobile && pnpm tsc --noEmit`
Expected: 0 errors

- [ ] **10-2. 전체 테스트**

Run: `cd apps/mobile && pnpm test -- --run`
Expected: 모든 테스트 PASS. 본 작업으로 추가된 신규 테스트 누적 ≈ 32건.

- [ ] **10-3. 수동 검증 (시뮬레이터/디바이스)**

Run: `cd apps/mobile && pnpm start` (또는 프로젝트 표준 실행 명령)

확인 체크리스트:
- [ ] 홈 화면 `꽃 명소 주변 호텔보기` 섹션: 가로형 카드 5장 노출. 길찾기 버튼 없음. 부스트 라벨 노출(있는 카드만).
- [ ] 홈 → 카드 탭: 호캉스 상세로 이동
- [ ] 홈 → 카드 우하단 '예약 →' 칩 탭: Agoda 검색 페이지 진입
- [ ] 호캉스 리스트(`/stays`): 가로형 카드 N장 + 3개 간격 `NativeSpotAd` 표시. 위화감이 너무 큰지만 메모(별도 PR 후보).
- [ ] 명소 상세 (좌표 정상이고 인근에 호텔 등록된 명소): '주변 호텔' 섹션이 '팁'과 '비슷한 꽃 명소' 사이에 노출. 헤더 거리 칩 '30km 이내' 또는 '60km 이내'.
- [ ] 명소 상세 (외딴 명소, 60km 내 0개): '주변 호텔' 섹션이 아예 보이지 않음.
- [ ] 명소 상세 → 주변 호텔 카드 탭: 호캉스 상세로 진입
- [ ] 명소 상세 → 주변 호텔 '더보기 →' 탭: `/stays` 리스트로 이동 (후보가 3개 초과일 때만 보임)

- [ ] **10-4. 최종 보고용 diff 요약**

Run: `git log --oneline main..HEAD | head -20`

신규 커밋(예상):
- `feat(shared): formatProximity 거리 라벨 헬퍼 추가`
- `feat(spot): findNearbyStays 순수 함수 추가`
- `feat(stays): StayCard 가로형 컴팩트화 + 길찾기 제거 + boostBadge 일반화`
- `feat(spot): 명소 상세에 '주변 호텔' 섹션 신설`

---

## 작업 완료 정의 (Definition of Done)

- 위 모든 단위 테스트 그린 (누적 ≈ 32건 신규)
- `tsc --noEmit` 0 errors
- 수동 검증 체크리스트(10-3) 모두 OK
- 미해결 PM 항목(`booking_query_override` 운영 가이드 등)과 별개로 다뤄짐 — 이 PR이 추가로 막지 않음

다음 단계는 PR 생성 — 전역 `CLAUDE.md`의 PR 생성 프로세스(서브에이전트 코드리뷰 → 검토 리포트 → 승인 후 PR 생성)를 따른다.
