---
작성일: 2026-06-19
최종 수정일: 2026-06-19
관련 스펙: docs/specs/mobile-home-loading-spec.md
대상 앱: apps/mobile (Expo)
브랜치: feat/mobile-home-progressive-loading (main 기준 분기)
---

# 모바일 홈 로딩 동작 실행 플랜

`docs/specs/mobile-home-loading-spec.md`(이하 "스펙")를 충족시키는 실행 계획. P2(캐시 영속) 인프라를 먼저 깔고(저위험·독립), P1(점진적 렌더링)을 TDD로 이행한다. 모든 변경은 `apps/mobile/`에 국한한다(NFR-1).

## 0. 작업 범위 요약

- **P2(FR-7~11)**: React Query 캐시를 AsyncStorage에 24h 영속화. `queryClient` 상향 + `queryPersister` 신규 + `_layout` Provider 교체.
- **P1(FR-1~6)**: 전체 대기 게이트(`useHomeReady`)·통합 스켈레톤(`HomeSkeleton`) 제거. 각 섹션을 자족적(self-contained) 컴포넌트로 만들어 독립 로딩/빈/에러 처리.
- **결정(스펙 §4.3 미결사항 확정)**: 인라인 섹션(큐레이션·곧 끝나는 축제·지역별 추천)은 **컴포넌트로 추출**한다. 근거: 게이트 제거 후 각 섹션이 자기 `useQuery`를 직접 구독해야 하며(FR-3), 추출이 섹션별 단위 테스트(NFR-3)를 자연스럽게 한다. `EndingSoonSection`·`RegionRecommendSection`은 동일 `spotKeys.all` 키를 공유하므로 중복 요청이 없다(NFR-6).

## 1. 단계 0 — 사전 확인 (커밋 없음)

1. **베이스라인**: `pnpm --filter mobile test` 전체 통과 확인. (현 그린 상태 기록)
2. **브랜치 생성**: `git checkout -b feat/mobile-home-progressive-loading` (현재 `main`).
3. **타입체크 베이스라인**: `pnpm --filter mobile exec tsc --noEmit` 통과 확인.

> 검증: 위 3개 모두 통과해야 다음 단계 진입.

---

## 2. 단계 1 — P2 캐시 영속 인프라

### 태스크 1.1 — persist 패키지 설치 (커밋: `chore(mobile): react-query persist 패키지 추가`)

- 명령: `pnpm --filter mobile add @tanstack/react-query-persist-client@^5 @tanstack/query-async-storage-persister@^5`
- **생산 계약**: `apps/mobile/package.json` dependencies에 두 패키지 추가(react-query ^5.95.2와 메이저 일치).
- 검증: `pnpm --filter mobile exec tsc --noEmit` 통과.

### 태스크 1.2 — `queryClient` 상향 (TDD)

- **파일**: `apps/mobile/src/shared/lib/queryClient.ts`(수정), `apps/mobile/src/shared/lib/queryClient.test.ts`(신규)
- **소비 계약**: `import { queryClient } from './queryClient'`.
- **생산 계약**: `queryClient.getDefaultOptions().queries` = `{ staleTime: 1800000, gcTime: 86400000, retry: 2 }`.

**Red** — `queryClient.test.ts`:
```ts
import { describe, expect, it } from 'vitest';
import { queryClient } from './queryClient';

describe('queryClient 기본 옵션', () => {
  it('gcTime이 영속 maxAge(24h) 이상이어야 한다', () => {
    expect(queryClient.getDefaultOptions().queries?.gcTime).toBe(1000 * 60 * 60 * 24);
  });
  it('staleTime은 30분', () => {
    expect(queryClient.getDefaultOptions().queries?.staleTime).toBe(1000 * 60 * 30);
  });
});
```
실행 → `gcTime` 미설정(undefined)·`staleTime`=300000 이므로 **실패**(예상 사유: 기존 값 5분/미설정).

