# 홈 로딩 스켈레톤 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

- 관련 스펙: `docs/specs/2026-06-05-home-loading-skeleton-spec.md`
- 대상 앱: `apps/mobile` (Expo). `apps/web`·`apps/toss-mini`·공유 패키지와 무관.

**Goal:** 홈 화면(`HomeScreen`)의 흩어진 섹션별 로딩 표시를 제거하고, 핵심 데이터가 모두 준비될 때까지 단일 통합 스켈레톤을 보여준 뒤 실제 홈을 한 번에 노출한다.

**Architecture:** `useHomeReady` 훅이 홈 핵심 4개 쿼리를 섹션과 동일한 키로 관찰해 "모두 settled OR 타임아웃" 게이트를 만든다. 게이트가 열리기 전에는 `HomeSkeleton`만, 열린 후에는 기존 섹션을 그대로 렌더한다. 섹션들은 같은 쿼리 키를 재사용하므로 React Query 캐시가 공유되어 게이트 통과 직후 자체 스켈레톤 없이 즉시 렌더된다.

**Tech Stack:** React Native (Expo SDK 55), React Query v5(`@tanstack/react-query`), `react-native-reanimated` 4.2.x(펄스 애니메이션), Vitest 3 + jsdom(테스트).

---

## 운용 규칙 (실행자 필독)

- **커밋/푸시 정책**: 전역 규칙상 커밋·푸시는 **지시자가 요청할 때만** 수행한다. 아래 각 Task의 "Commit" 단계는 **권장 분할 단위**일 뿐이며, 실제 커밋 시점·묶음은 지시자 승인에 따른다. 푸시·PR은 별도 승인 후 진행한다.
- **앱 격리(NFR-4)**: 모든 변경은 `apps/mobile/` 내부에 국한한다. 다른 앱·공유 패키지를 건드리지 않는다.
- **명령 실행 위치**: 모든 명령은 `apps/mobile/`에서 실행한다.
- **타입체크 명령**: `npx tsc`는 플레이스홀더로 동작하므로 반드시 `./node_modules/.bin/tsc --noEmit` 를 쓴다.
- **단위 테스트 명령**: 전체는 `pnpm test`(= `vitest run`), 단일 파일은 `npx vitest run <경로>`.

---

## File Structure

| 파일 | 종류 | 책임 |
|---|---|---|
| `src/__mocks__/react-native-reanimated.ts` | 신규(테스트) | 테스트 환경용 reanimated mock(정적 graceful degrade) |
| `vitest.config.ts` | 수정 | `react-native-reanimated` alias 등록 |
| `src/shared/ui/SkeletonBox.tsx` | 수정 | 공용 프리미티브에 펄스 애니메이션 추가 |
| `src/shared/ui/SkeletonBox.test.tsx` | 신규 | SkeletonBox 렌더/testID/graceful degrade 검증 |
| `src/features/home/lib/useHomeReady.ts` | 신규 | 핵심 4쿼리 관찰 + 준비 판정 훅 |
| `src/features/home/lib/useHomeReady.test.tsx` | 신규 | settled/타임아웃 판정 검증 |
| `src/features/home/components/HomeSkeleton.tsx` | 신규 | 통합 스켈레톤 레이아웃 |
| `src/features/home/components/HomeSkeleton.test.tsx` | 신규 | 통합 스켈레톤 렌더 검증 |
| `src/features/home/screens/HomeScreen.tsx` | 수정 | 게이트 분기 추가 |
| `src/features/home/screens/HomeScreen.test.tsx` | 수정 | 게이트 동작 테스트 추가(기존 테스트 보존) |

---

## Task 0: 베이스라인 확보 & 브랜치 분리

**Files:** (코드 변경 없음)

- [ ] **Step 1: 격리 브랜치 생성 (W2 작업과 분리)**

현재 작업 트리는 보류 중인 W2 브랜치(`feat/stays-hide-booking-query-label`) 위에 있고, 스펙 문서 2개가 **untracked** 상태로 남아 있다. untracked 파일은 브랜치 전환 시 따라오므로, `main`에서 새 브랜치를 파면 스펙 문서가 그대로 새 브랜치로 옮겨진다.

```bash
cd /Users/user/workspace/flower-map
git stash list   # 비어 있어야 함(예상)
git checkout main
git pull --ff-only         # 원격 최신 반영(네트워크 가능 시)
git checkout -b feat/home-loading-skeleton
git status --short         # docs/specs/2026-06-05-home-loading-skeleton-spec.{md,html} 가 ?? 로 보이면 정상
```

