# 홈 로딩 스켈레톤 스펙

- 대상 앱: `apps/mobile` (Expo). `apps/web`·`apps/toss-mini`·공유 패키지와 무관.
- 관련 플랜: (작성 예정) `docs/plans/2026-06-05-home-loading-skeleton.md`

## 1. 개요

홈 화면(`HomeScreen`)이 첫 진입 시 보여주는 **로딩 표현**의 명세다. 홈은 서로 다른 시점에 끝나는 여러 데이터 쿼리에 의존하는데, 각 섹션이 개별적으로 로딩 상태를 노출하는 대신 **핵심 데이터가 모두 준비될 때까지 하나의 통합 스켈레톤을 보여주고, 준비되면 실제 홈을 한 번에 노출**한다.

핵심 책임은 세 단위로 나뉜다.

- **`useHomeReady`** — 홈에 필요한 핵심 쿼리들을 한곳에서 실행/관찰하고 "노출 준비됨(`ready`)" 여부를 판정한다.
- **`HomeSkeleton`** — 준비 전 화면을 채우는 통합 스켈레톤(차분한 단순 블록 레이아웃).
- **`SkeletonBox`** — 부드러운 펄스 애니메이션을 가진 공용 스켈레톤 프리미티브(홈 외 화면에서도 공용).

## 2. 기능 요구사항 (FR)

- **FR-1 (핵심 쿼리 일원화)** — `useHomeReady`는 홈의 핵심 데이터 4종을 섹션과 **동일한 쿼리 키/조회 함수/`staleTime`**으로 실행한다.
  | 데이터 | 쿼리 키 | 조회 함수 | staleTime |
  |---|---|---|---|
  | 명소 목록 | `spotKeys.all` | `getPublishedSpots` | (기본) |
  | 홈 큐레이션 | `homeCurationKeys.active` | `getActiveHomeCurationSlots` | 30분 |
  | 꽃 명소 TOP10 | `spotKeys.top(10)` | `getTopSpots(10)` | 30분 |
  | 호캉스 호텔 | `stayKeys.all` | `getPublishedStays` | (기본) |
  섹션 컴포넌트들이 같은 키를 재사용하므로 React Query 캐시가 공유되어, 준비 후 섹션은 자체 스켈레톤 없이 즉시 렌더된다.
- **FR-2 (준비 판정)** — `ready`는 4개 쿼리가 **모두 settled**일 때 `true`다. settled는 `status !== 'pending'`(성공 **또는 에러**)을 뜻한다. 일부 쿼리가 실패해도 게이트는 풀리며, 실패한 영역은 각 섹션의 빈/에러 상태가 처리한다.
- **FR-3 (안전 타임아웃)** — 쿼리가 모두 settled되지 않아도 `timeoutMs`(기본 `HOME_SKELETON_TIMEOUT_MS = 5000`) 경과 시 `ready`는 강제로 `true`가 된다. 느리거나 멈춘 쿼리에 사용자가 갇히지 않는다.
- **FR-4 (통합 노출)** — `ready === false`인 동안 `HomeScreen`은 실제 섹션(큐레이션·TOP10·호캉스·곧 끝나는 축제·지역별 추천·광고)을 렌더하지 않고 `HomeSkeleton`만 노출한다. `ready === true`가 되면 전체를 한 번에 노출한다.
- **FR-5 (캐시 적중 시 무플래시)** — 재방문 등으로 4개 쿼리가 이미 `success`(또는 settled)면 `ready`는 최초 렌더에서 즉시 `true`가 되어 스켈레톤이 깜빡이지 않는다.
- **FR-6 (스켈레톤 레이아웃)** — `HomeSkeleton`은 차분한 단순 블록 구성을 가진다: 히어로 블록 1 + 동일 너비 카드 3(가로 행) + 와이드 카드 2(세로 스택). 실제 섹션과 1:1 대응은 아니며, 정돈된 단일 면(面)으로 보이는 것이 목적이다.

## 3. 비기능 요구사항 (NFR)

- **NFR-1 (무신규 의존성)** — 펄스 애니메이션은 이미 설치된 `react-native-reanimated`로 구현한다. `expo-linear-gradient` 등 신규 의존성을 추가하지 않는다.
- **NFR-2 (테스트 안전성)** — `SkeletonBox`의 애니메이션은 순수 시각 효과이며, vitest + react-native mock 환경에서 **렌더를 깨지 않아야** 한다. 테스트 환경에서는 정적으로 렌더되어도 무방하다. 기존 `SkeletonBox` 사용 화면들의 테스트(특히 `getAllByTestId('skeleton-box')` 조회)는 변경 없이 통과해야 한다.
- **NFR-3 (섹션 비침습)** — 기존 섹션 컴포넌트의 props·내부 로직·테스트는 변경하지 않는다. `TopSpotsSection`의 내부 `isLoading` 분기는 유지되며(홈에서는 캐시 적중으로 실질 미발동), 타 진입 경로의 안전망으로 남는다.
- **NFR-4 (앱 격리)** — 모든 변경은 `apps/mobile/`에 국한된다.
- **NFR-5 (성능)** — `useHomeReady`가 추가로 실행하는 쿼리는 섹션과 키가 동일해 중복 네트워크 요청을 만들지 않는다(React Query 디둑/`staleTime` 적용).

## 4. 구조