**Green** — `queryClient.ts`의 `queries`에 `staleTime: 1000 * 60 * 30`, `gcTime: 1000 * 60 * 60 * 24` 설정. 재실행 → 통과.

### 태스크 1.3 — `queryPersister` 신규 (TDD)

- **파일**: `apps/mobile/src/shared/lib/queryPersister.ts`(신규), `apps/mobile/src/shared/lib/queryPersister.test.ts`(신규)
- **소비 계약**: `@tanstack/query-async-storage-persister`의 `createAsyncStoragePersister`, `@react-native-async-storage/async-storage`, `expo-constants`.
- **생산 계약**:
  ```ts
  export const PERSIST_MAX_AGE: number;          // 1000*60*60*24
  export const CACHE_BUSTER: string;             // `v1-${Constants.expoConfig?.version ?? '0'}`
  export const asyncStoragePersister: Persister;
  export const persistOptions: {
    persister: Persister;
    maxAge: number;
    buster: string;
    dehydrateOptions: { shouldDehydrateQuery: (q: { state: { status: string } }) => boolean };
  };
  ```
- **AsyncStorage mock**: `apps/mobile/src/__mocks__/async-storage.ts`(신규, getItem/setItem/removeItem stub) + `vitest.config.*` alias에 `@react-native-async-storage/async-storage` → mock 등록. `expo-constants`는 mock alias 추가(`apps/mobile/src/__mocks__/expo-constants.ts`, `{ expoConfig: { version: '1.0.5' } }`).

**Red** — `queryPersister.test.ts`:
```ts
import { describe, expect, it } from 'vitest';
import { persistOptions, PERSIST_MAX_AGE, CACHE_BUSTER } from './queryPersister';

describe('persistOptions', () => {
  it('maxAge는 24h', () => {
    expect(persistOptions.maxAge).toBe(1000 * 60 * 60 * 24);
    expect(PERSIST_MAX_AGE).toBe(1000 * 60 * 60 * 24);
  });
  it('buster는 앱 버전을 포함한다', () => {
    expect(CACHE_BUSTER).toContain('1.0.5');
  });
  it('success 쿼리만 영속한다 (FR-11)', () => {
    const f = persistOptions.dehydrateOptions.shouldDehydrateQuery;
    expect(f({ state: { status: 'success' } } as any)).toBe(true);
    expect(f({ state: { status: 'error' } } as any)).toBe(false);
    expect(f({ state: { status: 'pending' } } as any)).toBe(false);
  });
});
```
실행 → 모듈 부재로 **실패**.

**Green** — `queryPersister.ts` 구현(스펙 §5.2). `shouldDehydrateQuery = (q) => q.state.status === 'success'`. 재실행 → 통과.

### 태스크 1.4 — `_layout` Provider 교체 (커밋: `feat(mobile): 쿼리 캐시 AsyncStorage 영속화`)

- **파일**: `apps/mobile/app/_layout.tsx`(수정)
- **변경**: `QueryClientProvider` → `PersistQueryClientProvider`(`@tanstack/react-query-persist-client`), `persistOptions={persistOptions}` 전달. 그 외 트리(AuthProvider/Stack) 불변.
- **검증**: `tsc --noEmit` 통과 + 기존 테스트 그린. (Provider 동작은 디바이스 수동 회귀에서 확인 — 회귀 체크리스트 R-1)
- 1.2~1.4를 한 커밋으로 묶는다(인프라 일괄).

---

## 3. 단계 2 — P1 섹션 자족화 (각 섹션 독립 로딩)

> 공통: 각 섹션은 스펙 §5.5 상태 계약을 만족. pending 스켈레톤은 기존 `SkeletonBox`(`src/shared/ui/SkeletonBox.tsx`) 사용. 섹션 헤더는 즉시 노출.

### 태스크 2.1 — `HocanceTop5Section` pending 스켈레톤 (TDD)

