# StayCard 컴팩트화 + 명소 → 호텔 연계 강화 (설계 문서)

- 작성일: 2026-05-19
- 작성자: 메인 세션 (PM-Led brainstorming)
- 관련 브랜치: `feat/home-hocance-integration` (또는 후속 신규 브랜치)
- 선행 인계 메모: `project_hocance_phase2_handoff` (호캉스 Phase 2 마무리 후속)

## 1. 배경 / 목적

- 호캉스 통합 홈 개편(2026-05-12) 이후, `StayCard`가 홈 'TOP 5' 섹션과 호캉스 리스트 화면에서 동일하게 쓰이고 있다. 두 화면 모두 한 카드의 정보량이 많아(약 400px) 스크롤 부담이 크고, 길찾기 버튼은 실사용 비율이 낮은 것으로 판단되었다.
- 동시에 본 서비스의 핵심 가치인 **꽃 명소 ↔ 호텔 연계**를 카드 단위가 아닌 **컨텍스트(섹션)** 차원에서 더 단단하게 가져가는 방향이 필요하다. 특히 명소 상세 화면에서 "이 명소 옆에서 자고갈 곳"이라는 실제 동선이 단절돼 있다.
- 본 문서는 (a) `StayCard` 컴팩트화, (b) 명소 상세 화면에 **'주변 호텔'** 섹션 신설을 통합 설계한다. 향후 명소/티켓/맛집 카테고리 확장의 첫 적용 사례로서, 카드 패턴 재사용성도 염두에 둔다(이번 PR에서는 변형 추출 없이 호텔 케이스만 구현).

## 2. 합의된 결정 사항

| 항목 | 결정 |
|---|---|
| 카드 정체성 | **예약 전환 1순위** (호텔 프로모션 쇼케이스). 꽃 명소 정보는 보조 메타. |
| 카드 형태 | **가로형 (Horizontal)** — 좌 정사각 이미지 112×112 + 우 정보 4행 + 우하단 예약 칩 |
| 두 화면 적용 | 홈 'TOP 5' / 호캉스 리스트 **동일 카드 하나**로 통일. density prop 같은 분기 없음 |
| 길찾기 | **카드에서 제거**. (호텔 상세 화면의 'directionsDisabled' 정책은 영향 없음) |
| 예약 동선 | 카드 전체 탭 = 상세 진입. 우하단 칩 탭 = `openAgodaHotelSearch` 진입 |
| 명소 상세 신설 섹션 | `NearbyStaysSection` — '비슷한 꽃 명소' 섹션 **위**에 배치 |
| 큐레이션 반경 | 명소 좌표 기준 **30km 이내** 우선. 30km 내 후보 1개 미만이면 **60km까지 fallback** |
| 큐레이션 정렬 | `score = 0.7 × proximityNormalized + 0.3 × ratingNormalized` (홈 TOP5와 가중치 의도적으로 다름) |
| 노출 개수 | 최대 **3개**. 더 있으면 **'더보기 →'** → 호캉스 리스트(`/stays`)로 이동 |
| 0건 정책 | 반경 60km까지도 0개면 섹션 **전체 숨김** |
| 좌표 결측 호텔 | `isValidCoordinate` 실패 시 후보에서 제외 |
| `rankStays.ts` 반환 타입 | `BoostReason = { spotName, distanceKm }` **그대로 유지**. 라벨 변환(`label: string`)은 **호출부 책임**. 알고리즘은 데이터만 반환. |
| 거리 라벨 가드 | `distanceKm < 0.1` (= ~100m 미만) 일 때 거리 표기 대신 "**바로 옆**" 으로 치환. 거리 0m 등 어색한 출력 방지. |
| 광고 슬롯(`NativeSpotAd`) | 현 디자인 그대로 유지. 가로 카드와의 시각 위화감은 수동 검증(§6.3)에서만 점검. **위화감 발견 시에도 이번 PR 스코프 밖** → 디자인 일치화는 별도 PR 후보로 이전. |
| 이번 PR 비포함 | PlaceCard 추상화, 티켓·맛집 데이터 모델/카드, '더보기 →' 클릭 시 명소 기반 필터 prefill, **광고 슬롯 디자인 일치화** |

## 3. 카드 시안 명세

### 3.1 레이아웃 (가로형)

