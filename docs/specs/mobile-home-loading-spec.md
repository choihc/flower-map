---
작성일: 2026-06-19
최종 수정일: 2026-06-26
관련 플랜: docs/plans/mobile-home-loading.md (작성 예정)
대체 관계: 본 스펙은 `docs/specs/2026-06-05-home-loading-skeleton-spec.md` 의 "통합 대기 게이트" 모델(FR-1~FR-5, `useHomeReady`)을 **대체(supersede)** 한다. `SkeletonBox` 공용 프리미티브 정의(구 스펙 5.1)는 변경 없이 계승한다.
---

# 모바일 홈 로딩 동작 스펙

## 1. 개요

모바일 앱(`apps/mobile`, Expo) 홈 화면(`HomeScreen`)의 **데이터 로딩·렌더링 동작**과, 이를 뒷받침하는 **앱 전역 React Query 캐시 영속화**의 명세다. `apps/web`·`apps/toss-mini`·공유 패키지와 무관하다.

홈은 서로 다른 시점에 완료되는 여러 데이터 쿼리에 의존한다. 본 스펙은 두 가지 결과물을 정의한다.

- **점진적 렌더링(P1)** — 화면 셸은 즉시 표시되고, 각 섹션은 자신의 데이터가 준비되는 즉시 **독립적으로** 노출된다. 화면 전체를 단일 게이트로 묶지 않는다. (구 스펙의 통합 게이트 모델 대체)
- **쿼리 캐시 영속화(P2)** — React Query 캐시를 디바이스 저장소에 영속화한다. 재방문·콜드 스타트 시 직전 데이터를 **즉시 표시**하고 백그라운드에서 갱신한다(stale-while-revalidate).

데이터는 서버 cron에 의해 하루 1~2회만 갱신되므로(명소 `now_score` 등), 공격적 클라이언트 캐싱이 신선도를 해치지 않는다.

## 2. 기능 요구사항 (FR)

### 2.1 점진적 렌더링 (P1)

- **FR-1 (화면 셸 즉시 표시)** — 홈 진입 시 화면 셸(`ScreenShell`: 헤더·레이아웃·스크롤 컨테이너)은 어떤 데이터 응답도 기다리지 않고 **즉시** 렌더된다.
- **FR-2 (전체 대기 게이트 부재)** — 화면 전체를 막는 통합 준비 판정(`useHomeReady`)과 전체 화면 통합 스켈레톤(`HomeSkeleton`)은 **존재하지 않는다**. 한 섹션의 `pending`이 다른 섹션의 노출을 막지 않는다.
- **FR-3 (섹션 독립 렌더링)** — 각 섹션은 자신이 의존하는 쿼리의 상태(`pending`/`success`/`error`)에 따라 **독립적으로** 렌더된다. 섹션과 데이터 의존성은 다음과 같다.

  | 섹션 | 데이터 의존(쿼리 키 / 조회 함수) | 비고 |
  |---|---|---|
  | 큐레이션(`SeasonCurationSlot[]`) | `homeCurationKeys.active` / `getActiveHomeCurationSlots` | 유효 슬롯 없으면 숨김 |
  | 꽃 명소 TOP(`TopSpotsSection`) | `spotKeys.top(10)` / `getTopSpots(10)` | 자체 로딩/빈 상태 보유 |
  | 호캉스(`HocanceTop5Section`) | `stayKeys.all` / `getPublishedStays` + `spotKeys.top(10)` | 결과 0건이면 숨김 |
  | 곧 끝나는 축제 | `spotKeys.all` / `getPublishedSpots` | 대상 없으면 숨김 |
  | 광고(`NativeSpotAd`) | (데이터 쿼리 없음) | 광고 SDK 자체 처리 |
  | 지역별 추천 | `spotKeys.all` / `getPublishedSpots` | — |

