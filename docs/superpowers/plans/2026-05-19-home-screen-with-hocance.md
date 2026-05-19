# 홈 화면 호캉스 통합 개편 구현 플랜

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Spec:** `docs/superpowers/specs/2026-05-18-home-screen-with-hocance-design.md`

**Goal:** 모바일 홈 화면을 "오늘의 꽃 명소 TOP 10 + 오늘 여기서 호캉스 어떠세요? TOP 5"의 2단 헤드라이너로 개편하고, 히어로 캐러셀·꽃 종류 칩·지금 보기 좋은 명소·내 주변 명소·StaysDiscoveryCard를 제거한다.

**Architecture:** 호캉스 TOP 5는 클라이언트에서 `평점 0.5 + 꽃 TOP 10 인접도 부스트 0.5` 점수와 `시/도별 최대 2개` 다양성 필터로 산출하는 순수 함수 `rankStaysForHome`을 신규로 둔다. HomeScreen은 데이터 페치·섹션 조립 책임만 남기고, 호캉스 섹션은 별도 컴포넌트 `HocanceTop5Section`로 분리한다. 헤더 텍스트화를 위해 `ScreenShell`에 `titleText` prop을 추가한다.

**Tech Stack:** React Native (Expo), expo-router, @tanstack/react-query, Vitest, @testing-library/react-native, TypeScript.

**작업 원칙:**
- TDD: 실패 테스트 → 최소 구현 → 통과 확인 → 커밋.
- 한국어 커밋 메시지.
- 각 청크 끝에서 `pnpm --filter mobile typecheck && pnpm --filter mobile test` 통과를 확인.
- 한 작업당 1커밋 원칙. 한 커밋에 무관 변경 섞지 않는다.

---

## 사전 점검

- [ ] **0-1. working tree 클린 확인 후 브랜치 생성**

```bash
cd /Users/user/workspace/flower-map
git status                                  # 변경/스테이지 항목 확인
```

- working tree가 dirty면 **에스컬레이션**(별도 브랜치 커밋 또는 stash 결정은 작업자가 사람에게 묻는다). 임의 스태시 금지.
- 깨끗하면 다음 진행:

```bash
git checkout -b feat/home-hocance-integration
```

- [ ] **0-2. 의존 사실 재확인** (스펙 작성 후 변동 가능성)

```bash
grep -n "function haversineKm\|export function haversineKm" apps/mobile/src/shared/lib/location.ts
# 케이스 A) "function haversineKm" → Task 1에서 export 승격 진행.
# 케이스 B) "export function haversineKm" → 이미 export됨. Task 1은 no-op로 처리하고 다음 Task로.

grep -n "titleColor\|titleText\|ScreenShellProps" apps/mobile/src/shared/ui/ScreenShell.tsx
# 기대: titleColor prop은 이미 존재 (line 13/18 부근). titleText는 아직 없음.
# titleText가 이미 있으면 Task 2는 prop 추가만 skip하고 텍스트 모드 분기 구현만 확인.

grep -rn "useFeatureSeen" apps/mobile/src apps/mobile/app --include="*.tsx" --include="*.ts" | grep -v __mocks__ | grep -v useFeatureSeen.test
# 기대: HomeScreen.tsx + (tabs)/_layout.tsx + (tabs)/stays.tsx에서 사용 — HomeScreen 외 사용처는 보존.

grep -rn "StaysDiscoveryCard" apps/mobile/src apps/mobile/app --include="*.tsx" --include="*.ts"
# 기대: HomeScreen.tsx import 1개 + 컴포넌트 본체 + 테스트. 모두 제거 대상.

grep -rn "isStaysRoute\|STAYS_ROUTE" apps/mobile/src apps/mobile/app --include="*.tsx" --include="*.ts"
# 기대: HomeScreen.tsx(제거 대상), features/stays/routes.ts(보존), routes.test.ts(보존), 다른 사용처가 있으면 보존.

grep -n "^export\|getTopSpots\|spotKeys\.top" apps/mobile/src/shared/data/spotRepository.ts
# 기대: getTopSpots(n) 함수, spotKeys.top(n) 키 빌더가 존재. HocanceTop5Section이 재사용할 대상.

grep -n "^export" apps/mobile/src/features/stays/lib/naverHotel.ts apps/mobile/src/shared/lib/naverMap.ts apps/mobile/src/shared/lib/coordinate.ts
# 기대: openNaverHotelSearch, openNaverNavigation, DIRECTIONS_DISABLED_MESSAGE, isValidCoordinate가 존재. HocanceTop5Section이 StayListScreen과 동일 패턴으로 재사용.
```

위 명령 결과가 기대와 다르면 해당 차이를 메모하고 영향 Task에서 반영한다.

> 위 출력이 가정과 다르면 진행 전에 차이를 메모하고, 영향 받는 Task에서 반영한다.

---

## Chunk 1: 기반 준비 (헤더·유틸·타이틀)

3개 작업 모두 독립적이며, 서로 다른 파일을 건드린다. 순차 진행.

### Task 1: `haversineKm`을 모듈 export로 승격

**Files:**
- Modify: `apps/mobile/src/shared/lib/location.ts`

**왜:** `rankStays.ts`에서 호텔 ↔ 꽃 명소 거리 계산에 재사용. 현재는 `location.ts` 내부에서만 사용되어 `function haversineKm`(non-exported) 상태.

- [ ] **1-1. 변경 (export 키워드 추가)**

`apps/mobile/src/shared/lib/location.ts`의 `function haversineKm(a: Coords, b: Coords): number`를 `export function haversineKm(...)`로 변경. 본문 변경 없음.

- [ ] **1-2. 타입 체크**

```bash
pnpm --filter mobile typecheck
```

Expected: 통과 (PASS).

- [ ] **1-3. 기존 테스트 회귀 확인**

```bash
pnpm --filter mobile test src/shared/lib/location
```

Expected: 모든 기존 테스트 PASS. (export만 추가하므로 행위 변화 없음.)

- [ ] **1-4. 커밋**

```bash
git add apps/mobile/src/shared/lib/location.ts
git commit -m "refactor(location): haversineKm을 모듈 export로 승격"
```

---

### Task 2: `ScreenShell`에 `titleText` prop 추가

**Files:**
- Create: `apps/mobile/src/shared/ui/ScreenShell.test.tsx`
- Modify: `apps/mobile/src/shared/ui/ScreenShell.tsx`

**왜:** 헤더를 로고 이미지 대신 텍스트 "꽃 어디 & 호캉스 어디?"로 노출하기 위해. 기본 동작(이미지 렌더)은 보존하여 다른 화면 영향 없음.

- [ ] **2-1. 실패 테스트 작성**

