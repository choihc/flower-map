# 홈 화면 호캉스 통합 개편 설계

- **작성일**: 2026-05-18
- **대상 앱**: `apps/mobile` (Expo)
- **연관 도메인**: `features/home`, `features/stays`, `shared/data`
- **선행 작업**: 호캉스 Phase 2 (StayDetail/StayList 완료, 청크 3-c까지 완료)

---

## 1. 배경

호캉스(stays) 도메인이 모바일 앱에 도입되면서 홈 화면의 컨텍스트가 "꽃 명소만 추천"에서 "꽃 명소 + 그 근처에서 머물 곳"으로 확장된다. 현재 홈 화면은 히어로 캐러셀·꽃 종류 칩·지금 보기 좋은 명소·내 주변 명소 등 섹션이 누적되어 정보 밀도가 낮고 호캉스가 들어설 자리가 모호하다.

이번 개편으로 다음을 달성한다:

1. **메인 헤드라이너 격상**: "오늘의 꽃 명소 TOP 10"을 첫 화면의 헤드라이너로 격상해 의사결정을 빨리 유도.
2. **호캉스 자연 연결**: "오늘 여기서 호캉스 어떠세요?"를 동급 카드로 노출해 꽃-여행 컨텍스트를 자연스럽게 연결.
3. **홈 단순화**: 중복·노이즈 섹션을 제거해 스크롤 피로를 낮춤.

## 2. 새 정보 구조 (IA)

```
┌─────────────────────────────────────────┐
│ 🌸 꽃 어디 & 호캉스 어디?              │ 헤더 한 줄 (가로)
├─────────────────────────────────────────┤
│ [시즌 큐레이션 슬롯]                    │ 어드민 운영 (조건부)
│                                          │
│ 🌸 오늘의 꽃 명소 TOP 10                │ ★ 헤드라이너
│   (기존 TopSpotsSection)                 │
│                                          │
│ 🏨 오늘 여기서 호캉스 어떠세요?         │ ★ 신규 (동급 5개)
│                                          │
│ 🎆 곧 끝나는 축제                       │ 유지
│                                          │
│ 🗺️ 지역별 추천                          │ 유지
└─────────────────────────────────────────┘
```

### 제거 대상
- 히어로 캐러셀 (5개 랜덤 명소)
- `StaysDiscoveryCard` (1회성 호캉스 발견 카드 — 상시 호캉스 섹션으로 대체)
- 꽃 종류 선택 칩 + "지금 보기 좋은 명소" 5개 (TOP 10과 역할 중복)
- "내 주변 명소" 블록 + 위치 권한 CTA (위치 기반 개인화는 검색/지도 탭으로 이관)

### 유지
- `SeasonCurationSlot` (어드민 큐레이션)
- `TopSpotsSection` (제목만 "오늘의 꽃 명소 TOP 10"으로 변경)
- "곧 끝나는 축제" 블록 (`endingSoonSpot` 로직)
- 지역별 추천 그리드
- `NativeSpotAd` 광고 슬롯

## 3. 호캉스 TOP 5 랭킹 알고리즘

### 입력 신호
- `stay.naverRating.score`, `stay.googleRating.score`
- `stay.latitude`, `stay.longitude`
- 오늘의 꽃 명소 TOP 10의 위경도

### 평점 결합 규칙 (단일 규칙으로 확정)
- 둘 다 있으면 **평균**.
- 한쪽만 있으면 그 값.
- 둘 다 없으면 `null` → `normalizedRating = 0`.

### 점수식
```
normalizedRating = clamp(rating, 0, 5) / 5         // 0..1
proximityBoost   = f(minDistanceKmToTop10Spots)    // 0..1

  d ≤ 10km            → 1.0
  10km < d ≤ 30km     → 0.6
  30km < d ≤ 60km     → 0.3
  d > 60km            → 0

score = 0.5 * normalizedRating + 0.5 * proximityBoost
```

- 경계는 폐구간(≤). 정확히 30.0km면 0.6, 60.0km면 0.3.
- 꽃 TOP 10이 비었거나 호텔 위경도가 없을 때는 `proximityBoost = 0` → 평점 단독(최대 0.5). **재정규화하지 않는다** (그대로 0.5 손실 감수 — 식 단순화 우선).