- **파일**: `apps/mobile/src/features/home/components/HocanceTop5Section.tsx`(수정), `...HocanceTop5Section.test.tsx`(수정)
- 현재: stays/topSpots 쿼리 결과 `ranked.length === 0`이면 `return null` → pending 동안에도 아무것도 안 보임.
- **변경 계약**: 두 쿼리 중 하나라도 `isPending`이면 `testID="hocance-skeleton"` 스켈레톤 표시. 둘 다 settled이고 `ranked.length === 0`이면 `null`(FR-5). 데이터 있으면 기존 렌더.

**Red** — 테스트 추가: stays 쿼리 `isPending: true` 모킹 시 `getByTestId('hocance-skeleton')` 기대 → 현재 `null` 반환이라 **실패**.

**Green** — 컴포넌트에 `const isPending = staysQuery.isPending || topSpotsQuery.isPending;` 분기 추가(현 구조는 `data` 디스트럭처만 함 → `useQuery` 결과 객체로 변경). pending 시 스켈레톤 반환. 재실행 → 통과.

### 태스크 2.2 — `CurationSection` 추출 (TDD)

- **파일**: `apps/mobile/src/features/home/components/CurationSection.tsx`(신규), `...CurationSection.test.tsx`(신규)
- **생산 계약**: `export function CurationSection(): JSX.Element | null`. 내부에서 `useQuery({ queryKey: homeCurationKeys.active, queryFn: getActiveHomeCurationSlots, staleTime: 1000*60*30 })`.
  - `isPending` → `testID="curation-skeleton"` 스켈레톤(`SkeletonBox height={92}` 1개).
  - settled + 유효 슬롯(`title`·`ctaLabel` 비어있지 않음) 0개 → `null`(FR-5).
  - 유효 슬롯 있음 → `SeasonCurationSlot[]`(기존 `styles.curationSection` 래퍼 이관).
  - error → `console.error('[CurationSection] ...')` + `null`(FR-6).

**Red** — 테스트: curation 쿼리 `isPending` 모킹 → `curation-skeleton` 기대 → 모듈 부재로 **실패**. 이어서 success+빈배열 → `null`, success+유효슬롯 → `SeasonCurationSlot` 렌더 케이스 추가.

**Green** — 컴포넌트 구현(HomeScreen의 큐레이션 로직·필터·스타일 이관). 재실행 → 통과.

### 태스크 2.3 — `EndingSoonSection` 추출 (TDD)

- **파일**: `apps/mobile/src/features/home/components/EndingSoonSection.tsx`(신규), `...EndingSoonSection.test.tsx`(신규)
- **생산 계약**: `export function EndingSoonSection(): JSX.Element | null`. `useQuery({ queryKey: spotKeys.all, queryFn: getPublishedSpots })` + `useRouter`.
  - `isPending` → `testID="ending-soon-skeleton"` 스켈레톤(`SkeletonBox height={180}`).
  - settled → `endingSoonSpot` 선정 로직(HomeScreen의 `getCountdownValue` 정렬 이관). 대상 없으면 `null`(FR-5).
  - 데이터 있음 → 기존 이벤트 카드 렌더(`styles.eventCard` 등 이관). `router.push(/spot/{slug})`.

**Red** — 테스트: `isPending` → `ending-soon-skeleton`; success+spots 제공 → 첫 명소 place 텍스트 노출; success+빈 → `null`. 모듈 부재로 **실패**.

**Green** — 구현(`getCountdownValue` 헬퍼 동반 이관). 재실행 → 통과.

### 태스크 2.4 — `RegionRecommendSection` 추출 (TDD)