`apps/mobile/src/shared/ui/ScreenShell.test.tsx`:

```tsx
import { describe, expect, it } from 'vitest';
import { render } from '@testing-library/react-native';
import { StyleSheet } from 'react-native';

import { ScreenShell } from './ScreenShell';

describe('ScreenShell', () => {
  it('titleText 미전달 시 로고 이미지(testID=screen-shell-title-image)가 렌더된다', () => {
    const { getByTestId, queryByTestId } = render(<ScreenShell title="legacy" />);
    expect(getByTestId('screen-shell-title-image')).toBeTruthy();
    expect(queryByTestId('screen-shell-title-text')).toBeNull();
  });

  it('titleText 전달 시 텍스트 헤더(testID=screen-shell-title-text)가 렌더되고 이미지가 사라진다', () => {
    const { getByTestId, queryByTestId } = render(
      <ScreenShell title="legacy" titleText="꽃 어디 & 호캉스 어디?" />,
    );
    const text = getByTestId('screen-shell-title-text');
    expect(text.props.children).toBe('꽃 어디 & 호캉스 어디?');
    expect(queryByTestId('screen-shell-title-image')).toBeNull();
  });

  it('titleText + titleColor 전달 시 텍스트에 color 스타일이 적용된다', () => {
    const { getByTestId } = render(
      <ScreenShell title="legacy" titleText="홈" titleColor="#C4778A" />,
    );
    const node = getByTestId('screen-shell-title-text');
    const flat = StyleSheet.flatten(node.props.style);
    expect(flat?.color).toBe('#C4778A');
  });
});
```

> testID 기반 검증으로 RN mock 환경의 Image 식별 문제를 회피한다.

- [ ] **2-2. 테스트 실패 확인**

```bash
pnpm --filter mobile test src/shared/ui/ScreenShell
```

Expected: FAIL (텍스트 헤더 검증 실패 — 아직 미구현).

- [ ] **2-3. 최소 구현**

> 사전 점검 0-2에서 확인: `titleColor` prop은 이미 존재(스타일 적용은 안 되어 있을 수 있음). `titleText`만 신규 추가하고, 텍스트 모드일 때 `titleColor`를 텍스트 색상으로 적용한다. 기본(이미지) 모드는 `titleColor` 무시 — 이미지에 색 적용 안 함(기존 동작 유지).

`apps/mobile/src/shared/ui/ScreenShell.tsx`를 다음과 같이 수정:

- `ScreenShellProps`에 `titleText?: string` 추가 (`titleColor`는 이미 있음).
- 함수 시그니처에서 `titleText` 구조분해.
- 헤더 렌더 분기 (`styles.header`는 기본 flexDirection 미지정 → column. `textAlign: 'center'`만으로 가로 중앙 정렬 충족):

```tsx
<View style={styles.header}>
  {titleText ? (
    <Text
      testID="screen-shell-title-text"
      numberOfLines={1}
      adjustsFontSizeToFit
      minimumFontScale={0.7}
      style={[styles.titleText, titleColor ? { color: titleColor } : null]}
    >
      {titleText}
    </Text>
  ) : (
    <Image testID="screen-shell-title-image" source={titleImage} style={styles.titleImage} />
  )}
  {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
</View>
```

- `styles`에 `titleText` 추가:

```ts
titleText: {
  color: colors.text,
  fontSize: 24,
  fontWeight: '800',
  letterSpacing: -0.4,
  textAlign: 'center',
},
```

- [ ] **2-4. 테스트 통과 확인**

```bash
pnpm --filter mobile test src/shared/ui/ScreenShell
```

Expected: 3개 테스트 PASS.

- [ ] **2-5. 타입 체크**

```bash
pnpm --filter mobile typecheck
```

Expected: PASS.

- [ ] **2-6. 커밋**

```bash
git add apps/mobile/src/shared/ui/ScreenShell.tsx apps/mobile/src/shared/ui/ScreenShell.test.tsx
git commit -m "feat(screen-shell): titleText prop으로 텍스트 헤더 렌더 지원"
```

---

### Task 3: `TopSpotsSection` 제목 변경

**Files:**
- Modify: `apps/mobile/src/features/home/components/TopSpotsSection.tsx`
- Modify: `apps/mobile/src/features/home/components/TopSpotsSection.test.tsx`

**왜:** 새 헤드라이너 타이틀 "오늘의 꽃 명소 TOP 10"으로 갱신.

- [ ] **3-1. 잔존 참조 0 확인 후 테스트 기대값 갱신**

먼저 본문/테스트/타 파일에 잔존 참조가 없는지 확인:

```bash
grep -rn "오늘의 TOP 10" apps/mobile/src apps/mobile/app --include="*.tsx" --include="*.ts"
```

`TopSpotsSection.tsx:76`, `TopSpotsSection.test.tsx`의 단언 외 잔존이 있으면 같이 갱신. 테스트 파일의 모든 `'오늘의 TOP 10'` 단언을 `'오늘의 꽃 명소 TOP 10'`으로 일괄 치환.

- [ ] **3-2. 테스트 실패 확인**

```bash
pnpm --filter mobile test src/features/home/components/TopSpotsSection
```

Expected: FAIL (텍스트 불일치).

- [ ] **3-3. 구현 변경**

`TopSpotsSection.tsx` 76행 `<Text style={styles.title}>오늘의 TOP 10</Text>` → `<Text style={styles.title}>오늘의 꽃 명소 TOP 10</Text>`.

- [ ] **3-4. 테스트 통과 확인**

```bash
pnpm --filter mobile test src/features/home/components/TopSpotsSection
```

Expected: PASS.

- [ ] **3-5. 커밋**

```bash
git add apps/mobile/src/features/home/components/TopSpotsSection.tsx apps/mobile/src/features/home/components/TopSpotsSection.test.tsx
git commit -m "feat(home): TopSpotsSection 제목을 '오늘의 꽃 명소 TOP 10'으로 변경"
```

---

### Chunk 1 종료 체크포인트

- [ ] **C1-1. 전체 타입 체크**

```bash
pnpm --filter mobile typecheck
```

Expected: PASS.

- [ ] **C1-2. 전체 테스트**

```bash
pnpm --filter mobile test
```

Expected: 모든 테스트 PASS.

---

## Chunk 2: 호캉스 랭킹 알고리즘

핵심 도메인 로직. 다음 청크의 모든 작업이 이 청크에 의존.

### Task 4: `rankStaysForHome` 순수 함수 + 테스트

**Files:**
- Create: `apps/mobile/src/features/home/lib/rankStays.ts`
- Create: `apps/mobile/src/features/home/lib/rankStays.test.ts`