### 다양성 필터
- `regionPrimary` 기준 같은 시/도에서 최대 2개.
- 점수 내림차순 정렬 → 위에서부터 같은 시/도 카운트하며 채택, 최대 2개 초과 시 스킵 → 5개 모일 때까지.
- 후보 풀 상한 15개. 호캉스 전체가 15개 미만이면 가능한 만큼만 처리, 최종 5개 미만이어도 그대로 노출(0개면 섹션 미렌더).

### 부스트 사유 노출
- 각 호텔 카드에 `"<가장 가까운 꽃 명소 이름>에서 {formatDistance(km)}"` 칩 표시.
- `shared/lib/location.ts`의 `formatDistance` 재사용(km/m 자동 포맷).
- 거리가 60km 초과거나 꽃 TOP 10이 비었으면 칩 미노출.

### 계산 시점
- 클라이언트에서 매 페치마다 계산. 별도 캐시/RPC 불필요.
- 꽃 TOP 10이 매일 변하므로 서버 캐싱 이점 적음.


## 4. 컴포넌트 변경 명세

### `apps/mobile/src/features/home/screens/HomeScreen.tsx`
- 다음 상태/이펙트/JSX 블록 **삭제**:
  - 히어로: `heroSpots`, `activeHeroIndex`/`onHeroScroll`, `heroCarouselWrapper`/`heroCarousel`/`heroDots` 스타일.
  - `shuffledSpots`: 현재 히어로(`heroSpots`)와 "지금 보기 좋은 명소"(`sectionSpots`)에서만 사용 — 둘 다 제거되므로 `shuffledSpots`도 함께 제거.
  - 위치 권한: `LocationState` 타입, `locationState`/`userCoords`/`locationStateRef`, `handleLocationPress`, `AppState` listener, `nearbySpots`, 관련 JSX(`locationButton`/`locationDenied`/`nearbyList`).
  - 꽃 종류 칩: `selectedFlower`, `flowerLabels`, `flowerCarousel*` 스타일, "꽃 종류 선택" 섹션.
  - 지금 보기 좋은 명소: `sectionSpots`, `SpotPreview` 컴포넌트와 호출, `viewAllButton`.
  - `StaysDiscoveryCard` 호출 + `useFeatureSeen('stays')` 호출.
  - `isStaysRoute`/`STAYS_ROUTE` import 및 사용처(`hasActiveStaysCuration`, `router.push(STAYS_ROUTE)`): HomeScreen에서만 쓰이므로 import 제거. `features/stays/routes.ts` 모듈 자체는 다른 진입(`/(tabs)/stays.tsx` 등)에서 쓸 수 있으므로 보존.
- **추가**: `<HocanceTop5Section />` 호출을 `<TopSpotsSection />` 바로 아래에 배치.
- `TopSpotsSection` 제목을 "오늘의 꽃 명소 TOP 10"으로 변경.
- 결과: HomeScreen은 ~384줄 → ~150줄 수준으로 축소.

### `apps/mobile/src/features/home/components/TopSpotsSection.tsx`
- 76행 `오늘의 TOP 10` → `오늘의 꽃 명소 TOP 10` 으로 텍스트 변경.

### `apps/mobile/src/features/home/components/HocanceTop5Section.tsx` (신규)
- 책임:
  - 호캉스 전체(`getPublishedStays`) + 꽃 TOP 10 데이터 페치.
  - `rankStaysForHome` 호출로 5개 산출.
  - 섹션 헤더 "오늘 여기서 호캉스 어떠세요?" + 호텔 카드 세로 스택 렌더.
  - 결과 0건이면 섹션 전체 미렌더(헤더 포함).
- 카드 UI: 기존 `features/stays/components/StayCard`를 재사용.
- `testID="hocance-top5-section"` 부여.

### `apps/mobile/src/features/stays/components/StayCard.tsx` (수정)
- 부스트 사유 칩을 카드 내부에 그리기 위해 prop 1개 추가:
  ```ts
  boostBadge?: { spotName: string; distanceKm: number } | null;
  ```
- 칩 렌더는 기존 카드 레이아웃을 흩뜨리지 않도록 카드 하단 메타 라인 우측 또는 신규 한 줄로 배치(디테일은 구현 시 결정, 시각적 일관성만 충족).
- `boostBadge`가 undefined/null이면 기존 동작 그대로 — `StayListScreen` 등 다른 사용처 영향 없음.

### `apps/mobile/src/features/home/lib/rankStays.ts` (신규)
- 순수 함수 모듈. UI 의존성 없음.
- API:
  ```ts
  export type RankedStay = {
    stay: Stay;
    score: number;
    boostReason: { spotName: string; distanceKm: number } | null;
  };

  export function rankStaysForHome(
    stays: Stay[],
    top10Spots: FlowerSpot[],
    options?: { limit?: number; perRegionMax?: number },
  ): RankedStay[];
  ```