Expected: 새 브랜치 `feat/home-loading-skeleton`, 스펙 `.md`/`.html` 가 untracked로 따라옴.

- [ ] **Step 2: 단위 테스트 베이스라인 기록**

```bash
cd /Users/user/workspace/flower-map/apps/mobile
pnpm test 2>&1 | tail -20
```

Expected: 전체 PASS. 출력의 통과 파일/테스트 수를 메모해 둔다(작업 후 회귀 비교용).

- [ ] **Step 3: tsc 베이스라인 기록**

```bash
cd /Users/user/workspace/flower-map/apps/mobile
./node_modules/.bin/tsc --noEmit 2>&1 | grep -c "error TS"
./node_modules/.bin/tsc --noEmit 2>&1 | grep "error TS" | cut -d'(' -f1 | sort -u
```

Expected: 사전 존재 에러 개수(약 31개)와 **에러가 발생하는 파일 목록**을 기록한다. 이번 작업이 만질 파일들(`SkeletonBox.tsx`, `useHomeReady.ts`, `HomeSkeleton.tsx`, `HomeScreen.tsx`)은 이 목록에 **없어야** 한다. 작업 종료 시 이 개수/목록이 늘지 않았는지로 회귀를 판정한다.

- [ ] **Step 4: reanimated 툴체인 확인(런타임 위험 점검)**

```bash
cd /Users/user/workspace/flower-map/apps/mobile
grep -n "react-native-reanimated\|react-native-worklets" package.json
ls babel.config.js 2>/dev/null || echo "no babel.config.js (Expo 기본 preset 사용)"
```

Expected: `react-native-reanimated@4.2.1`, `react-native-worklets@0.7.2` 설치 확인. `babel.config.js`가 없으면 Expo SDK 55의 `babel-preset-expo` 기본 프리셋이 worklets 플러그인을 자동 적용한다는 전제다. **주의**: reanimated 워크릿 애니메이션은 단위 테스트로 검증 불가하므로, Task 6의 디바이스/시뮬레이터 스모크 체크에서 펄스 동작과 크래시 여부를 반드시 확인한다.

---

## Task 1: reanimated 테스트 mock + vitest alias

**Files:**
- Create: `apps/mobile/src/__mocks__/react-native-reanimated.ts`
- Modify: `apps/mobile/vitest.config.ts` (alias 객체에 1줄 추가)

> 목적: `SkeletonBox`가 곧 `react-native-reanimated`를 import 하게 되는데, 현재 vitest는 이 패키지 alias가 없어 실제 네이티브 패키지를 로드하려다 깨진다. 정적 graceful degrade mock을 추가해 NFR-2(테스트 안전성)를 보장한다. 이 Task는 테스트만 다루므로 앱 런타임에 영향이 없다.

- [ ] **Step 1: reanimated mock 작성**

Create `apps/mobile/src/__mocks__/react-native-reanimated.ts`:

```ts
// react-native-reanimated mock for vitest (jsdom environment)
// 실제 워크릿/애니메이션 없이 정적으로 렌더되도록 graceful degrade 한다(NFR-2).
import React from 'react';

export const Easing = {
  linear: (t: number) => t,
  ease: (t: number) => t,
  in: (fn: (t: number) => number) => fn,
  out: (fn: (t: number) => number) => fn,
  inOut: (fn: (t: number) => number) => fn,
};

export function useSharedValue<T>(initial: T): { value: T } {
  return { value: initial };
}

export function useAnimatedStyle<T extends object>(factory: () => T): T {
  try {
    return factory();
  } catch {
    return {} as T;
  }
}

export function withTiming<T>(toValue: T): T {
  return toValue;
}

export function withRepeat<T>(value: T): T {
  return value;
}

export function withSequence<T>(...values: T[]): T {
  return values[values.length - 1];
}

function createAnimatedComponent(tag: string) {
  const Component = React.forwardRef(
    (
      { children, testID, style: _style, ...props }: Record<string, unknown>,
      ref: React.Ref<unknown>,
    ) => React.createElement(tag, { ref, 'data-testid': testID, ...props }, children),
  );
  Component.displayName = `Animated.${tag}`;
  return Component;
}

const Animated = {
  View: createAnimatedComponent('view'),
  Text: createAnimatedComponent('text'),
  Image: createAnimatedComponent('image'),
  ScrollView: createAnimatedComponent('scrollview'),
  createAnimatedComponent: (C: React.ComponentType) => C,
};

export default Animated;
```