**왜:** 호캉스 TOP 5 추천의 점수·다양성·부스트 사유 산출 단일 책임 모듈.

- [ ] **4-1. 실패 테스트 작성**

`apps/mobile/src/features/home/lib/rankStays.test.ts`:

```ts
import { describe, expect, it } from 'vitest';

import type { FlowerSpot, Stay } from '../../../shared/data/types';
import { rankStaysForHome } from './rankStays';

function makeStay(overrides: Partial<Stay> & { id: string; latitude: number; longitude: number; regionPrimary?: string }): Stay {
  return {
    id: overrides.id,
    slug: `slug-${overrides.id}`,
    name: `Stay ${overrides.id}`,
    regionPrimary: overrides.regionPrimary ?? '서울',
    regionSecondary: '',
    address: '',
    latitude: overrides.latitude,
    longitude: overrides.longitude,
    stayType: 'city',
    seasonTags: [],
    seasonWindowStart: null,
    seasonWindowEnd: null,
    shortTagline: '',
    description: '',
    recommendationPoints: [],
    thumbnailUrl: null,
    bookingQueryOverride: null,
    naverRating: null,
    googleRating: null,
    ratingCapturedAt: null,
    isFeatured: false,
    displayOrder: 0,
    ...overrides,
  };
}

function makeSpot(id: string, latitude: number, longitude: number, place = `Spot ${id}`): FlowerSpot {
  return {
    id,
    slug: `spot-${id}`,
    badge: '',
    bloomEndAt: '',
    bloomStartAt: '',
    bloomStatus: '',
    description: '',
    fee: '',
    festivalDate: '',
    flower: '벚꽃',
    flowerIsActive: true,
    flowerThumbnailUrl: null,
    helper: '',
    latitude,
    longitude,
    location: '',
    parking: '',
    place,
    thumbnailUrl: null,
    tone: 'pink',
  };
}

describe('rankStaysForHome', () => {
  it('꽃 TOP 10이 빈 배열이면 평점 단독으로 정렬한다 (proximityBoost = 0)', () => {
    const stays = [
      makeStay({ id: '1', latitude: 0, longitude: 0, naverRating: { score: 3, url: '' } }),
      makeStay({ id: '2', latitude: 0, longitude: 0, naverRating: { score: 5, url: '' } }),
      makeStay({ id: '3', latitude: 0, longitude: 0, naverRating: { score: 4, url: '' } }),
    ];
    const ranked = rankStaysForHome(stays, []);
    expect(ranked.map((r) => r.stay.id)).toEqual(['2', '3', '1']);
    expect(ranked[0].boostReason).toBeNull();
  });

  it('두 평점이 모두 있으면 평균을 사용한다 (최댓값 아님)', () => {
    const stays = [
      // a: 평균 (5+3)/2 = 4.0
      makeStay({ id: 'a', latitude: 0, longitude: 0,
        naverRating: { score: 5, url: '' }, googleRating: { score: 3, url: '' } }),
      // b: 단일 5.0
      makeStay({ id: 'b', latitude: 0, longitude: 0,
        naverRating: { score: 5, url: '' } }),
    ];
    const ranked = rankStaysForHome(stays, []);
    expect(ranked[0].stay.id).toBe('b'); // 5.0이 더 높음 → 평균 사용 증명
    expect(ranked[1].stay.id).toBe('a');
  });

  it('평점 동률 시 거리 가까운 쪽이 위로 온다', () => {
    const stays = [
      makeStay({ id: 'far',   latitude: 1.0, longitude: 0, naverRating: { score: 4, url: '' } }), // ~111km
      makeStay({ id: 'near',  latitude: 0.05, longitude: 0, naverRating: { score: 4, url: '' } }), // ~5.6km
    ];
    const spots = [makeSpot('s1', 0, 0)];
    const ranked = rankStaysForHome(stays, spots);
    expect(ranked[0].stay.id).toBe('near');
  });

  it('거리 임계치 경계값(10/30/60km)을 폐구간으로 처리한다', () => {
    // 위경도 1도 ≈ 111.195km 가정. 10km ≈ 0.0899도, 30km ≈ 0.2697도, 60km ≈ 0.5395도.
    const spots = [makeSpot('origin', 0, 0)];
    const at10  = rankStaysForHome([makeStay({ id: 'a', latitude: 10  / 111.195, longitude: 0, naverRating: { score: 0, url: '' } })], spots);
    const at30  = rankStaysForHome([makeStay({ id: 'b', latitude: 30  / 111.195, longitude: 0, naverRating: { score: 0, url: '' } })], spots);
    const at60  = rankStaysForHome([makeStay({ id: 'c', latitude: 60  / 111.195, longitude: 0, naverRating: { score: 0, url: '' } })], spots);
    const at60p = rankStaysForHome([makeStay({ id: 'd', latitude: 60.5 / 111.195, longitude: 0, naverRating: { score: 0, url: '' } })], spots);
    // 평점 0 → normalizedRating = 0 → score = 0.5 * proximityBoost
    expect(at10[0].score).toBeCloseTo(0.5 * 1.0, 5);
    expect(at30[0].score).toBeCloseTo(0.5 * 0.6, 5);
    expect(at60[0].score).toBeCloseTo(0.5 * 0.3, 5);
    expect(at60p[0].score).toBeCloseTo(0, 5);
  });

  it('같은 regionPrimary는 최대 2개까지만 채택한다', () => {
    const stays = [
      makeStay({ id: 's1', regionPrimary: '서울', latitude: 0, longitude: 0, naverRating: { score: 5, url: '' } }),
      makeStay({ id: 's2', regionPrimary: '서울', latitude: 0, longitude: 0, naverRating: { score: 4.9, url: '' } }),
      makeStay({ id: 's3', regionPrimary: '서울', latitude: 0, longitude: 0, naverRating: { score: 4.8, url: '' } }),
      makeStay({ id: 's4', regionPrimary: '서울', latitude: 0, longitude: 0, naverRating: { score: 4.7, url: '' } }),
      makeStay({ id: 'j1', regionPrimary: '제주', latitude: 0, longitude: 0, naverRating: { score: 4.6, url: '' } }),
      makeStay({ id: 'g1', regionPrimary: '강원', latitude: 0, longitude: 0, naverRating: { score: 4.5, url: '' } }),
    ];
    const ranked = rankStaysForHome(stays, []);
    const seoulCount = ranked.filter((r) => r.stay.regionPrimary === '서울').length;
    expect(seoulCount).toBe(2);
    expect(ranked.map((r) => r.stay.id)).toEqual(['s1', 's2', 'j1', 'g1']);
  });

  it('후보 호캉스가 5개 미만이면 가능한 만큼만 반환한다', () => {
    const stays = [
      makeStay({ id: '1', latitude: 0, longitude: 0, naverRating: { score: 4, url: '' } }),
      makeStay({ id: '2', latitude: 0, longitude: 0, naverRating: { score: 3, url: '' } }),
    ];
    const ranked = rankStaysForHome(stays, []);
    expect(ranked).toHaveLength(2);
  });

  it('boostReason은 가장 가까운 꽃 명소 이름과 거리(km)를 가진다', () => {
    const stays = [
      makeStay({ id: 'h', latitude: 0.05, longitude: 0, naverRating: { score: 5, url: '' } }), // ~5.6km
    ];
    const spots = [
      makeSpot('a', 0, 0, '장미공원'),
      makeSpot('b', 1, 0, '먼명소'),
    ];
    const ranked = rankStaysForHome(stays, spots);
    expect(ranked[0].boostReason?.spotName).toBe('장미공원');
    expect(ranked[0].boostReason!.distanceKm).toBeLessThan(10);
    expect(ranked[0].boostReason!.distanceKm).toBeGreaterThan(0);
  });

  it('거리 60km 초과면 boostReason은 null', () => {
    const stays = [
      makeStay({ id: 'far', latitude: 1.0, longitude: 0, naverRating: { score: 5, url: '' } }), // ~111km
    ];
    const spots = [makeSpot('a', 0, 0, '장미공원')];
    const ranked = rankStaysForHome(stays, spots);
    expect(ranked[0].boostReason).toBeNull();
  });

  it('후보 풀이 poolSize로 제한되어 풀 밖 호캉스는 채택되지 않는다', () => {
    // 시나리오: poolSize=5, perRegionMax=2.
    // 상위 5개는 모두 region '서울' → perRegionMax=2 필터로 2개만 픽됨.
    // region '제주'는 점수 6위 이하라 풀 밖 → 채택 불가 → 최종 결과 2개.
    const stays = [
      makeStay({ id: 's1', regionPrimary: '서울', latitude: 0, longitude: 0, naverRating: { score: 5.0, url: '' } }),
      makeStay({ id: 's2', regionPrimary: '서울', latitude: 0, longitude: 0, naverRating: { score: 4.9, url: '' } }),
      makeStay({ id: 's3', regionPrimary: '서울', latitude: 0, longitude: 0, naverRating: { score: 4.8, url: '' } }),
      makeStay({ id: 's4', regionPrimary: '서울', latitude: 0, longitude: 0, naverRating: { score: 4.7, url: '' } }),
      makeStay({ id: 's5', regionPrimary: '서울', latitude: 0, longitude: 0, naverRating: { score: 4.6, url: '' } }),
      makeStay({ id: 'j1', regionPrimary: '제주', latitude: 0, longitude: 0, naverRating: { score: 4.5, url: '' } }),
    ];
    const ranked = rankStaysForHome(stays, [], { poolSize: 5 });
    expect(ranked.map((r) => r.stay.id)).toEqual(['s1', 's2']);
  });

  it('호캉스가 0건이면 빈 배열을 반환한다', () => {
    expect(rankStaysForHome([], [])).toEqual([]);
  });
});
```