- **파일**: `apps/mobile/src/features/home/components/RegionRecommendSection.tsx`(신규), `...RegionRecommendSection.test.tsx`(신규)
- **생산 계약**: `export function RegionRecommendSection(): JSX.Element | null`. `useQuery({ queryKey: spotKeys.all, queryFn: getPublishedSpots })` + `useRouter`.
  - `isPending` → `testID="region-skeleton"` 스켈레톤(카드 그리드 모사).
  - settled → `deriveRegionSummaries(spots)`로 그리드 렌더. 결과 0개면 `null`.
  - 타일 탭 → `router.push({ pathname: '/(tabs)/search', params: { query } })`(기존 동일).
  - 섹션 헤더("지역별 추천")는 데이터와 무관하게 즉시 노출.

**Red** — 테스트: `isPending` → `region-skeleton`; success+요약 제공 → 타일 텍스트 노출. 모듈 부재로 **실패**.

**Green** — 구현(`deriveRegionSummaries`는 `spotRepository`의 기존 export 재사용, `styles.regionGrid` 등 이관). 재실행 → 통과.

- 커밋(2.1~2.4 묶음): `feat(mobile): 홈 섹션별 독립 로딩 처리(자족화)`

---

## 4. 단계 3 — P1 전체 게이트 제거

### 태스크 3.1 — `HomeScreen` 게이트 제거 + 섹션 합성 (TDD)

- **파일**: `apps/mobile/src/features/home/screens/HomeScreen.tsx`(수정), `...HomeScreen.test.tsx`(수정)
- **목표 형태**:
  ```tsx
  export function HomeScreen() {
    return (
      <ScreenShell>
        <CurationSection />
        <TopSpotsSection />
        <HocanceTop5Section />
        <EndingSoonSection />
        <NativeSpotAd />
        <RegionRecommendSection />
      </ScreenShell>
    );
  }
  ```
  `useHomeReady`/`ready` 분기/`HomeSkeleton`/직접 `useQuery`/파생 로직/이관된 styles 제거.

**Red** — `HomeScreen.test.tsx` 갱신: `vi.mock('../lib/useHomeReady')` 제거. 새 기대 — "spots 쿼리가 pending이어도 curation이 success면 큐레이션이 노출된다"(독립 렌더, FR-3). 현 코드(게이트)에서는 `home-skeleton`만 보이므로 **실패**.
  - 보조 케이스: 셸 헤더(`screen-shell-title-image`)는 모든 쿼리 pending에도 즉시 노출(FR-1).

**Green** — HomeScreen을 목표 형태로 축소. 섹션은 mock하거나 실제 컴포넌트+쿼리 mock으로 검증. 재실행 → 통과.

### 태스크 3.2 — 폐기 파일 삭제 (커밋: `refactor(mobile): 홈 통합 대기 게이트 제거`)

- **삭제**: `apps/mobile/src/features/home/lib/useHomeReady.ts`, `...useHomeReady.test.tsx`, `apps/mobile/src/features/home/components/HomeSkeleton.tsx`, `...HomeSkeleton.test.tsx`.
- **확인**: `grep -rn "useHomeReady\|HomeSkeleton" apps/mobile/src` 결과 0건(잔존 import 없음).
- 3.1~3.2를 한 커밋으로.

---

## 5. 단계 4 — 통합 검증 (커밋 없음)

1. `pnpm --filter mobile test` 전체 그린.
2. `pnpm --filter mobile exec tsc --noEmit` 통과.
3. 린트(`pnpm --filter mobile lint` 존재 시) 통과.
4. 수동 회귀 체크리스트(아래) 수행.

## 6. 테스트 전략

**자동 (신규/수정)**
- `queryClient.test.ts` — 기본 옵션(NFR-2, FR-9 전제).
- `queryPersister.test.ts` — maxAge/buster/shouldDehydrateQuery(FR-9·10·11).
- `HocanceTop5Section.test.tsx` — pending 스켈레톤(FR-4).
- `CurationSection.test.tsx`·`EndingSoonSection.test.tsx`·`RegionRecommendSection.test.tsx` — pending/빈/데이터(FR-3·4·5).
- `HomeScreen.test.tsx` — 셸 즉시 노출(FR-1)·섹션 독립 렌더(FR-2·3).
- 삭제: `useHomeReady.test.tsx`, `HomeSkeleton.test.tsx`.