- **FR-4 (섹션별 로딩 표시)** — 데이터 의존 섹션은 의존 쿼리가 `pending`인 동안 **자기 영역 크기에 맞는 스켈레톤**(`SkeletonBox` 기반)을 표시한다. 셸과 섹션 헤더는 스켈레톤과 무관하게 즉시 보인다.
  - **FR-4.1 (풀카드 단색 블록)** — 스켈레톤은 대응하는 실제 카드와 **동일한 외곽 치수(width·height·borderRadius)** 를 가진 단색 펄스 블록이어야 한다. 실제 카드보다 작은 박스를 별도의 (흰) 배경 카드 컨테이너로 감싸 박스 하단·주변에 빈 여백을 남기지 않는다. 로딩→데이터 전환 시 레이아웃 점프를 최소화한다.
  - **FR-4.2 (여백 책임)** — `SkeletonBox`는 자체적으로 외부 여백(`marginBottom` 등)을 강제하지 않는다. 박스 간 간격은 부모 컨테이너(`gap` 등)가 관리한다.
- **FR-5 (빈 상태)** — 의존 쿼리가 `success`이고 표시할 데이터가 없으면, 각 섹션은 정의된 빈 상태 처리를 한다(해당 섹션 숨김 또는 섹션별 안내). 빈 상태가 다른 섹션에 영향을 주지 않는다.
- **FR-6 (에러 상태)** — 의존 쿼리가 `error`이면 해당 섹션만 스켈레톤을 멈추고 빈/에러 상태로 처리한다(해당 섹션 숨김 허용). 다른 섹션은 정상 렌더된다. 에러는 기존과 동일하게 `console.error`로 관측 가능해야 한다.

### 2.2 쿼리 캐시 영속화 (P2)

- **FR-7 (캐시 영속)** — 앱 전역 React Query 캐시는 디바이스 저장소(AsyncStorage)에 영속화되며, 콜드 스타트 시 복원된다.
- **FR-8 (즉시 표시 후 갱신 / stale-while-revalidate)** — 복원된 캐시가 존재하면 섹션은 해당 데이터를 **즉시** 표시하고(스켈레톤 없이), 백그라운드에서 최신 데이터로 갱신한다. 갱신 완료 시 화면이 매끄럽게 반영된다.
- **FR-9 (캐시 만료)** — 영속 캐시의 보존 기한은 **24시간**(`maxAge`)이다. 기한을 초과한 캐시는 복원되지 않고 신규 조회한다.
- **FR-10 (캐시 무효화 / buster)** — 앱 버전 또는 캐시 스키마 버전이 바뀌면 기존 영속 캐시를 폐기하고 신규 조회한다(`buster`).
- **FR-11 (영속 대상)** — 성공(`success`) 상태의 쿼리 전체를 영속화한다. 에러/`pending` 쿼리는 영속하지 않는다.

## 3. 비기능 요구사항 (NFR)

- **NFR-1 (앱 격리)** — 모든 변경은 `apps/mobile/`에 국한된다. `apps/toss-mini`·`apps/web`·공유 패키지의 동작을 변경하지 않는다.
- **NFR-2 (신선도)** — 데이터는 일 단위로 갱신되므로 `staleTime`·`maxAge`는 그에 부합한다. 사용자는 최대 24시간 이내의 캐시를 즉시 볼 수 있고, 진입(또는 포그라운드 복귀) 시 백그라운드 갱신으로 최신화된다.
- **NFR-3 (테스트)** — 신규·변경 동작(섹션 독립 렌더링, 영속 설정 계약)은 모두 자동 테스트로 검증한다. `SkeletonBox` 애니메이션은 vitest + react-native mock 환경에서 렌더를 깨지 않아야 한다.
- **NFR-4 (성능 — 재방문 무왕복)** — 유효 캐시가 있는 재방문 시, 첫 의미 있는 콘텐츠는 네트워크 왕복 없이 표시된다.
- **NFR-5 (의존성 최소)** — 영속화는 공식 TanStack 패키지(`@tanstack/react-query-persist-client`, `@tanstack/query-async-storage-persister`)와 이미 설치된 `@react-native-async-storage/async-storage`만 사용한다. 그 외 신규 의존성을 추가하지 않는다.
- **NFR-6 (중복 요청 없음)** — 동일 쿼리 키를 공유하는 섹션 간 중복 네트워크 요청이 발생하지 않는다(React Query 디둑/`staleTime`).