- [ ] **4-2. 테스트 실패 확인**

```bash
pnpm --filter mobile test src/features/home/lib/rankStays
```

Expected: FAIL (모듈/함수 없음).

- [ ] **4-3. 구현**

`apps/mobile/src/features/home/lib/rankStays.ts`:

```ts
import type { FlowerSpot, Stay } from '../../../shared/data/types';
import { haversineKm } from '../../../shared/lib/location';

export type BoostReason = { spotName: string; distanceKm: number };

export type RankedStay = {
  stay: Stay;
  score: number;
  boostReason: BoostReason | null;
};

export type RankOptions = {
  limit?: number;        // 최종 반환 개수 (기본 5)
  perRegionMax?: number; // 같은 regionPrimary 최대 (기본 2)
  poolSize?: number;     // 점수 상위 풀 크기 (기본 15)
};

const DEFAULTS = { limit: 5, perRegionMax: 2, poolSize: 15 } as const;

function combineRating(stay: Stay): number | null {
  const naver = stay.naverRating && Number.isFinite(stay.naverRating.score) ? stay.naverRating.score : null;
  const google = stay.googleRating && Number.isFinite(stay.googleRating.score) ? stay.googleRating.score : null;
  if (naver !== null && google !== null) return (naver + google) / 2;
  if (naver !== null) return naver;
  if (google !== null) return google;
  return null;
}

function normalizedRating(stay: Stay): number {
  const r = combineRating(stay);
  if (r === null) return 0;
  return Math.min(Math.max(r, 0), 5) / 5;
}

function proximityBoostFromKm(distanceKm: number): number {
  if (distanceKm <= 10) return 1.0;
  if (distanceKm <= 30) return 0.6;
  if (distanceKm <= 60) return 0.3;
  return 0;
}

function nearestSpot(stay: Stay, spots: FlowerSpot[]): { spot: FlowerSpot; distanceKm: number } | null {
  if (spots.length === 0) return null;
  let best: { spot: FlowerSpot; distanceKm: number } | null = null;
  for (const spot of spots) {
    const distanceKm = haversineKm(
      { latitude: stay.latitude, longitude: stay.longitude },
      { latitude: spot.latitude, longitude: spot.longitude },
    );
    if (best === null || distanceKm < best.distanceKm) {
      best = { spot, distanceKm };
    }
  }
  return best;
}

export function rankStaysForHome(
  stays: Stay[],
  top10Spots: FlowerSpot[],
  options: RankOptions = {},
): RankedStay[] {
  const limit = options.limit ?? DEFAULTS.limit;
  const perRegionMax = options.perRegionMax ?? DEFAULTS.perRegionMax;
  const poolSize = options.poolSize ?? DEFAULTS.poolSize;

  if (stays.length === 0) return [];

  const scored: RankedStay[] = stays.map((stay) => {
    const nearest = nearestSpot(stay, top10Spots);
    const proximity = nearest ? proximityBoostFromKm(nearest.distanceKm) : 0;
    const score = 0.5 * normalizedRating(stay) + 0.5 * proximity;
    const boostReason: BoostReason | null =
      nearest && nearest.distanceKm <= 60
        ? { spotName: nearest.spot.place, distanceKm: nearest.distanceKm }
        : null;
    return { stay, score, boostReason };
  });

  scored.sort((a, b) => b.score - a.score);
  const pool = scored.slice(0, poolSize);

  const regionCount = new Map<string, number>();
  const picked: RankedStay[] = [];
  for (const candidate of pool) {
    const region = candidate.stay.regionPrimary;
    const current = regionCount.get(region) ?? 0;
    if (current >= perRegionMax) continue;
    picked.push(candidate);
    regionCount.set(region, current + 1);
    if (picked.length >= limit) break;
  }

  return picked;
}
```