**수동 회귀 (실기기/시뮬레이터)**
- **R-1 (FR-7·8)**: 앱 1회 실행→데이터 로드→앱 완전 종료→재실행 시 홈이 **네트워크 응답 전에** 직전 데이터로 즉시 표시되는지.
- **R-2 (FR-1·4)**: (캐시 클리어 후) 콜드 진입 시 셸·헤더 즉시 + 섹션별 스켈레톤→콘텐츠 순차 전환 확인.
- **R-3 (FR-9)**: 24h 경과(또는 임시 maxAge 축소) 후 캐시 미복원 확인.
- **R-4 (NFR-1)**: `apps/toss-mini`·`apps/web` 빌드/동작 무영향(코드 미수정 확인으로 갈음).

## 7. 위험 · 완화

| 위험 | 영향 | 완화 |
|---|---|---|
| persist 복원 지연으로 첫 프레임에 스켈레톤 깜빡임 | 경미 | 스펙 §8 허용. 복원 완료 시 즉시 전환. R-2로 체감 확인 |
| `gcTime` 상향으로 메모리 점유 증가 | 경미 | 홈 쿼리 데이터 소형(명소 리스트). 모니터링 |
| AsyncStorage 직렬화 실패/손상 캐시 | 중 | `buster`로 스키마 변경 시 폐기. persist-client는 손상 시 무시하고 신규 조회 |
| 섹션 추출 중 스타일/네비게이션 회귀 | 중 | 스타일·라우팅을 1:1 이관, 각 섹션 단위 테스트로 가드 |
| `EndingSoon`·`RegionRecommend` 중복 요청 우려 | 경미 | 동일 `spotKeys.all` 공유 → React Query 디둑(NFR-6). 테스트로 키 동일성 확인 |

## 8. 브랜치 · PR 전략

- 브랜치: `feat/mobile-home-progressive-loading` (main 기준).
- 커밋 단위(한국어):
  1. `chore(mobile): react-query persist 패키지 추가`
  2. `feat(mobile): 쿼리 캐시 AsyncStorage 영속화` (queryClient·persister·_layout)
  3. `feat(mobile): 홈 섹션별 독립 로딩 처리(자족화)`
  4. `refactor(mobile): 홈 통합 대기 게이트 제거` (HomeScreen·삭제)
- PR 생성은 `pr-review-process` 스킬(이중 코드리뷰)을 거친 뒤 지시자 승인 하에. base: `main`.

## 9. 완료 보고 항목 (스펙 ID 충족 매핑)

- FR-1 ScreenShell 즉시 노출 — `HomeScreen.test`(셸 헤더 즉시) ✔
- FR-2 게이트 부재 — `useHomeReady`/`HomeSkeleton` 삭제 + grep 0건 ✔
- FR-3 섹션 독립 렌더 — 섹션별 테스트 + HomeScreen 독립 렌더 테스트 ✔
- FR-4 섹션별 스켈레톤 — 각 섹션 pending 테스트 ✔
- FR-5 빈 상태 — 각 섹션 success+빈 → null 테스트 ✔
- FR-6 에러 상태 — 섹션 error → null + console.error ✔
- FR-7~11 영속 — `queryPersister.test` + `_layout` 교체 + R-1/R-3 수동 ✔
- NFR-1 앱 격리 — 변경 파일 전부 `apps/mobile/` ✔
- NFR-2 신선도 / NFR-4 무왕복 — staleTime/maxAge + R-1 ✔
- NFR-3 테스트 — 위 자동 테스트 ✔
- NFR-5 의존성 최소 — persist 2종만 추가 ✔
- NFR-6 중복 요청 없음 — 공유 키 테스트 ✔