```
┌─ 112 ─┬────────────────────────────┐
│       │ 이름                  ★4.6 │
│ Hero  │ 경상남도 · 거제시           │
│ 112   │ 🌸 학동흑진주몽돌 6.2km    │  ← boost 있을 때만 (boostBadge)
│       │ [태그1][태그2]      [예약→]│
└───────┴────────────────────────────┘
카드 전체 높이 ≈ 112px (이미지 높이 = 카드 높이)
```

- **Hero**: 좌측 정사각 112×112, 좌상단 `typeBadge` (호텔/리조트/풀빌라/펜션 등)
- **이름 행**: `name` (18→**15px**, weight 800, 1-line ellipsis) + `★rating` (11px, weight 700, flex-shrink:0). 평점 없으면 칩 숨김.
- **지역 행**: `regionPrimary · regionSecondary` (11px, muted)
- **부스트 행**: `boostBadge.spotName + ' ' + formatDistance(boostBadge.distanceKm)` (11px, 분홍 `#8B3A4A`, weight 700). `boostBadge`가 null이면 이 행 숨김.
  - 명소 상세의 `NearbyStaysSection`에서는 "🌸 이 명소에서 6.2km" 형식으로 명소 이름을 생략한다(컨텍스트가 명소 페이지). → **boostBadge prop에 옵셔널 변형** 필요. 자세한 건 §3.4 참조.
- **CTA 행**: 좌측 태그 칩 최대 2개 (`seasonTags.slice(0, 2)`, 10px) + 우측 `예약 →` 칩 (배경 `colors.primary`, padding 6×10, 11px)

> **빈 boostBadge.label 정책**: 호출부 라벨 책임 분산으로 빈 문자열이 들어올 가능성 있음. `label` 이 빈 문자열이거나 `boostBadge === null`이면 행 자체를 미렌더(렌더 가드는 카드 컴포넌트 내부에서 처리).

### 3.2 톤 토큰 (변경 없음, 재사용)

- 태그 배경/전경: 기존 `TAG_TONE_BG` / `TAG_TONE_FG` 처음 2개 그대로
- 평점 별: `colors.accentGold` (현재 흰 칩에 표시) → 컴팩트 형태에서는 별표만 노란색으로, 배경 칩 제거
- 예약 칩: `colors.primary` (녹색) 솔리드 + 흰 텍스트

### 3.3 prop 시그니처 (Breaking change)

```ts
export type StayCardProps = {
  stay: Stay;
  onPress: () => void;        // 카드 전체 탭 → 상세
  onPressBook: () => void;    // 우하단 예약 칩 탭
  boostBadge?: { label: string } | null;  // ← 문자열 라벨로 변경 (아래 §3.4)
};
```

- **제거**: `onPressDirections`, `directionsDisabled` (모든 호출부에서 같이 제거)
- **변경**: `boostBadge` 가 `{ spotName, distanceKm }` → `{ label: string }` 로 일반화. 호출부에서 라벨 포맷 결정.
  - 홈 TOP5: `${spotName}에서 ${formatDistance(distanceKm)}`
  - 명소 상세 NearbyStaysSection: `이 명소에서 ${formatDistance(distanceKm)}`
  - 호캉스 리스트(StayListScreen): boostBadge 미전달 → null → 라인 숨김
  - **거리 가드 (양쪽 공통)**: `distanceKm < 0.1`이면 거리 토큰 자리에 `'바로 옆'`을 넣는다. 즉
    - 홈 TOP5: `${spotName} 바로 옆`
    - 주변 호텔: `이 명소 바로 옆`
    - 가드 적용 책임도 호출부. `shared/lib/proximityLabel.ts` (또는 동등 위치)에 `formatProximity(distanceKm: number): string` 헬퍼를 두고 두 호출부가 공유한다.

### 3.4 boostBadge 일반화의 트레이드오프

- **장점**: 컨텍스트별 자유 라벨 가능, 향후 다른 부스트 사유(예: "주말 특가") 확장 용이.
- **단점**: 호출부 로직이 약간 분산. 다만 라벨 포맷이 컨텍스트별로 명확히 다르므로 카드 내부 분기보다는 외부 결정이 적절.

## 4. NearbyStaysSection 명세

### 4.1 위치 (SpotDetailScreen 내)

```
SpotHeroCard
SpotStoriesSection
SpotPhotoGallery
LikeButton
MetaRow (축제/입장료)
SectionCard '방문 정보'
NativeSpotAd
SectionCard '소개'
SectionCard '팁'
NearbyStaysSection            ← 신설
SectionCard '비슷한 꽃 명소'
```