- [ ] **4-4. 테스트 통과 확인**

```bash
pnpm --filter mobile test src/features/home/lib/rankStays
```

Expected: 10개 테스트 모두 PASS.

- [ ] **4-5. 타입 체크**

```bash
pnpm --filter mobile typecheck
```

Expected: PASS.

- [ ] **4-6. 커밋**

```bash
git add apps/mobile/src/features/home/lib/rankStays.ts apps/mobile/src/features/home/lib/rankStays.test.ts
git commit -m "feat(home): 호캉스 TOP 5 랭킹 알고리즘 rankStaysForHome 추가"
```

---

### Task 5: `StayCard`에 `boostBadge` prop 추가

**Files:**
- Modify: `apps/mobile/src/features/stays/components/StayCard.tsx`
- Modify: `apps/mobile/src/features/stays/components/StayCard.test.tsx`

**왜:** 호캉스 카드 내부에 "○○공원에서 N km" 부스트 사유 칩을 그리기 위해.

- [ ] **5-1. 실패 테스트 추가**

`StayCard.test.tsx`에 새 케이스 추가:

```tsx
it('boostBadge prop이 주어지면 부스트 사유 칩을 렌더한다', () => {
  const stay = makeStay(/* 기존 헬퍼 그대로 */);
  const { getByText } = render(
    <StayCard
      stay={stay}
      onPress={() => {}}
      onPressDirections={() => {}}
      onPressBook={() => {}}
      boostBadge={{ spotName: '장미공원', distanceKm: 5.6 }}
    />,
  );
  // formatDistance(5.6) → "5.6km"
  expect(getByText('장미공원에서 5.6km')).toBeTruthy();
});

it('boostBadge가 null이면 부스트 사유 칩을 렌더하지 않는다', () => {
  const stay = makeStay(/* 기존 헬퍼 그대로 */);
  const { queryByText } = render(
    <StayCard
      stay={stay}
      onPress={() => {}}
      onPressDirections={() => {}}
      onPressBook={() => {}}
      boostBadge={null}
    />,
  );
  expect(queryByText(/에서 \d+/)).toBeNull();
});

it('boostBadge prop 미전달 시 기존 동작 그대로 (부스트 칩 없음)', () => {
  const stay = makeStay(/* 기존 헬퍼 그대로 */);
  const { queryByText } = render(
    <StayCard
      stay={stay}
      onPress={() => {}}
      onPressDirections={() => {}}
      onPressBook={() => {}}
    />,
  );
  expect(queryByText(/에서 \d+/)).toBeNull();
});
```

> 기존 테스트 파일의 `makeStay` 헬퍼를 그대로 활용. 헬퍼 시그니처를 확인하고 위 호출을 맞춘다.

- [ ] **5-2. 테스트 실패 확인**

```bash
pnpm --filter mobile test src/features/stays/components/StayCard
```

Expected: FAIL (boostBadge prop 미지원).

- [ ] **5-3. 구현**

`StayCard.tsx`:

- `StayCardProps`에 `boostBadge?: { spotName: string; distanceKm: number } | null;` 추가.
- 함수 시그니처에서 `boostBadge` 구조분해, 기본값 없음.
- 상단에서 `formatDistance` import 추가: `import { formatDistance } from '../../../shared/lib/location';`
- 카드 본문 마지막(액션 버튼들 직전 또는 메타 라인 아래) 적절한 위치에 다음 블록 삽입:

```tsx
{boostBadge ? (
  <View testID="stay-card-boost-badge" style={styles.boostBadge}>
    <Text style={styles.boostBadgeText}>
      {`${boostBadge.spotName}에서 ${formatDistance(boostBadge.distanceKm)}`}
    </Text>
  </View>
) : null}
```

- `styles`에 추가:

```ts
boostBadge: {
  alignSelf: 'flex-start',
  backgroundColor: colors.softPink,
  borderRadius: 999,
  marginTop: 10,
  paddingHorizontal: 10,
  paddingVertical: 5,
},
boostBadgeText: {
  color: '#8B3A4A',
  fontSize: 12,
  fontWeight: '700',
},
```

> 칩의 정확한 시각적 위치(메타 라인 옆 vs 새 줄)는 디자인 일관성만 깨지 않으면 OK. 시간 들이지 말 것.

- [ ] **5-4. 테스트 통과 확인**

```bash
pnpm --filter mobile test src/features/stays/components/StayCard
```

Expected: 신규 3개 포함 모든 케이스 PASS.

- [ ] **5-5. 타입 체크**

```bash
pnpm --filter mobile typecheck
```

Expected: PASS.

- [ ] **5-6. 커밋**

```bash
git add apps/mobile/src/features/stays/components/StayCard.tsx apps/mobile/src/features/stays/components/StayCard.test.tsx
git commit -m "feat(stays): StayCard에 boostBadge prop으로 부스트 사유 칩 지원"
```

---

### Chunk 2 종료 체크포인트

- [ ] **C2-1. 전체 타입 체크 + 전체 테스트**

```bash
pnpm --filter mobile typecheck && pnpm --filter mobile test
```

Expected: 모두 PASS.

---

## Chunk 3: 호캉스 섹션 컴포넌트 + 홈 통합

### Task 6: `HocanceTop5Section` 컴포넌트 + 테스트

**Files:**
- Create: `apps/mobile/src/features/home/components/HocanceTop5Section.tsx`
- Create: `apps/mobile/src/features/home/components/HocanceTop5Section.test.tsx`

**왜:** HomeScreen에서 호캉스 섹션을 독립 단위로 분리. 페치·랭킹·렌더 책임을 한 컴포넌트로 응축.

- [ ] **6-1. 실패 테스트 작성**

`HocanceTop5Section.test.tsx`:

```tsx
import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';

import type { FlowerSpot, Stay } from '../../../shared/data/types';
import { HocanceTop5Section } from './HocanceTop5Section';

vi.mock('../../../shared/data/stayRepository', () => ({
  getPublishedStays: vi.fn(),
  stayKeys: { all: ['stays'] },
}));
vi.mock('../../../shared/data/spotRepository', () => ({
  getTopSpots: vi.fn(),
  spotKeys: {
    all: ['spots'],
    top: (n: number) => ['spots', 'top', n],
  },
}));
vi.mock('expo-router', () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), back: vi.fn() }),
}));

import { getPublishedStays } from '../../../shared/data/stayRepository';
import { getTopSpots } from '../../../shared/data/spotRepository';

function makeStay(over: Partial<Stay> & { id: string }): Stay {
  return {
    id: over.id, slug: `s-${over.id}`, name: `Stay ${over.id}`,
    regionPrimary: '서울', regionSecondary: '', address: '',
    latitude: 0, longitude: 0, stayType: 'city', seasonTags: [],
    seasonWindowStart: null, seasonWindowEnd: null, shortTagline: '',
    description: '', recommendationPoints: [], thumbnailUrl: null,
    bookingQueryOverride: null, naverRating: { score: 4.5, url: '' },
    googleRating: null, ratingCapturedAt: null, isFeatured: false, displayOrder: 0,
    ...over,
  };
}

function makeSpot(id: string, latitude = 0, longitude = 0, place = `Spot ${id}`): FlowerSpot {
  return {
    id, slug: `sp-${id}`, badge: '', bloomEndAt: '', bloomStartAt: '',
    bloomStatus: '', description: '', fee: '', festivalDate: '',
    flower: '벚꽃', flowerIsActive: true, flowerThumbnailUrl: null,
    helper: '', latitude, longitude, location: '', parking: '',
    place, thumbnailUrl: null, tone: 'pink',
  };
}

function wrap(node: ReactNode) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return <QueryClientProvider client={client}>{node}</QueryClientProvider>;
}

describe('HocanceTop5Section', () => {
  it('호캉스 0건이면 섹션 자체를 미렌더한다', async () => {
    vi.mocked(getPublishedStays).mockResolvedValue([]);
    vi.mocked(getTopSpots).mockResolvedValue([]);
    render(wrap(<HocanceTop5Section />));
    // 데이터 settle 시점을 대기하기 위해 짧은 microtask 비움
    await new Promise((r) => setTimeout(r, 0));
    expect(screen.queryByTestId('hocance-top5-section')).toBeNull();
  });

  it('호캉스가 있으면 섹션 헤더와 카드를 렌더한다', async () => {
    vi.mocked(getPublishedStays).mockResolvedValue([
      makeStay({ id: '1', latitude: 0.05, longitude: 0 }),
      makeStay({ id: '2', regionPrimary: '제주', latitude: 0.05, longitude: 0 }),
    ]);
    vi.mocked(getTopSpots).mockResolvedValue([makeSpot('s1', 0, 0, '장미공원')]);
    render(wrap(<HocanceTop5Section />));
    await screen.findByTestId('hocance-top5-section');
    expect(screen.getByText('오늘 여기서 호캉스 어떠세요?')).toBeTruthy();
    expect(screen.getAllByTestId('stay-card').length).toBeGreaterThan(0);
  });

  it('꽃 TOP 10 근처(≤60km)면 부스트 칩이 노출된다', async () => {
    vi.mocked(getPublishedStays).mockResolvedValue([
      makeStay({ id: '1', latitude: 0.05, longitude: 0 }), // ~5.6km
    ]);
    vi.mocked(getTopSpots).mockResolvedValue([makeSpot('s1', 0, 0, '장미공원')]);
    render(wrap(<HocanceTop5Section />));
    await screen.findByTestId('stay-card-boost-badge');
  });

  it('꽃 TOP 10과 거리 > 60km면 부스트 칩을 렌더하지 않는다', async () => {
    vi.mocked(getPublishedStays).mockResolvedValue([
      makeStay({ id: '1', latitude: 1.0, longitude: 0 }), // ~111km
    ]);
    vi.mocked(getTopSpots).mockResolvedValue([makeSpot('s1', 0, 0, '장미공원')]);
    render(wrap(<HocanceTop5Section />));
    await screen.findByTestId('hocance-top5-section'); // 섹션 자체는 렌더되어야 함
    expect(screen.queryByTestId('stay-card-boost-badge')).toBeNull();
  });
});
```

- [ ] **6-2. 테스트 실패 확인**

```bash
pnpm --filter mobile test src/features/home/components/HocanceTop5Section
```

Expected: FAIL (모듈 없음).

- [ ] **6-3. 구현**

`apps/mobile/src/features/home/components/HocanceTop5Section.tsx`:

> 핵심 결정: TOP 10 데이터 소스는 `TopSpotsSection`과 동일한 RPC `getTopSpots(10)`을 재사용. (`getPublishedSpots` + 클라이언트 `nowScore` 정렬은 사용 안 함 — 서버 RPC가 이미 정확한 TOP 10 산정 로직을 갖고 있고 두 섹션이 같은 TOP 10을 봐야 일관됨.)
> StayCard에 넘기는 핸들러는 `StayListScreen`과 **동일 패턴**으로 `openNaverHotelSearch` + `openNaverNavigation` + `isValidCoordinate`를 재사용한다 (UX 일관성).

```tsx
import { useMemo } from 'react';
import { useRouter } from 'expo-router';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';

import { getTopSpots, spotKeys } from '../../../shared/data/spotRepository';
import { getPublishedStays, stayKeys } from '../../../shared/data/stayRepository';
import { isValidCoordinate } from '../../../shared/lib/coordinate';
import { DIRECTIONS_DISABLED_MESSAGE, openNaverNavigation } from '../../../shared/lib/naverMap';
import { colors } from '../../../shared/theme/colors';
import { StayCard } from '../../stays/components/StayCard';
import { openNaverHotelSearch } from '../../stays/lib/naverHotel';
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
      <Text style={styles.title}>오늘 여기서 호캉스 어떠세요?</Text>
      <View style={styles.list}>
        {ranked.map(({ stay, boostReason }) => {
          const directionsDisabled = !isValidCoordinate(stay.latitude, stay.longitude);
          return (
            <StayCard
              key={stay.id}
              stay={stay}
              boostBadge={boostReason}
              directionsDisabled={directionsDisabled}
              onPress={() => router.push(staysDetailPath(stay.slug))}
              onPressDirections={() => {
                if (directionsDisabled) {
                  Alert.alert(DIRECTIONS_DISABLED_MESSAGE);
                  return;
                }
                openNaverNavigation({
                  name: stay.name,
                  latitude: stay.latitude,
                  longitude: stay.longitude,
                });
              }}
              onPressBook={() =>
                openNaverHotelSearch({ name: stay.name, queryOverride: stay.bookingQueryOverride })
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

> **유효성 가드:** 위 구현이 의존하는 export는 사전 점검 0-2에서 이미 확정 (`getTopSpots`, `spotKeys.top`, `openNaverHotelSearch`, `openNaverNavigation`, `isValidCoordinate`, `DIRECTIONS_DISABLED_MESSAGE`, `staysDetailPath`). `onPressDirections` 가드 패턴은 `StayListScreen.tsx`와 정확히 일치시킨다(코드 검토 시 비교).

- [ ] **6-4. 테스트 통과 확인**

```bash
pnpm --filter mobile test src/features/home/components/HocanceTop5Section
```

Expected: 3개 테스트 PASS.

- [ ] **6-5. 타입 체크**

```bash
pnpm --filter mobile typecheck
```

Expected: PASS.

- [ ] **6-6. 커밋**

```bash
git add apps/mobile/src/features/home/components/HocanceTop5Section.tsx apps/mobile/src/features/home/components/HocanceTop5Section.test.tsx
git commit -m "feat(home): 호캉스 TOP 5 섹션 HocanceTop5Section 추가"
```

---

### Task 7: `HomeScreen` 정리 + 헤더 텍스트화 + 호캉스 섹션 통합

**Files:**
- Modify: `apps/mobile/src/features/home/screens/HomeScreen.tsx`
- Create: `apps/mobile/src/features/home/screens/HomeScreen.test.tsx`

**왜:** 스펙 §2/§4에 명시된 제거·추가·헤더 변경을 한 번에 반영. 가장 큰 변경이라 테스트로 가드.

- [ ] **7-1. 실패 통합 테스트 작성**

`HomeScreen.test.tsx`:

```tsx
import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';