- [ ] **Step 2: vitest alias 등록**

Modify `apps/mobile/vitest.config.ts` — `alias` 객체 안, 기존 `'react-native'` 줄 **바로 아래**에 추가:

```ts
      'react-native': new URL('./src/__mocks__/react-native.ts', import.meta.url).pathname,
      'react-native-reanimated': new URL(
        './src/__mocks__/react-native-reanimated.ts',
        import.meta.url,
      ).pathname,
```

- [ ] **Step 3: 기존 테스트 회귀 없음 확인**

```bash
cd /Users/user/workspace/flower-map/apps/mobile
pnpm test 2>&1 | tail -15
```

Expected: Task 0과 동일하게 전체 PASS(아직 reanimated를 import하는 소스가 없으므로 변화 없음).

- [ ] **Step 4: Commit (권장 단위)**

```bash
cd /Users/user/workspace/flower-map
git add apps/mobile/src/__mocks__/react-native-reanimated.ts apps/mobile/vitest.config.ts
git commit -m "test: reanimated 테스트 mock 및 vitest alias 추가"
```

---

## Task 2: SkeletonBox 펄스 애니메이션 (공용 프리미티브)

**Files:**
- Modify: `apps/mobile/src/shared/ui/SkeletonBox.tsx`
- Test: `apps/mobile/src/shared/ui/SkeletonBox.test.tsx` (신규)

> 계약 보존(스펙 5.1): props 시그니처·배경색 `#F2EDE6`·`testID` 전달·외형은 그대로 두고 **펄스(opacity breathing)만 가산**한다. 기존 사용처 8곳(`TopSpotsSection`, `SearchScreen`, `SpotListScreen`, `MapScreen`, `StayListScreen`, `StayDetailScreen`, `SpotDetailScreen`, `NativeSpotAd.native`)과 그 테스트(`getAllByTestId('top-spots-skeleton')`, `getAllByTestId('skeleton-box')`)는 변경 없이 통과해야 한다(NFR-2/NFR-3).

- [ ] **Step 1: 실패하는 테스트 작성**

Create `apps/mobile/src/shared/ui/SkeletonBox.test.tsx`:

```tsx
import { describe, expect, it } from 'vitest';
import { render } from '@testing-library/react-native';

import { SkeletonBox } from './SkeletonBox';

describe('SkeletonBox', () => {
  it('전달한 testID로 렌더된다', () => {
    const { getByTestId } = render(<SkeletonBox testID="skeleton-box" height={40} />);
    expect(getByTestId('skeleton-box')).toBeTruthy();
  });

  it('testID 없이도 깨지지 않고 렌더된다(애니메이션 graceful degrade)', () => {
    // render().container 는 실제 @testing-library/react-native 타입에 없어 tsc 에러(TS2339)를
    // 유발한다(vitest alias는 런타임 mock만 바꾸고 tsc 타입엔 영향 없음). 따라서 no-throw로 검증한다.
    expect(() => render(<SkeletonBox height={40} />)).not.toThrow();
  });
});
```

> **주의(실행 중 발견)**: 두 번째 테스트는 원래 `container.querySelector('view')`로 작성했으나, tsc는 vitest alias가 아닌 **실제 `@testing-library/react-native` 타입**으로 검사하며 해당 타입에는 `container`가 없어 `SkeletonBox.test.tsx`가 tsc 에러 목록에 새로 등장(31→32)한다. 렌더 산출물 확인은 위 `testID` 케이스(`getByTestId`)가 담당하므로, 두 번째 테스트는 "no-throw"(크래시 없음)로 충분하다. 이로써 tsc 베이스라인 31을 유지한다.

- [ ] **Step 2: 테스트 실행 → 통과(또는 의도된 실패) 확인**

```bash
cd /Users/user/workspace/flower-map/apps/mobile
npx vitest run src/shared/ui/SkeletonBox.test.tsx
```

Expected: 현재 `SkeletonBox`는 RN `View`를 쓰므로 `view` 태그는 이미 존재해 PASS할 수 있다. 이 테스트는 **다음 단계(Animated.View 전환) 후에도 동일하게 통과**해야 하는 회귀 가드 역할이다. (Red가 필요 없는 보존성 테스트)