### 4.2 컴포넌트 인터페이스

```ts
// apps/mobile/src/features/spot/components/NearbyStaysSection.tsx
type Props = { spot: FlowerSpot };

export function NearbyStaysSection({ spot }: Props) { ... }
```

- 내부에서 `useQuery(stayKeys.all, getPublishedStays)` 호출 (캐시 공유)
- `findNearbyStays(spot, stays)` 순수 함수로 후보 산출
- 0건이면 `null` 반환 (섹션 자체 숨김)

### 4.3 큐레이션 순수 함수

```ts
// apps/mobile/src/features/spot/lib/findNearbyStays.ts
export type NearbyStay = { stay: Stay; distanceKm: number; score: number };

export type NearbyStaysResult = {
  stays: NearbyStay[];     // limit만큼 잘린 결과
  usedFallback: boolean;   // 1차(30km) 0건이라 fallback(60km)을 사용했으면 true
};

export type FindNearbyOptions = {
  limit?: number;          // 기본 3
  primaryRadiusKm?: number; // 기본 30
  fallbackRadiusKm?: number;// 기본 60
};

export function findNearbyStays(
  spot: FlowerSpot,
  stays: Stay[],
  options?: FindNearbyOptions,
): NearbyStaysResult;
```

> **반환 구조에 `usedFallback` 메타를 포함하는 이유**: `NearbyStaysSection` 헤더 라벨이 "30km 이내" / "60km 이내" 로 분기되어야 하는데, 호출부에서 다시 거리 분포를 검사하지 않고 한 번에 결정할 수 있어야 한다. 알고리즘이 분기를 알고 있으니 메타로 노출.

- 처리 순서(중요): **(1) 좌표 결측 호텔 제외 → (2) 반경 필터 → (3) 점수 계산 → (4) 정렬 → (5) limit 자르기**. 필터가 점수 계산보다 먼저이므로 `proximityNormalized`가 음수가 될 가능성 원천 차단.
- 1차: `primaryRadiusKm` 이내 후보 산출 + 정렬 → `limit` 만큼 반환
- 1차 결과가 0건일 때만 2차: `fallbackRadiusKm` 이내로 확장 후 동일 정렬 → `limit` 반환
- 정렬 점수: `score = 0.7 * (1 - distanceKm / fallbackRadiusKm) + 0.3 * normalizedRating(stay)`
  - distanceKm는 양수 / `fallbackRadiusKm` (60km) 으로 정규화 (가까울수록 1에 가까움)
  - **분모를 항상 fallbackRadiusKm로 고정하는 이유**: 1차/2차 모두 동일 척도로 점수 비교 가능. 다만 1차에서 후보가 30km 이내라 점수가 최소 0.5(=1-30/60) 이상이 되는 점은 의도된 일관성. 추후 튜닝자가 보기 쉽도록 코드에 한 줄 주석으로 남긴다.
  - normalizedRating = `combineRating(stay) / 5` (rankStaysForHome의 헬퍼와 동일 패턴, 재사용 또는 함수 export 후 재사용)
  - 동점 시 `distanceKm` 오름차순으로 결정적

### 4.4 UI 명세

- 섹션 제목: **"주변 호텔"** + 우측 거리 칩 `${spot.place} 30km 이내` (1차 반경 fallback 시 `60km 이내`)
- 카드는 §3 명세 그대로, `boostBadge.label = formatProximity(distanceKm, '이 명소')` 형식. 결과: `'이 명소에서 6.2km'` 또는 `'이 명소 바로 옆'`
- 카드 3개 아래 **"더보기 →"** 버튼 (호캉스 리스트 `/stays`로 라우팅). 후보가 limit(3) 이하이면 더보기 숨김.

> **어휘 일관성 메모**: 같은 섹션 안에서 거리 칩(섹션 헤더)은 명소 이름(`${spot.place}`)을 명시하고, 카드 내부 부스트 라벨은 컨텍스트가 명소 페이지임을 이용해 "이 명소"로 줄인다. 의도된 차이 — 섹션 헤더는 페이지 전반의 메타이고 카드는 그 안의 반복 단위라 짧게.

### 4.5 데이터 페치 정책

- 기존 `stayKeys.all` 캐시 그대로 활용. 별도 키 신설 없음.
- 명소 상세 화면 진입 시 stays 미페치 상태면 새로 페치(staleTime 통일은 별도 Phase 2 정리 항목).