import { HomeScreen } from './HomeScreen';

vi.mock('expo-router', () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), back: vi.fn() }),
  Link: ({ children }: any) => children,
}));

vi.mock('../../../shared/data/spotRepository', () => ({
  getPublishedSpots: vi.fn().mockResolvedValue([]),
  getTopSpots: vi.fn().mockResolvedValue([]),
  spotKeys: {
    all: ['spots'],
    top: (n: number) => ['spots', 'top', n],
  },
  deriveFlowerLabels: vi.fn().mockReturnValue([]),
  deriveRegionSummaries: vi.fn().mockReturnValue(['서울', '제주']),
}));
vi.mock('../../../shared/data/stayRepository', () => ({
  getPublishedStays: vi.fn().mockResolvedValue([]),
  stayKeys: { all: ['stays'] },
}));
vi.mock('../../../shared/data/homeCurationRepository', () => ({
  getActiveHomeCurationSlots: vi.fn().mockResolvedValue([]),
  homeCurationKeys: { active: ['home-curation', 'active'] },
}));

function wrap(node: ReactNode) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return <QueryClientProvider client={client}>{node}</QueryClientProvider>;
}

describe('HomeScreen', () => {
  it('새 텍스트 헤더 "꽃 어디 & 호캉스 어디?"를 노출한다', async () => {
    render(wrap(<HomeScreen />));
    expect(await screen.findByText('꽃 어디 & 호캉스 어디?')).toBeTruthy();
  });

  it('TopSpotsSection을 렌더한다', async () => {
    render(wrap(<HomeScreen />));
    await screen.findByTestId('top-spots-section');
  });

  it('히어로 캐러셀/꽃 종류 칩/지금 보기 좋은 명소/위치 권한 버튼이 더 이상 렌더되지 않는다', async () => {
    render(wrap(<HomeScreen />));
    // 정확히 일치하는 잔존 텍스트들이 없음을 검증
    await new Promise((r) => setTimeout(r, 0));
    expect(screen.queryByText('꽃 종류 선택')).toBeNull();
    expect(screen.queryByText('지금 보기 좋은 명소')).toBeNull();
    expect(screen.queryByText('📍 내 주변 명소 보기')).toBeNull();
    expect(screen.queryByText('내 주변 명소')).toBeNull();
  });
});
```

> Note: HocanceTop5Section은 mock하지 않고 실제 렌더되게 두되, 데이터가 빈 배열이라 미렌더되는 게 정상.

- [ ] **7-2. 테스트 실패 확인**

```bash
pnpm --filter mobile test src/features/home/screens/HomeScreen
```

Expected: FAIL (헤더 텍스트 불일치, 잔존 섹션 검출 등).

- [ ] **7-3. 구현 — HomeScreen 정리**

`HomeScreen.tsx`를 다음 형태로 슬림화. 새 파일 작성 수준으로 대체해도 무방하지만, **반드시** 기존 `import`/스타일에서 미사용 항목을 동시에 정리한다.

핵심 변경 요약:

- 상단 import에서 다음 제거:
  - `AppState`, `AppStateStatus`, `Dimensions`, `ImageBackground`, `Linking`, `NativeScrollEvent`, `NativeSyntheticEvent`, `Pressable`, `ScrollView` (Pressable은 잔존 사용처가 있으면 보존)
  - `useEffect`, `useRef`, `useState` (잔존 사용처 없으면)
  - `SpotHeroCard`, `BloomArt`, `NativeSpotAd`(곧 끝나는 축제·지역별 뒤에 1개만 유지), `SkeletonBox`(로딩 분기 유지하면 보존)
  - `deriveFlowerLabels` 제거
  - `Coords`, `formatDistance`, `getNearbySpots`, `requestAndGetLocation` 제거
  - `StaysDiscoveryCard`, `useFeatureSeen`, `isStaysRoute`, `STAYS_ROUTE` 제거
- 신규 import:
  - `import { HocanceTop5Section } from '../components/HocanceTop5Section';`
- 함수 본문:
  - `featuredSpots` 쿼리 + curation 쿼리는 유지.
  - `selectedFlower`/`selectedSpot`/`orderedSpots`/`sectionSpots`/`shuffledSpots`/`heroSpots`/위치 권한 상태 전부 삭제.
  - `endingSoonSpot` 로직은 유지.
  - 로딩/빈 상태는 `<ScreenShell titleText="꽃 어디 & 호캉스 어디?" titleColor="#C4778A">`로 헤더만 갱신.
- JSX 본문:

```tsx
return (
  <ScreenShell titleText="꽃 어디 & 호캉스 어디?" titleColor="#C4778A">
    {curationSlots.length > 0 ? (
      <View style={styles.curationSection}>
        {curationSlots.map((slot) => (
          <SeasonCurationSlot key={slot.id} slot={slot} />
        ))}
      </View>
    ) : null}

    <TopSpotsSection />

    <HocanceTop5Section />

    <SectionHeading meta="종료된 일정은 제외해 보여드려요" title="곧 끝나는 축제" />
    <View style={styles.eventCard}>
      {/* 기존 endingSoonSpot 블록 그대로 */}
    </View>

    <NativeSpotAd />

    <SectionHeading meta="주말 나들이 큐레이션" title="지역별 추천" />
    <View style={styles.regionGrid}>
      {regionSummaries.map((item, index) => (
        <Pressable
          key={item}
          onPress={() => router.push({ pathname: '/(tabs)/search', params: { query: item } })}
          style={[styles.regionTile, index % 2 === 0 ? styles.regionTileTall : null]}
        >
          <Text style={styles.regionTitle}>{item}</Text>
          <Text style={styles.regionHelper}>지금 인기 명소 보기</Text>
        </Pressable>
      ))}
    </View>
  </ScreenShell>
);
```

- 미사용 스타일(`heroCarouselWrapper`, `heroCarousel`, `heroDots*`, `flowerCarousel*`, `flowerTile*`, `spotCard*`, `spotArt`, `spotImage*`, `spotContent`, `spotTitle`, `caption`, `badge*`, `buttonRow`, `primaryButton*`, `secondaryButton*`, `viewAllButton*`, `locationButton*`, `locationDenied*`, `locationSettingsButton*`, `nearbyDistance`, `nearbyInfo`, `nearbyList`, `nearbyMeta`, `nearbyRow`, `nearbyTitle`, `spotImageBadge*`, `spotImageInner`, `spotImageShade`, `spotStack`) 일괄 삭제.
- `SpotPreview` 함수 컴포넌트와 `getCountdownValue` 헬퍼는 잔존 사용처가 있으면 유지, 아니면 삭제.

> 작업 가이드: 한 번에 다 지우려 하지 말고, **(a) 새 JSX/import만 먼저 적용 → 타입체크 → 미사용 경고 확인 → (b) 경고 따라 미사용 식별자/스타일 삭제** 순서가 안전.

- [ ] **7-4. 타입 체크 (점진)**

```bash
pnpm --filter mobile typecheck
```

Expected: 사용하지 않는 import/변수 경고가 정리되며 PASS.

- [ ] **7-5. 테스트 통과 확인**

```bash
pnpm --filter mobile test src/features/home/screens/HomeScreen
```

Expected: 신규 통합 테스트 PASS.

- [ ] **7-6. 전체 회귀 테스트**

```bash
pnpm --filter mobile test
```

Expected: 다른 화면 회귀 없음. (특히 `ScreenShell` 미전달 호출이 깨지지 않았는지.)

- [ ] **7-7. 커밋**

```bash
git add apps/mobile/src/features/home/screens/HomeScreen.tsx apps/mobile/src/features/home/screens/HomeScreen.test.tsx
git commit -m "feat(home): 홈 화면을 TOP 10 + 호캉스 TOP 5 헤드라이너로 개편"
```

---

### Chunk 3 종료 체크포인트

- [ ] **C3-1. 전체 타입 체크 + 전체 테스트**

```bash
pnpm --filter mobile typecheck && pnpm --filter mobile test
```

Expected: 모두 PASS.

---

## Chunk 4: 잔존 파일 정리 + 최종 검증

### Task 8: `StaysDiscoveryCard` 제거

**Files:**
- Delete: `apps/mobile/src/features/home/components/StaysDiscoveryCard.tsx`
- Delete: `apps/mobile/src/features/home/components/StaysDiscoveryCard.test.tsx`

**왜:** Task 7에서 HomeScreen 호출을 제거했고, 다른 사용처가 없으면 컴포넌트도 삭제(데드 코드 방지).

- [ ] **8-1. 사용처 재확인** (src + app 라우트 + __mocks__ 전 범위)

```bash
grep -rn "StaysDiscoveryCard" apps/mobile/src apps/mobile/app apps/mobile/src/__mocks__ \
  --include="*.tsx" --include="*.ts"