- [ ] **Step 3: SkeletonBox에 펄스 애니메이션 구현**

Overwrite `apps/mobile/src/shared/ui/SkeletonBox.tsx`:

```tsx
import { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

type SkeletonBoxProps = {
  height: number;
  borderRadius?: number;
  width?: string | number;
  testID?: string;
};

export function SkeletonBox({ height, borderRadius = 16, width = '100%', testID }: SkeletonBoxProps) {
  const opacity = useSharedValue(1);

  useEffect(() => {
    opacity.value = withRepeat(
      withTiming(0.45, { duration: 800, easing: Easing.inOut(Easing.ease) }),
      -1,
      true,
    );
  }, [opacity]);

  const animatedStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return (
    <Animated.View
      testID={testID}
      style={[styles.base, { height, borderRadius, width: width as any }, animatedStyle]}
    />
  );
}

const styles = StyleSheet.create({
  base: {
    backgroundColor: '#F2EDE6',
    marginBottom: 12,
  },
});
```

- [ ] **Step 4: SkeletonBox 테스트 통과 확인**

```bash
cd /Users/user/workspace/flower-map/apps/mobile
npx vitest run src/shared/ui/SkeletonBox.test.tsx
```

Expected: 2 tests PASS.

- [ ] **Step 5: 기존 사용처 테스트 회귀 없음 확인(NFR-2/NFR-3 핵심)**

```bash
cd /Users/user/workspace/flower-map/apps/mobile
npx vitest run src/features/home/components/TopSpotsSection.test.tsx src/features/search/screens/SearchScreen.test.tsx
```

Expected: 모두 PASS. 특히 `getAllByTestId('top-spots-skeleton')`·`getAllByTestId('skeleton-box')`가 여전히 1개 이상 잡혀야 한다.

- [ ] **Step 6: Commit (권장 단위)**

```bash
cd /Users/user/workspace/flower-map
git add apps/mobile/src/shared/ui/SkeletonBox.tsx apps/mobile/src/shared/ui/SkeletonBox.test.tsx
git commit -m "feat: 공용 SkeletonBox에 펄스 애니메이션 추가"
```

---

## Task 3: useHomeReady 준비 판정 훅

**Files:**
- Create: `apps/mobile/src/features/home/lib/useHomeReady.ts`
- Test: `apps/mobile/src/features/home/lib/useHomeReady.test.tsx` (신규)

> 스펙 5.3/FR-1·FR-2·FR-3·FR-5. 핵심 4쿼리를 섹션과 **동일 키/함수/staleTime**으로 `useQuery` 실행하고, "4개 모두 `status !== 'pending'`(= settled) **또는** `timeoutMs` 경과" 면 `ready=true`.
> 테스트 파일은 반드시 `.test.tsx` 확장자(= jsdom 환경, `renderHook`이 DOM 필요).

- [ ] **Step 1: 실패하는 테스트 작성**

Create `apps/mobile/src/features/home/lib/useHomeReady.test.tsx`:

```tsx
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { act } from 'react';
import { renderHook } from '@testing-library/react-native';

vi.mock('@tanstack/react-query', () => ({ useQuery: vi.fn() }));
vi.mock('../../../shared/data/spotRepository', () => ({
  spotKeys: { all: ['spots'], top: (n: number) => ['spots', 'top', n] },
  getPublishedSpots: vi.fn(),
  getTopSpots: vi.fn(),
}));
vi.mock('../../../shared/data/homeCurationRepository', () => ({
  homeCurationKeys: { active: ['homeCuration', 'active'] },
  getActiveHomeCurationSlots: vi.fn(),
}));
vi.mock('../../../shared/data/stayRepository', () => ({
  stayKeys: { all: ['stays'] },
  getPublishedStays: vi.fn(),
}));

import { useQuery } from '@tanstack/react-query';
import { useHomeReady, HOME_SKELETON_TIMEOUT_MS } from './useHomeReady';

const queryMock = useQuery as unknown as ReturnType<typeof vi.fn>;

// queryKey(JSON 문자열) → status 매핑. 미지정 키는 fallback 상태를 쓴다.
// 호출 순서에 의존하지 않으므로 리렌더에도 안전하다.
function mockStatuses(map: Record<string, string>, fallback = 'success') {
  queryMock.mockImplementation((opts: any) => ({
    status: map[JSON.stringify(opts.queryKey)] ?? fallback,
  }));
}

describe('useHomeReady', () => {
  beforeEach(() => {
    queryMock.mockReset();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('모든 쿼리가 pending이면 ready=false', () => {
    mockStatuses({}, 'pending');
    const { result } = renderHook(() => useHomeReady());
    expect(result.current.ready).toBe(false);
  });

  it('모든 쿼리가 success면 첫 렌더에서 ready=true (캐시 적중 무플래시 · FR-5)', () => {
    mockStatuses({}, 'success');
    const { result } = renderHook(() => useHomeReady());
    expect(result.current.ready).toBe(true);
  });

  it('일부 쿼리가 error여도 모두 settled면 ready=true (FR-2)', () => {
    mockStatuses({ '["stays"]': 'error' }, 'success');
    const { result } = renderHook(() => useHomeReady());
    expect(result.current.ready).toBe(true);
  });

  it('하나라도 pending이면 ready=false', () => {
    mockStatuses({ '["spots","top",10]': 'pending' }, 'success');
    const { result } = renderHook(() => useHomeReady());
    expect(result.current.ready).toBe(false);
  });

  it('타임아웃 경과 시 pending이어도 ready=true로 강제된다 (FR-3)', () => {
    vi.useFakeTimers();
    mockStatuses({}, 'pending');
    const { result } = renderHook(() => useHomeReady({ timeoutMs: HOME_SKELETON_TIMEOUT_MS }));
    expect(result.current.ready).toBe(false);
    act(() => {
      vi.advanceTimersByTime(HOME_SKELETON_TIMEOUT_MS);
    });
    expect(result.current.ready).toBe(true);
  });
});
```

- [ ] **Step 2: 테스트 실행 → 실패 확인**

```bash
cd /Users/user/workspace/flower-map/apps/mobile
npx vitest run src/features/home/lib/useHomeReady.test.tsx
```

Expected: FAIL — `useHomeReady`/`HOME_SKELETON_TIMEOUT_MS` 모듈이 없어 import 에러.

- [ ] **Step 3: useHomeReady 구현**

Create `apps/mobile/src/features/home/lib/useHomeReady.ts`:

```ts
import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';

import {
  getActiveHomeCurationSlots,
  homeCurationKeys,
} from '../../../shared/data/homeCurationRepository';
import { getPublishedSpots, getTopSpots, spotKeys } from '../../../shared/data/spotRepository';
import { getPublishedStays, stayKeys } from '../../../shared/data/stayRepository';

export const HOME_SKELETON_TIMEOUT_MS = 5000;

const HOME_STATIC_STALE_MS = 1000 * 60 * 30;
const TOP_COUNT = 10;

type UseHomeReadyOptions = { timeoutMs?: number };
type UseHomeReadyResult = { ready: boolean };

/**
 * 홈 핵심 4개 쿼리를 섹션과 동일 키/함수/staleTime으로 관찰해 "노출 준비됨" 여부를 판정한다.
 * ready = (4개 쿼리 모두 settled) OR (timeoutMs 경과). settled = status !== 'pending'(성공 또는 에러).
 * 섹션들이 같은 키를 재사용하므로 캐시가 공유되어 중복 요청이 없고, 준비 후 섹션은 즉시 렌더된다.
 */
export function useHomeReady(options?: UseHomeReadyOptions): UseHomeReadyResult {
  const timeoutMs = options?.timeoutMs ?? HOME_SKELETON_TIMEOUT_MS;

  const spots = useQuery({ queryKey: spotKeys.all, queryFn: getPublishedSpots });
  const curation = useQuery({
    queryKey: homeCurationKeys.active,
    queryFn: getActiveHomeCurationSlots,
    staleTime: HOME_STATIC_STALE_MS,
  });
  const topSpots = useQuery({
    queryKey: spotKeys.top(TOP_COUNT),
    queryFn: () => getTopSpots(TOP_COUNT),
    staleTime: HOME_STATIC_STALE_MS,
  });
  const stays = useQuery({ queryKey: stayKeys.all, queryFn: getPublishedStays });

  const allSettled = [spots, curation, topSpots, stays].every((q) => q.status !== 'pending');

  const [timedOut, setTimedOut] = useState(false);
  useEffect(() => {
    const id = setTimeout(() => setTimedOut(true), timeoutMs);
    return () => clearTimeout(id);
  }, [timeoutMs]);

  return { ready: allSettled || timedOut };
}
```

- [ ] **Step 4: 테스트 통과 확인**