## 4. 구조

### 4.1 합성 트리 (목표)

```
RootLayout
└─ PersistQueryClientProvider(client, persistOptions)   // FR-7~FR-11
   └─ AuthProvider
      └─ Stack ...
         └─ HomeScreen
            └─ ScreenShell                                // 즉시 렌더 (FR-1)
               ├─ CurationSection      ─ useQuery(curation.active)   // 독립 (FR-3)
               ├─ TopSpotsSection      ─ useQuery(spot.top(10))      // 독립
               ├─ HocanceTop5Section   ─ useQuery(stays.all, top(10))// 독립
               ├─ EndingSoonSection    ─ useQuery(spot.all)          // 독립
               ├─ NativeSpotAd
               └─ RegionRecommendSection ─ useQuery(spot.all)        // 독립
```

`HomeScreen`은 더 이상 준비 게이트로 분기하지 않는다. 각 섹션은 자기 데이터 의존과 로딩/빈/에러 계약을 갖는 자족적(self-contained) 단위다.

### 4.2 데이터 흐름

```
앱 시작 ─▶ 저장소에서 캐시 복원(maxAge 24h, buster 일치 시)
                 │
HomeScreen 마운트 ─▶ 각 섹션 useQuery 구독
                 │
   캐시 적중(유효) ─▶ 즉시 데이터 렌더 + 백그라운드 갱신(stale-while-revalidate)
   캐시 미스/만료 ─▶ 섹션별 스켈레톤 ─ 응답 도착 시 해당 섹션만 콘텐츠로 교체
```

### 4.3 디렉터리

| 파일 | 종류 | 비고 |
|---|---|---|
| `src/shared/lib/queryClient.ts` | 수정 | `gcTime ≥ maxAge`(24h)로 상향, 영속 호환 |
| `src/shared/lib/queryPersister.ts` | 신규 | AsyncStorage persister + persistOptions(maxAge·buster) |
| `app/_layout.tsx` | 수정 | `QueryClientProvider` → `PersistQueryClientProvider` |
| `src/features/home/screens/HomeScreen.tsx` | 수정 | 게이트 분기 제거, 섹션 합성 |
| `src/features/home/lib/useHomeReady.ts` | 삭제 | 통합 게이트 폐기(FR-2) |
| `src/features/home/components/HomeSkeleton.tsx` | 삭제 | 전체 화면 통합 스켈레톤 폐기(FR-2) |
| `src/features/home/components/CurationSection.tsx` | 신규(또는 인라인) | 큐레이션 섹션 자족화 |
| `src/features/home/components/EndingSoonSection.tsx` | 신규(또는 인라인) | 곧 끝나는 축제 섹션 자족화 |
| `src/features/home/components/RegionRecommendSection.tsx` | 신규(또는 인라인) | 지역별 추천 섹션 자족화 |
| `src/features/home/components/HocanceTop5Section.tsx` | 수정 | `pending` 시 스켈레톤 추가(현재는 0건 시 `null`) |
| `src/shared/ui/SkeletonBox.tsx` | 변경 없음 | 구 스펙 5.1 계승(공용 프리미티브) |

> 인라인 유지 vs 컴포넌트 추출은 플랜의 최소 Diff 판단에 따른다. 본 스펙은 "각 섹션이 자족적 로딩/빈/에러 계약을 가진다"는 동작만 규정한다.

## 5. 구성 요소별 책임과 계약

### 5.1 `queryClient` (수정)

```ts
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 30,      // 30분(데이터 일 단위 갱신 — 상향)
      gcTime: 1000 * 60 * 60 * 24,    // 24h — persist maxAge 이상이어야 복원 대상 유지
      retry: 2,
    },
  },
});
```
- 영속 복원이 동작하려면 각 쿼리의 `gcTime`이 `maxAge` 이상이어야 한다. 기존 기본 `gcTime`(5분)은 영속 maxAge보다 짧아 부적합하므로 상향한다.

### 5.2 `queryPersister` (신규)