### 4.1 합성 트리
```
HomeScreen
├─ useHomeReady()                      // 핵심 4쿼리 실행/관찰 + 타임아웃 → { ready }
├─ ready === false → ScreenShell
│                     └─ HomeSkeleton  // 히어로 + 카드3 + 와이드2 (SkeletonBox)
└─ ready === true  → ScreenShell
                      ├─ SeasonCurationSlot[]
                      ├─ TopSpotsSection        // 같은 키 재사용 → 캐시 적중
                      ├─ HocanceTop5Section     // 같은 키 재사용 → 캐시 적중
                      ├─ (곧 끝나는 축제 카드)
                      ├─ NativeSpotAd
                      └─ (지역별 추천 그리드)
```

### 4.2 데이터 흐름
```
useHomeReady ──fires──▶ [spots.all, curation.active, top(10), stays.all]
                              │ (React Query 캐시 적재)
   ready = 모든 쿼리 settled  OR  timeoutMs 경과
                              │
        ready=false ─▶ HomeSkeleton (펄스)
        ready=true  ─▶ 섹션들 ─ 동일 키 useQuery ─▶ 캐시 적중(즉시 렌더)
```

### 4.3 디렉터리
| 파일 | 종류 | 비고 |
|---|---|---|
| `src/shared/ui/SkeletonBox.tsx` | 수정 | 펄스 애니메이션 추가(공용 프리미티브) |
| `src/features/home/components/HomeSkeleton.tsx` | 신규 | 통합 스켈레톤 |
| `src/features/home/lib/useHomeReady.ts` | 신규 | 준비 판정 훅 |
| `src/features/home/screens/HomeScreen.tsx` | 수정 | 게이트 분기 추가 |

## 5. 구성 요소별 책임과 계약

### 5.1 `SkeletonBox` (공용 프리미티브, 수정)
```ts
type SkeletonBoxProps = {
  height: number;
  borderRadius?: number;   // 기본 16
  width?: string | number; // 기본 '100%'
  testID?: string;
};
export function SkeletonBox(props: SkeletonBoxProps): JSX.Element;
```
- 둥근 모서리의 플레이스홀더 블록을 렌더하며 **부드러운 펄스(opacity breathing)**로 로딩을 표현한다.
- props 시그니처·배경색(`#F2EDE6`)·`testID` 전달·외형 계약은 기존과 동일하게 유지한다(애니메이션만 가산).
- 애니메이션은 reanimated로 구현하되, 동작 불가 환경(테스트 등)에서는 정적 렌더로 graceful degrade한다(NFR-2).

### 5.2 `HomeSkeleton` (신규)
```ts
export function HomeSkeleton(): JSX.Element;
```
- props 없음. `SkeletonBox`들로 FR-6 레이아웃을 구성한다.
- 루트에 `testID="home-skeleton"`을 부여한다.
- `ScreenShell` 내부에 놓이는 것을 전제로 하며, 자체적으로 화면 패딩/스크롤을 관리하지 않는다.

### 5.3 `useHomeReady` (신규)
```ts
export const HOME_SKELETON_TIMEOUT_MS = 5000;

export function useHomeReady(options?: { timeoutMs?: number }): { ready: boolean };
```
- FR-1의 4개 쿼리를 동일 키/함수/`staleTime`으로 `useQuery` 실행한다.
- `ready` = (4개 쿼리 모두 `status !== 'pending'`) **또는** (`timeoutMs` 경과). 기본 `timeoutMs`는 `HOME_SKELETON_TIMEOUT_MS`.
- 타임아웃은 마운트 시 1회 설정하며, 언마운트 시 해제한다.

### 5.4 `HomeScreen` (수정)
- 최상단에서 `const { ready } = useHomeReady();`
- `ready === false`면 `<ScreenShell><HomeSkeleton /></ScreenShell>` 반환.
- `ready === true`면 기존 렌더(섹션들)를 유지한다. 기존의 `spotKeys.all`·`homeCurationKeys.active` 조회는 그대로 두며(데이터 사용), `useHomeReady`의 관찰과 캐시를 공유한다.

## 6. 타입 정의
```ts
type SkeletonBoxProps = {
  height: number;
  borderRadius?: number;
  width?: string | number;
  testID?: string;
};

type UseHomeReadyOptions = { timeoutMs?: number };
type UseHomeReadyResult = { ready: boolean };
```

## 7. 외부 의존성
- **React Query** (`@tanstack/react-query`) — 쿼리 실행/캐시/상태.
- **react-native-reanimated** (설치본 4.2.x) — 펄스 애니메이션.
- 데이터 조회 함수·쿼리 키: `spotRepository`(`getPublishedSpots`, `getTopSpots`, `spotKeys`), `homeCurationRepository`(`getActiveHomeCurationSlots`, `homeCurationKeys`), `stayRepository`(`getPublishedStays`, `stayKeys`).

## 8. 명시적 가정
- 위 조회 함수·쿼리 키는 현행 그대로 존재하며, 섹션들이 이미 동일 키를 사용한다(캐시 공유 전제).
- React Query v5의 `status`/`isPending` 의미(`pending`=최초 응답 전, 에러 시 `pending` 해제)를 따른다.
- reanimated 애니메이션은 실제 디바이스/시뮬레이터에서 동작하며, 테스트 mock 환경에서는 정적으로 보일 수 있다(허용).