```

Expected: `StaysDiscoveryCard.tsx`/`.test.tsx` 자체 외 0건. 만약 다른 곳에서 import가 남아있으면 이번 Task에서 정리.

- [ ] **8-2. 삭제**

```bash
git rm apps/mobile/src/features/home/components/StaysDiscoveryCard.tsx apps/mobile/src/features/home/components/StaysDiscoveryCard.test.tsx
```

- [ ] **8-3. 타입 체크 + 전체 테스트**

```bash
pnpm --filter mobile typecheck && pnpm --filter mobile test
```

Expected: PASS.

- [ ] **8-4. 커밋**

```bash
git commit -m "chore(home): 더 이상 사용하지 않는 StaysDiscoveryCard 제거"
```

> **메모:** `shared/lib/useFeatureSeen.ts`는 보존. 이유: `apps/mobile/app/(tabs)/_layout.tsx`(탭 NEW 뱃지)와 `apps/mobile/app/(tabs)/stays.tsx`(탭 진입 시 markSeen)가 현재도 사용 중이므로 삭제 불가. (사전 점검 0-2의 useFeatureSeen grep 결과로 재확인.)

---

### Task 9: 최종 검증 (앱 부팅·UI 확인)

**Files:** 없음 (실행만)

- [ ] **9-1. 타입 체크**

```bash
pnpm --filter mobile typecheck
```

Expected: PASS.

- [ ] **9-2. 전체 테스트**

```bash
pnpm --filter mobile test
```

Expected: 모두 PASS.

- [ ] **9-3. 디바이스/시뮬레이터 실행 (수동 검증)**

```bash
pnpm --filter mobile start
```

확인 체크리스트:
- 헤더에 "꽃 어디 & 호캉스 어디?" 한 줄 텍스트가 보인다.
- 히어로 캐러셀이 없다.
- "오늘의 꽃 명소 TOP 10" 가로 스크롤 노출.
- "오늘 여기서 호캉스 어떠세요?" 카드 1~5개 노출, 부스트 칩이 일부 카드에 "○○에서 N km"로 보인다.
- 꽃 종류 칩, 지금 보기 좋은 명소, 내 주변 명소 블록이 없다.
- "곧 끝나는 축제", "지역별 추천"은 그대로.
- 호캉스 카드 탭 → 호캉스 상세로 이동.
- 작은 디바이스(iPhone SE 등)에서 헤더가 잘리지 않음(폰트 자동 축소).

수동 결함이 발견되면 별도 Task로 fix → commit.

- [ ] **9-4. 최종 보고용 diff 요약**

```bash
git log --oneline main..HEAD
git diff --stat main..HEAD
```

---

## 작업 완료 정의 (Definition of Done)

- 모든 Task 체크박스 ✅.
- `pnpm --filter mobile typecheck`, `pnpm --filter mobile test` 모두 PASS.
- 수동 시뮬레이터 검증 체크리스트(9-3) 모두 OK.
- 작업 브랜치 `feat/home-hocance-integration`에 의미 단위로 커밋이 남아있고, 각 커밋이 독립적으로 빌드·테스트 가능.

다음 단계는 PR 생성 — 전역 `CLAUDE.md`의 PR 생성 프로세스(서브에이전트 코드리뷰 → 검토 리포트 → 승인 후 PR 생성)를 따른다.