## 5. 변경되는 파일 (영향 범위)

| 파일 | 변경 | 비고 |
|---|---|---|
| `apps/mobile/src/features/stays/components/StayCard.tsx` | **전면 리뉴얼** | 가로형 + boostBadge.label · 길찾기 prop 제거 |
| `apps/mobile/src/features/stays/components/StayCard.test.tsx` | **테스트 갱신** | 사라진 prop 테스트 제거 + 새 레이아웃 검증 |
| `apps/mobile/src/features/home/components/HocanceTop5Section.tsx` | **호출부 정리** | onPressDirections / directionsDisabled 제거, boostBadge 라벨 포맷 |
| `apps/mobile/src/features/stays/screens/StayListScreen.tsx` | **호출부 정리** | onPressDirections / directionsDisabled 제거 |
| `apps/mobile/src/features/home/lib/rankStays.ts` | **변경 없음** | `BoostReason = { spotName, distanceKm }` 그대로. 라벨 변환은 §3.3 결정대로 `HocanceTop5Section` 호출부에서 수행. 기존 단위 테스트도 변경 불요. |
| `apps/mobile/src/shared/lib/proximityLabel.ts` | **신규** | `formatProximity(distanceKm: number, subject: string): string` — `<0.1km`는 "바로 옆" 분기. 두 호출부(HocanceTop5/NearbyStays) 공유. **내부적으로 기존 `shared/lib/location.ts`의 `formatDistance(km)`를 재사용** — 거리 포매팅 로직 중복 방지. |
| `apps/mobile/src/shared/lib/proximityLabel.test.ts` | **신규** | 경계값(0, 0.099, 0.1, 1.0, 60.0) 테스트 |
| `apps/mobile/src/features/spot/lib/findNearbyStays.ts` | **신규** | 순수 함수 + 단위 테스트 |
| `apps/mobile/src/features/spot/lib/findNearbyStays.test.ts` | **신규** | TDD |
| `apps/mobile/src/features/spot/components/NearbyStaysSection.tsx` | **신규** | 섹션 컴포넌트 |
| `apps/mobile/src/features/spot/components/NearbyStaysSection.test.tsx` | **신규** | 0건/1건/N건/fallback 케이스 |
| `apps/mobile/src/features/spot/screens/SpotDetailScreen.tsx` | **삽입** | NearbyStaysSection을 '비슷한 꽃 명소' 위에 |

## 6. 테스트 전략

### 6.1 단위 테스트 (TDD)

- `findNearbyStays`:
  - 좌표 결측 호텔은 후보에서 제외
  - 30km 이내 후보가 있으면 fallback 미발동 (60km 후보 등장 안 함), `usedFallback === false`
  - 30km 이내 0개 + 60km 이내 2개면 2개 반환 (fallback 동작), `usedFallback === true`
  - 30km/60km 모두 0개면 `{ stays: [], usedFallback: false }` (fallback 시도했어도 false: 헤더 분기는 노출 카드 기준)
  - 정렬 결정성: 동일 score면 distanceKm 오름차순
  - limit=3 초과 후보 있을 때 3개로 잘림

- `StayCard`:
  - 길찾기 버튼이 더 이상 렌더되지 않음
  - 예약 칩 탭으로 onPressBook 호출
  - 카드 탭으로 onPress 호출
  - boostBadge.label 전달 시 해당 라인 렌더, null이면 미렌더
  - **boostBadge.label = '' (빈 문자열)** 도 라인 미렌더 (가드)
  - 평점 없는 stay에서 별 칩 미렌더
  - 태그가 3개 이상이어도 2개까지만 노출

- `formatProximity`:
  - `distanceKm = 0` → `'<subject> 바로 옆'`
  - `distanceKm = 0.099` → `'<subject> 바로 옆'` (경계 미만)
  - `distanceKm = 0.1` → `'<subject>에서 100m'` (경계 포함, formatDistance 출력)
  - `distanceKm = 1.0` → `'<subject>에서 1km'`
  - `distanceKm = 6.2` → `'<subject>에서 6.2km'`