```bash
cd /Users/user/workspace/flower-map/apps/mobile
npx vitest run src/features/home/lib/useHomeReady.test.tsx
```

Expected: 5 tests PASS.

- [ ] **Step 5: Commit (권장 단위)**

```bash
cd /Users/user/workspace/flower-map
git add apps/mobile/src/features/home/lib/useHomeReady.ts apps/mobile/src/features/home/lib/useHomeReady.test.tsx
git commit -m "feat: 홈 준비 판정 훅 useHomeReady 추가"
```

---

## Task 4: HomeSkeleton 통합 스켈레톤

**Files:**
- Create: `apps/mobile/src/features/home/components/HomeSkeleton.tsx`
- Test: `apps/mobile/src/features/home/components/HomeSkeleton.test.tsx` (신규)

> 스펙 5.2/FR-6. props 없음, 루트 `testID="home-skeleton"`. 레이아웃 = 히어로 블록 1 + 동일 너비 카드 3(가로 행) + 와이드 카드 2(세로 스택). `ScreenShell` 내부에 놓이는 전제이므로 자체 패딩/스크롤은 두지 않는다.

- [ ] **Step 1: 실패하는 테스트 작성**

Create `apps/mobile/src/features/home/components/HomeSkeleton.test.tsx`:

```tsx
import { describe, expect, it } from 'vitest';
import { render } from '@testing-library/react-native';

import { HomeSkeleton } from './HomeSkeleton';

describe('HomeSkeleton', () => {
  it('home-skeleton 루트와 가로 카드 3개를 렌더한다', () => {
    const { getByTestId, getAllByTestId } = render(<HomeSkeleton />);
    expect(getByTestId('home-skeleton')).toBeTruthy();
    expect(getAllByTestId('home-skeleton-card').length).toBe(3);
  });
});
```

- [ ] **Step 2: 테스트 실행 → 실패 확인**

```bash
cd /Users/user/workspace/flower-map/apps/mobile
npx vitest run src/features/home/components/HomeSkeleton.test.tsx
```

Expected: FAIL — `HomeSkeleton` 모듈 없음.

- [ ] **Step 3: HomeSkeleton 구현**

Create `apps/mobile/src/features/home/components/HomeSkeleton.tsx`:

```tsx
import { StyleSheet, View } from 'react-native';

import { SkeletonBox } from '../../../shared/ui/SkeletonBox';

export function HomeSkeleton() {
  return (
    <View testID="home-skeleton" style={styles.container}>
      <SkeletonBox height={150} borderRadius={20} />
      <View style={styles.row}>
        <SkeletonBox testID="home-skeleton-card" height={78} borderRadius={16} width="31%" />
        <SkeletonBox testID="home-skeleton-card" height={78} borderRadius={16} width="31%" />
        <SkeletonBox testID="home-skeleton-card" height={78} borderRadius={16} width="31%" />
      </View>
      <SkeletonBox height={92} borderRadius={18} />
      <SkeletonBox height={92} borderRadius={18} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 16,
  },
  row: {
    flexDirection: 'row',
    gap: 10,
  },
});
```

- [ ] **Step 4: 테스트 통과 확인**

```bash
cd /Users/user/workspace/flower-map/apps/mobile
npx vitest run src/features/home/components/HomeSkeleton.test.tsx
```

Expected: 1 test PASS.

- [ ] **Step 5: Commit (권장 단위)**

```bash
cd /Users/user/workspace/flower-map
git add apps/mobile/src/features/home/components/HomeSkeleton.tsx apps/mobile/src/features/home/components/HomeSkeleton.test.tsx
git commit -m "feat: 홈 통합 스켈레톤 HomeSkeleton 추가"
```

---

## Task 5: HomeScreen 게이트 통합

**Files:**
- Modify: `apps/mobile/src/features/home/screens/HomeScreen.tsx`
- Test: `apps/mobile/src/features/home/screens/HomeScreen.test.tsx` (수정)

> 스펙 5.4/FR-4. 최상단에서 `useHomeReady()` 호출 → `ready === false`면 `<ScreenShell><HomeSkeleton /></ScreenShell>`만, `ready === true`면 기존 섹션 전체를 렌더. **Rules of Hooks 준수**: 모든 훅(`useHomeReady`, 기존 2×`useQuery`, 2×`useMemo`)은 조건 없이 매 렌더 호출되고, 스켈레톤 early return은 모든 훅 호출 **이후**에 둔다.