```ts
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const CACHE_BUSTER: string;                 // 앱 버전 또는 캐시 스키마 버전
export const PERSIST_MAX_AGE = 1000 * 60 * 60 * 24; // 24h (FR-9)

export const asyncStoragePersister = createAsyncStoragePersister({
  storage: AsyncStorage,
  key: 'flower-map-rq-cache',
});

export const persistOptions = {
  persister: asyncStoragePersister,
  maxAge: PERSIST_MAX_AGE,
  buster: CACHE_BUSTER,
  dehydrateOptions: {
    shouldDehydrateQuery: (query) => query.state.status === 'success', // FR-11
  },
};
```

### 5.3 `_layout.tsx` (수정)

```ts
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
// ...
<PersistQueryClientProvider client={queryClient} persistOptions={persistOptions}>
  <AuthProvider> ... </AuthProvider>
</PersistQueryClientProvider>
```
- 기존 `QueryClientProvider`를 대체한다. 그 외 트리는 변경하지 않는다.

### 5.4 `HomeScreen` (수정)

- `useHomeReady` 호출·`ready` 분기·`HomeSkeleton` 반환을 제거한다.
- `ScreenShell` 내부에 각 섹션을 직접 합성한다. 각 섹션은 자기 쿼리·로딩/빈/에러를 스스로 처리한다.
- 기존 데이터 파생 로직(`deriveRegionSummaries`, `endingSoonSpot` 선정, 큐레이션 필터)은 해당 섹션 단위로 귀속된다.

### 5.5 섹션 컴포넌트 공통 계약

각 데이터 의존 섹션은 다음 상태 계약을 만족한다.

| 상태 | 동작 |
|---|---|
| `pending` (캐시 미스) | 자기 영역 크기의 `SkeletonBox` 스켈레톤 표시 (FR-4) |
| `success` + 데이터 있음 | 콘텐츠 렌더 |
| `success` + 데이터 없음 | 섹션 숨김 또는 섹션별 빈 안내 (FR-5) |
| `error` | 섹션 숨김 허용 + `console.error` 관측 (FR-6) |
| 캐시 적중(유효) | 최초 렌더에서 즉시 콘텐츠(무스켈레톤) + 백그라운드 갱신 (FR-8) |

## 6. 타입 정의

```ts
type PersistOptions = {
  persister: Persister;
  maxAge: number;       // ms
  buster: string;
  dehydrateOptions?: { shouldDehydrateQuery: (query: Query) => boolean };
};
```

## 7. 외부 의존성

- **React Query** `@tanstack/react-query` (설치본) — 쿼리/캐시/상태.
- **신규**: `@tanstack/react-query-persist-client`, `@tanstack/query-async-storage-persister` — 캐시 영속.
- **`@react-native-async-storage/async-storage`** (설치본) — 영속 저장소.
- **react-native-reanimated** (설치본) — `SkeletonBox` 펄스.
- 조회 함수·키: `spotRepository`(`getPublishedSpots`, `getTopSpots`, `spotKeys`), `homeCurationRepository`(`getActiveHomeCurationSlots`, `homeCurationKeys`), `stayRepository`(`getPublishedStays`, `stayKeys`).

## 8. 명시적 가정

- 조회 함수·쿼리 키는 현행 그대로 존재하며, 섹션들이 동일 키를 사용해 캐시를 공유한다(중복 요청 없음 — NFR-6).
- React Query v5의 `status` 의미(`pending`=최초 응답 전, 에러 시 `pending` 해제)를 따른다.
- `@tanstack/react-query-persist-client`는 영속 복원을 비동기로 수행하며, 복원 완료 전에는 캐시가 비어 있어 섹션이 스켈레톤을 보일 수 있다(허용). 복원 완료 시 즉시 데이터로 전환된다.
- AsyncStorage는 테스트 환경에서 mock으로 대체 가능하며, 영속 설정 검증은 설정 객체 계약(maxAge·buster·dehydrate 조건) 단위로 가능하다.
- `CACHE_BUSTER`는 앱 버전(`app.config.ts`의 `version`) 또는 별도 캐시 스키마 버전 문자열에서 파생한다(플랜에서 확정).