- `NearbyStaysSection`:
  - 0건이면 컴포넌트가 `null` 반환 (testID 미존재)
  - N건이면 N개 카드 렌더, "더보기" 버튼은 후보 총 개수(필터 후 미잘림 기준)가 limit 초과일 때만 노출 — 단순화를 위해 이번 PR에서는 **N === limit이면 더보기 노출**(즉 잘렸을 가능성 추정)로 처리 가능. (정확한 잘림 신호가 필요하면 `findNearbyStays` 결과에 `truncated` 메타 추가 — 후속 PR 후보)
  - 거리 칩 라벨이 `usedFallback === false` 면 "${spot.place} 30km 이내", `true` 면 "${spot.place} 60km 이내"

### 6.2 회귀 / 통합

- 호캉스 리스트(`StayListScreen`)에서 length, 광고 슬롯 3개 간격이 유지되는지 (가로 카드라 광고 슬롯 비주얼 위화감 점검은 수동 검증 9-3 단계)
- 홈 TOP5에서 boostBadge가 있는 카드/없는 카드가 함께 섞여도 레이아웃이 깨지지 않음 (높이 동일 유지)
- `rankStaysForHome` 반환 형식 변경 시 기존 테스트 호환 — 라벨 변환을 호출부에서 하면 알고리즘 테스트는 변경 불필요

### 6.3 수동 검증 체크리스트

- 홈 TOP5: 카드 5개 컴팩트 렌더, 스크롤 부드러움
- 호캉스 리스트: 길찾기 버튼 부재 확인, 광고 슬롯 위화감 없음
- 명소 상세 (꽃 명소 좌표 정상): 주변 호텔 섹션 3개 노출, '비슷한 꽃 명소' 섹션 위에 위치
- 명소 상세 (꽃 명소 좌표 결측): NearbyStaysSection 0건 가드(좌표 결측 명소 자체는 isValidCoordinate로 보호해야 함 — 추가 가드 추가)
- 명소 상세 (외딴 명소, 60km 내도 0개): 섹션 자체가 숨겨짐
- 더보기 탭 시 `/stays` 이동

## 7. 향후 PR 후보 (이번 비포함)

- **PlaceCard 추상화** — `StayCard`를 좌이미지+우정보 패턴의 일반화로 추출. 명소/티켓/맛집 variant 도입 시점에 검토.
- **'더보기 →' 명소 컨텍스트 전달** — 호캉스 리스트에 `?nearSpot=<slug>` 같은 쿼리로 진입해 해당 명소 기반 정렬을 유지.
- **티켓·맛집 데이터 모델 신설** — 카테고리 통일성을 위한 인프라.
- **`combineRating` 공유** — `rankStays.ts`의 헬퍼를 `shared/data/rating.ts`로 추출 (이번 PR에서 즉시 필요해지면 그때 추출).
- **`NativeSpotAd` 디자인 일치화** — 가로형 StayCard와 톤이 안 맞으면 광고 슬롯 디자인을 가로 카드 비율에 맞춰 재디자인. 수동 검증(§6.3)에서 위화감 발견되어도 별도 PR에서 처리.

## 8. 리스크 / 트레이드오프

- **카드 컴팩트화로 시각 임팩트 감소**: 이미지가 112×112로 축소되어 호텔 분위기 어필이 약해진다. 그러나 호캉스 리스트에서 한 화면 내 비교 가능 카드 수가 늘어나 비교/선택 효율은 개선된다. PM 합의 시 임팩트 보완은 hero 큐레이션(상세 화면)에서 다룬다.
- **boostBadge 라벨 외부화**: 호출부가 라벨 포맷을 알아야 한다. 라벨 결정 책임을 카드 외부에 두는 게 의도(콘텍스트에 따라 표현이 다름). 라벨 포맷터를 `shared/lib/proximityLabel.ts` (§3.3) 에 모아 분산을 막는다.
- **fallback 반경 60km**: 60km는 자동차 이동 ~1시간. 도서/산악 명소에서 후보가 너무 멀 수 있음. 운영 데이터로 fallback 발동 빈도를 모니터링하고 조정.
- **rankStaysForHome과의 점수 가중 차이**: 홈 TOP5는 0.5/0.5, 주변 호텔은 0.7/0.3. 의도적으로 다르지만 추후 일관성 검토 필요.

## 9. Definition of Done

- 위 §6 단위/통합 테스트 모두 그린
- `tsc --noEmit` 통과
- 수동 검증 체크리스트 6항 모두 OK
- 미해결 PM 항목(`booking_query_override` 가이드 등 기존 인계 메모) 와 별개로 다뤄짐 — 이 PR이 추가로 막지 않음