- [ ] **Step 1: 실패하는 테스트 작성(게이트 동작 + 기존 테스트 보존)**

Modify `apps/mobile/src/features/home/screens/HomeScreen.test.tsx`.

(1) `vitest` import에 `beforeEach` 추가:

```tsx
import { describe, expect, it, vi, beforeEach } from 'vitest';
```

(2) 기존 `vi.mock('../../../shared/data/homeCurationRepository', ...)` 블록 **바로 아래**에 useHomeReady mock + 핸들 추가:

```tsx
vi.mock('../lib/useHomeReady', () => ({
  useHomeReady: vi.fn(() => ({ ready: true })),
}));

import { useHomeReady } from '../lib/useHomeReady';
const readyMock = useHomeReady as unknown as ReturnType<typeof vi.fn>;
```

(3) `describe('HomeScreen', () => {` 바로 다음 줄에 기본값 리셋 추가(기존 3개 테스트가 `ready=true` 전제로 동작하도록):

```tsx
  beforeEach(() => {
    readyMock.mockReturnValue({ ready: true });
  });
```

(4) `describe` 블록 맨 끝(닫는 `});` 직전)에 게이트 테스트 2개 추가:

```tsx
  it('ready=false면 통합 스켈레톤만 노출하고 섹션은 렌더하지 않는다', async () => {
    readyMock.mockReturnValue({ ready: false });
    const { getByTestId, queryByTestId } = render(wrap(<HomeScreen />));
    await act(async () => { await new Promise((r) => setTimeout(r, 0)); });
    expect(getByTestId('home-skeleton')).toBeTruthy();
    expect(queryByTestId('top-spots-section')).toBeNull();
  });

  it('ready=true면 스켈레톤 대신 섹션을 노출한다', async () => {
    readyMock.mockReturnValue({ ready: true });
    const { getByTestId, queryByTestId } = render(wrap(<HomeScreen />));
    await act(async () => { await new Promise((r) => setTimeout(r, 0)); });
    expect(getByTestId('top-spots-section')).toBeTruthy();
    expect(queryByTestId('home-skeleton')).toBeNull();
  });
```

- [ ] **Step 2: 테스트 실행 → 실패 확인**

```bash
cd /Users/user/workspace/flower-map/apps/mobile
npx vitest run src/features/home/screens/HomeScreen.test.tsx
```

Expected: 새 게이트 테스트 FAIL — `HomeScreen`이 아직 `useHomeReady`/`HomeSkeleton`을 쓰지 않아 `home-skeleton`이 없고, `ready=false`에서도 `top-spots-section`이 렌더됨.

- [ ] **Step 3: HomeScreen에 게이트 분기 구현**

Modify `apps/mobile/src/features/home/screens/HomeScreen.tsx`.

(1) import 블록에 2줄 추가(기존 `HocanceTop5Section` import 아래):

```tsx
import { HocanceTop5Section } from '../components/HocanceTop5Section';
import { HomeSkeleton } from '../components/HomeSkeleton';
import { useHomeReady } from '../lib/useHomeReady';
```

(2) `const router = useRouter();` 바로 아래에 게이트 훅 호출 추가:

```tsx
  const router = useRouter();
  const { ready } = useHomeReady();
```

(3) `endingSoonSpot` useMemo 블록과 기존 `return (` 사이에 스켈레톤 early return 추가(모든 훅 호출 이후 위치):

```tsx
    [featuredSpots],
  );

  if (!ready) {
    return (
      <ScreenShell>
        <HomeSkeleton />
      </ScreenShell>
    );
  }

  return (
    <ScreenShell>
      {curationSlots.length > 0 ? (
```

- [ ] **Step 4: 테스트 통과 확인(게이트 + 기존 3개)**

```bash
cd /Users/user/workspace/flower-map/apps/mobile
npx vitest run src/features/home/screens/HomeScreen.test.tsx
```

Expected: 5 tests PASS(기존 3 + 게이트 2).

- [ ] **Step 5: Commit (권장 단위)**

```bash
cd /Users/user/workspace/flower-map
git add apps/mobile/src/features/home/screens/HomeScreen.tsx apps/mobile/src/features/home/screens/HomeScreen.test.tsx
git commit -m "feat: 홈 화면에 통합 스켈레톤 게이트 적용"
```

---

## Task 6: 통합 검증 & 스모크 체크

**Files:** (코드 변경 없음 — 회귀 검증 및 수동 확인)