- 내부 의존: `shared/lib/location`의 haversine 거리 함수 재사용 (없으면 동일 모듈에 추가 후 export).
- 기본값: `limit = 5`, `perRegionMax = 2`, 후보 풀 상한 = 15.

### 헤더 타이틀 ★ 인터페이스 영향
- 현 `ScreenShell`은 `title` prop을 받지만 실제 렌더에서는 사용하지 않고 `assets/images/title.png` 로고 이미지를 그린다.
- 헤더 텍스트 "🌸 꽃 어디 & 호캉스 어디?"를 표시하려면 ScreenShell을 다음과 같이 확장한다:
  - 새 prop `titleText?: string` 추가. 제공되면 로고 이미지 대신 텍스트로 렌더.
  - 기본 사용처(다른 화면들)는 prop을 안 넘기므로 기존 로고 동작 유지 → 영향 없음.
  - HomeScreen만 `<ScreenShell titleText="꽃 어디 & 호캉스 어디?" titleColor="#C4778A">`로 호출.
- 작은 디바이스 잘림 방지: `numberOfLines={1}` + `adjustsFontSizeToFit` + 최소 폰트 사이즈 가드.
- `title` prop은 testID/accessibility 라벨 용도로만 유지(혹은 향후 제거 검토 — 이번 범위는 추가만).

## 5. 데이터·DB 영향

- **DB 마이그레이션 불필요**. 기존 `stays`, `spots` 컬럼만 사용.
- `shared/data/stayRepository.ts`에 `getPublishedStays`가 이미 존재(`StayListScreen`에서 사용 중) — 그대로 재사용.
- 광고/`NativeSpotAd` 노출 정책 변경 없음.

## 6. 테스트 전략

### 단위 테스트
- `rankStays.test.ts`
  - 평점 동률 시 거리 가까운 쪽이 위로 오는가
  - `perRegionMax = 2` 필터 작동
  - 꽃 TOP 10이 빈 배열일 때 평점 단독으로 정렬
  - 후보가 5개 미만이면 가능한 만큼만 반환
  - 거리 임계치(10/30/60km) 경계값
- `HocanceTop5Section.test.tsx`
  - 호캉스 0건 → 섹션 미렌더
  - 호캉스 있고 꽃 TOP 10 있음 → 5개 렌더 + 부스트 사유 칩 노출
  - 거리 60km 초과 → 부스트 칩 미노출

### 통합 테스트
- `HomeScreen.test.tsx`
  - 히어로 캐러셀 testID 없음
  - 꽃 종류 칩 없음
  - "지금 보기 좋은 명소" 헤더 없음
  - 위치 권한 버튼 없음
  - `top-spots-section`, `hocance-top5-section` 노출
  - 곧 끝나는 축제, 지역별 추천 노출
- `ScreenShell.test.tsx` (또는 HomeScreen 통합 테스트)
  - `titleText` 전달 시 텍스트 헤더 "꽃 어디 & 호캉스 어디?" 노출
  - `titleText` 미전달 시 로고 이미지 노출(기존 동작 회귀 방지)

## 7. 마이그레이션·운영 고려

- **시즌 큐레이션 슬롯과 중복**: 어드민이 호캉스 가리키는 슬롯을 활성화하면 시각적 중복이 발생할 수 있다. 어드민 운영 가이드(별도 메모)로 안내.
- **롤백 플랜**: 기존 컴포넌트 코드는 git history에서 복구 가능. 별도 feature flag는 두지 않음(범위 명확, 비파괴 변경).

## 8. 범위 외 (Out of Scope)

- 호캉스 데이터 자체의 확보·정제(이미 Phase 2에서 진행 중).
- 위치 기반 개인화의 검색/지도 탭 이관 작업(이번 PR은 홈에서 제거만 수행, 다른 탭에 새 진입점 추가 없음).
- 어드민 호캉스 큐레이션 UI.
- 평점 신뢰도 보정(리뷰 1개에 5점 문제 — 운영 후 최소 리뷰 수 임계치 도입 검토).
- 호캉스 노출 회전(7일 이내 본 호텔 후순위 — `useFeatureSeen` 패턴 확장 가능).
- `ScreenShell.title` 레거시 prop의 향후 정리(이번 범위는 `titleText` 추가만).