- [ ] **Step 1: 전체 단위 테스트**

```bash
cd /Users/user/workspace/flower-map/apps/mobile
pnpm test 2>&1 | tail -20
```

Expected: 전체 PASS. Task 0 베이스라인 대비 테스트 수가 신규 테스트(SkeletonBox 2 + useHomeReady 5 + HomeSkeleton 1 + HomeScreen 게이트 2)만큼 늘고, 기존 테스트는 모두 유지.

- [ ] **Step 2: tsc 회귀 없음 확인**

```bash
cd /Users/user/workspace/flower-map/apps/mobile
./node_modules/.bin/tsc --noEmit 2>&1 | grep -c "error TS"
```

Expected: Task 0에서 기록한 베이스라인 개수와 **동일**. 신규/수정 파일(`SkeletonBox.tsx`, `useHomeReady.ts`, `HomeSkeleton.tsx`, `HomeScreen.tsx`, `react-native-reanimated.ts`)이 에러 목록에 새로 등장하지 않아야 한다.

- [ ] **Step 3: 디바이스/시뮬레이터 스모크 체크(수동 — 워크릿 애니메이션 검증)**

```bash
cd /Users/user/workspace/flower-map/apps/mobile
pnpm expo start   # iOS 시뮬레이터/실기기에서 앱 실행
```

확인 항목:
- 콜드 로드 시 **통합 스켈레톤(히어로 1 + 카드 3 + 와이드 2)** 이 흩어짐 없이 한 면으로 보이고 **부드러운 펄스**가 동작하는가 (reanimated 워크릿 크래시 없음 — Task 0 Step 4 위험 점검).
- 데이터가 준비되면 스켈레톤이 사라지고 **섹션 전체가 한 번에** 노출되는가(섹션별 개별 스켈레톤 깜빡임이 없는가).
- 재방문(탭 이동 후 복귀 등 캐시 적중) 시 스켈레톤이 **깜빡이지 않는가**(FR-5).
- 느린 네트워크(예: 시뮬레이터 throttle)에서도 5초 후 스켈레톤이 풀리는가(FR-3).

> 만약 Step 3에서 reanimated 워크릿 관련 런타임 크래시가 발생하면, 이는 babel/worklets 툴체인 미구성 신호다. 그 경우 즉시 작업을 멈추고 지시자에게 에스컬레이션한다(스펙 NFR-1의 reanimated 채택 전제 재검토 필요).

- [ ] **Step 4: 스펙 충족 보고(FR/NFR 역참조)**

스펙 `docs/specs/2026-06-05-home-loading-skeleton-spec.md`의 ID 기준으로 충족 여부를 정리한다:
- FR-1(쿼리 일원화)·FR-2(settled 판정)·FR-3(타임아웃)·FR-5(무플래시): `useHomeReady` + Task 3 테스트.
- FR-4(통합 노출): `HomeScreen` 게이트 + Task 5 테스트.
- FR-6(레이아웃): `HomeSkeleton` + Task 4 테스트 + Step 3 스모크.
- NFR-1(무신규 의존성): reanimated 기존 설치본 사용.
- NFR-2(테스트 안전성): reanimated mock + 기존 스켈레톤 테스트 회귀 없음(Task 2 Step 5).
- NFR-3(섹션 비침습): 섹션 컴포넌트/테스트 무변경.
- NFR-4(앱 격리): 변경 전부 `apps/mobile/` 내부.
- NFR-5(성능): 섹션과 동일 키 → React Query 디둑.

---

## Self-Review (작성자 점검 결과)

- **스펙 커버리지**: FR-1~6, NFR-1~5 각각 대응 Task 존재(위 Task 6 Step 4 매핑). 누락 없음.
- **플레이스홀더 스캔**: 모든 코드 단계에 실제 코드/명령/기대 출력 명시. TBD·"적절히 처리" 등 없음.
- **타입/식별자 일관성**: `useHomeReady`/`HOME_SKELETON_TIMEOUT_MS`/`UseHomeReadyOptions`/`UseHomeReadyResult`, `HomeSkeleton`, testID `home-skeleton`·`home-skeleton-card`, 쿼리 키(`spotKeys.all`/`spotKeys.top(10)`/`homeCurationKeys.active`/`stayKeys.all`) 가 스펙과 코드/테스트 전반에서 일치.
- **앱 격리**: 모든 경로가 `apps/mobile/` 하위. 타 앱·공유 패키지 미변경.
