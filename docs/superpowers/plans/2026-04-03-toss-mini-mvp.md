# Toss Mini MVP Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 4탭(홈/지도/검색/저장) 토스 미니 앱 MVP를 TDS + flower-domain 연동으로 완성한다.

**Architecture:** Granite 파일 기반 라우팅 + `pages/_layout.tsx` 공통 탭바. `src/_app.tsx` 에서 `QueryClientProvider` 래핑. 저장 기능은 `@apps-in-toss/framework` `Storage` API로 로컬 처리.

**Tech Stack:** Granite JS, AppsInToss, TDS React Native (`@toss/tds-react-native`), TanStack Query v5, `@flower-map/flower-domain`, `@granite-js/react-native`

---

## File Map

### 신규 생성
```
apps/toss-mini/
├── pages/
│   ├── _layout.tsx
│   ├── map.tsx
│   ├── search.tsx
│   ├── saved.tsx
│   └── spot/[id].tsx
└── src/
    ├── __mocks__/
    │   ├── @toss/tds-react-native.tsx
    │   ├── @apps-in-toss/framework.ts
    │   └── @granite-js/react-native.ts
    ├── shared/
    │   ├── components/
    │   │   ├── TabBar.tsx
    │   │   └── __tests__/TabBar.test.tsx
    │   └── hooks/
    │       ├── useStorage.ts
    │       └── __tests__/useStorage.test.ts
    └── features/
        ├── home/components/
        │   ├── HeroCarousel.tsx
        │   ├── FlowerFilterChips.tsx
        │   ├── SpotCard.tsx
        │   └── __tests__/
        │       ├── FlowerFilterChips.test.tsx
        │       └── SpotCard.test.tsx
        ├── map/components/
        │   ├── SpotSummaryCard.tsx
        │   └── __tests__/SpotSummaryCard.test.tsx
        ├── search/components/
        │   ├── SpotListItem.tsx
        │   └── __tests__/SpotListItem.test.tsx
        └── saved/components/
            └── SavedSpotCard.tsx
```

### 수정
```
apps/toss-mini/
├── vitest.config.ts       # TDS / Granite / AppsInToss 모의 alias 추가
├── src/_app.tsx           # QueryClientProvider 추가
└── pages/index.tsx        # 실제 홈 화면으로 교체
```

---

## Chunk 1: Foundation — QueryProvider, 테스트 모의, TabBar, useStorage, _layout

### Task 1.1 — 테스트용 모의 파일 추가

**Files:**
- Create: `apps/toss-mini/src/__mocks__/@toss/tds-react-native.tsx`
- Create: `apps/toss-mini/src/__mocks__/@apps-in-toss/framework.ts`
- Create: `apps/toss-mini/src/__mocks__/@granite-js/react-native.ts`
- Modify: `apps/toss-mini/vitest.config.ts`

- [ ] **Step 1: TDS React Native 모의 생성**

`apps/toss-mini/src/__mocks__/@toss/tds-react-native.tsx` 생성:

```tsx
import React from 'react';

type Props = { children?: React.ReactNode; [key: string]: any };

const Navbar = ({ title, left, right }: Props) => (
  <>{left}{title}{right}</>
);
Navbar.BackButton = ({ onPress, children }: Props) => (
  <button onClick={onPress}>{children ?? '뒤로'}</button>
);
Navbar.TextButton = ({ children, onPress }: Props) => (
  <button onClick={onPress}>{children}</button>
);

const Carousel = ({ children }: Props) => <div>{children}</div>;
Carousel.Item = ({ children }: Props) => <div>{children}</div>;

const Badge = ({ children }: Props) => <span>{children}</span>;
const Button = ({ children, onPress, disabled }: Props) => (
  <button onClick={onPress} disabled={disabled}>{children}</button>
);
const ListRow = ({ contents, left, right, onPress }: Props) => (
  <div onClick={onPress}>{left}{contents}{right}</div>
);
ListRow.Texts = ({ texts }: Props) => (
  <>{(texts ?? []).map((t: any) => <span key={t.text}>{t.text}</span>)}</>
);
const SearchField = ({ onChangeText, value, placeholder, onClear }: Props) => (
  <div>
    <input
      placeholder={placeholder}
      value={value ?? ''}
      onChange={(e) => onChangeText?.(e.target.value)}
    />
    {onClear && <button onClick={onClear}>×</button>}
  </div>
);
const Loader = () => <div>Loading...</div>;
Loader.FullScreen = () => <div>Loading...</div>;
const ErrorPage = ({ title, subtitle, onPressRightButton }: Props) => (
  <div>
    <p>{title ?? '오류'}</p>
    {subtitle && <p>{subtitle}</p>}
    {onPressRightButton && <button onClick={onPressRightButton}>확인</button>}
  </div>
);

export {
  Navbar, Carousel, Badge, Button, ListRow, SearchField, Loader, ErrorPage,
};
```

- [ ] **Step 2: AppsInToss framework 모의 생성**

`apps/toss-mini/src/__mocks__/@apps-in-toss/framework.ts` 생성:

```ts
export const Storage = {
  getItem: async (_key: string): Promise<string | null> => null,
  setItem: async (_key: string, _value: string): Promise<void> => {},
  removeItem: async (_key: string): Promise<void> => {},
};
```

- [ ] **Step 3: Granite react-native 모의 생성**

`apps/toss-mini/src/__mocks__/@granite-js/react-native.ts` 생성:

```ts
const mockNavigate = () => {};
const mockGetState = () => ({ routes: [{ name: '/' }], index: 0 });

export const useNavigation = () => ({
  navigate: mockNavigate,
  getState: mockGetState,
});

export const getSchemeUri = () => 'intoss://flower-map';

export function createRoute(path: string, options: any) {
  return {
    _path: path,
    useNavigation: () => ({ navigate: mockNavigate }),
    useParams: () => ({}),
  };
}
```

- [ ] **Step 4: vitest.config.ts에 alias 추가**

`apps/toss-mini/vitest.config.ts`를 다음으로 교체:

```ts
import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'node:url';

const mock = (p: string) =>
  fileURLToPath(new URL(p, import.meta.url));

export default defineConfig({
  resolve: {
    alias: {
      '@': mock('./src'),
      'react-native': mock('./src/__mocks__/react-native.tsx'),
      '@toss/tds-react-native': mock('./src/__mocks__/@toss/tds-react-native.tsx'),
      '@apps-in-toss/framework': mock('./src/__mocks__/@apps-in-toss/framework.ts'),
      '@granite-js/react-native': mock('./src/__mocks__/@granite-js/react-native.ts'),
    },
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    globals: true,
  },
});
```

- [ ] **Step 5: 기존 테스트가 통과하는지 확인**

```bash
cd apps/toss-mini && pnpm test
```

Expected: PASS (기존 테스트 2개 통과)

- [ ] **Step 6: 커밋**

```bash
git add apps/toss-mini/vitest.config.ts apps/toss-mini/src/__mocks__/
git commit -m "test(toss-mini): TDS / Granite / AppsInToss 테스트 모의 추가"
```

---

### Task 1.2 — useStorage 훅

**Files:**
- Create: `apps/toss-mini/src/shared/hooks/useStorage.ts`
- Create: `apps/toss-mini/src/shared/hooks/__tests__/useStorage.test.ts`

- [ ] **Step 1: 실패 테스트 작성**

`apps/toss-mini/src/shared/hooks/__tests__/useStorage.test.ts` 생성:

```ts
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { Storage } from '@apps-in-toss/framework';
import { useStorage } from '../useStorage';

describe('useStorage', () => {
  beforeEach(() => {
    vi.mocked(Storage.getItem).mockResolvedValue(null);
    vi.mocked(Storage.setItem).mockResolvedValue();
  });

  it('초기에는 빈 배열을 반환합니다', async () => {
    const { result } = renderHook(() => useStorage());
    expect(result.current.savedIds).toEqual([]);
  });

  it('저장된 아이디가 있으면 로드합니다', async () => {
    vi.mocked(Storage.getItem).mockResolvedValue(JSON.stringify(['spot-1']));
    const { result } = renderHook(() => useStorage());
    await act(async () => {});
    expect(result.current.savedIds).toContain('spot-1');
  });

  it('save 호출 시 아이디를 추가합니다', async () => {
    const { result } = renderHook(() => useStorage());
    await act(async () => {
      await result.current.save('spot-2');
    });
    expect(result.current.savedIds).toContain('spot-2');
    expect(Storage.setItem).toHaveBeenCalledWith(
      'saved-spots',
      JSON.stringify(['spot-2']),
    );
  });

  it('remove 호출 시 아이디를 제거합니다', async () => {
    vi.mocked(Storage.getItem).mockResolvedValue(JSON.stringify(['spot-1', 'spot-2']));
    const { result } = renderHook(() => useStorage());
    await act(async () => {});
    await act(async () => {
      await result.current.remove('spot-1');
    });
    expect(result.current.savedIds).not.toContain('spot-1');
    expect(result.current.savedIds).toContain('spot-2');
  });

  it('isSaved는 저장 여부를 반환합니다', async () => {
    vi.mocked(Storage.getItem).mockResolvedValue(JSON.stringify(['spot-1']));
    const { result } = renderHook(() => useStorage());
    await act(async () => {});
    expect(result.current.isSaved('spot-1')).toBe(true);
    expect(result.current.isSaved('spot-99')).toBe(false);
  });
});
```

- [ ] **Step 2: 테스트 실패 확인**

```bash
cd apps/toss-mini && pnpm test src/shared/hooks/__tests__/useStorage.test.ts
```

Expected: FAIL — "Cannot find module '../useStorage'"

- [ ] **Step 3: useStorage 구현**

`apps/toss-mini/src/shared/hooks/useStorage.ts` 생성:

```ts
import { Storage } from '@apps-in-toss/framework';
import { useCallback, useEffect, useState } from 'react';

const STORAGE_KEY = 'saved-spots';

export function useStorage() {
  const [savedIds, setSavedIds] = useState<string[]>([]);

  useEffect(() => {
    Storage.getItem(STORAGE_KEY).then((raw) => {
      if (raw) {
        try {
          setSavedIds(JSON.parse(raw));
        } catch {
          setSavedIds([]);
        }
      }
    });
  }, []);

  const save = useCallback(
    async (id: string) => {
      const next = [...savedIds, id];
      await Storage.setItem(STORAGE_KEY, JSON.stringify(next));
      setSavedIds(next);
    },
    [savedIds],
  );

  const remove = useCallback(
    async (id: string) => {
      const next = savedIds.filter((sid) => sid !== id);
      await Storage.setItem(STORAGE_KEY, JSON.stringify(next));
      setSavedIds(next);
    },
    [savedIds],
  );

  const isSaved = useCallback((id: string) => savedIds.includes(id), [savedIds]);

  return { savedIds, save, remove, isSaved };
}
```

- [ ] **Step 4: 테스트 통과 확인**

```bash
cd apps/toss-mini && pnpm test src/shared/hooks/__tests__/useStorage.test.ts
```

Expected: PASS (5개 테스트)

Note: `vi.mocked`가 동작하려면 `@apps-in-toss/framework` 모의 함수를 `vi.fn()`으로 교체해야 한다. `src/__mocks__/@apps-in-toss/framework.ts`를 다음으로 수정:

```ts
import { vi } from 'vitest';

export const Storage = {
  getItem: vi.fn(async (_key: string): Promise<string | null> => null),
  setItem: vi.fn(async (_key: string, _value: string): Promise<void> => {}),
  removeItem: vi.fn(async (_key: string): Promise<void> => {}),
};
```

- [ ] **Step 5: 커밋**

```bash
git add apps/toss-mini/src/shared/hooks/
git commit -m "feat(toss-mini): useStorage 훅 추가 (앱인토스 Storage API 래핑)"
```

---

### Task 1.3 — TabBar 컴포넌트

**Files:**
- Create: `apps/toss-mini/src/shared/components/TabBar.tsx`
- Create: `apps/toss-mini/src/shared/components/__tests__/TabBar.test.tsx`

- [ ] **Step 1: 실패 테스트 작성**

`apps/toss-mini/src/shared/components/__tests__/TabBar.test.tsx` 생성:

```tsx
import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import TestRenderer, { act } from 'react-test-renderer';
import { Pressable, Text } from 'react-native';
import { TabBar } from '../TabBar';

describe('TabBar', () => {
  it('4개의 탭을 렌더링합니다', () => {
    let tree: any;
    act(() => {
      tree = TestRenderer.create(
        <TabBar currentRoute="/" onNavigate={vi.fn()} />,
      );
    });
    const labels = tree.root
      .findAllByType(Text)
      .map((n: any) => n.props.children)
      .filter((t: any) => typeof t === 'string');
    expect(labels).toContain('홈');
    expect(labels).toContain('지도');
    expect(labels).toContain('검색');
    expect(labels).toContain('저장');
  });

  it('현재 탭을 onNavigate로 전달합니다', () => {
    const onNavigate = vi.fn();
    let tree: any;
    act(() => {
      tree = TestRenderer.create(
        <TabBar currentRoute="/" onNavigate={onNavigate} />,
      );
    });
    const tabs = tree.root.findAllByType(Pressable);
    act(() => {
      tabs[1].props.onPress(); // 지도 탭
    });
    expect(onNavigate).toHaveBeenCalledWith('/map');
  });
});
```

- [ ] **Step 2: 실패 확인**

```bash
cd apps/toss-mini && pnpm test src/shared/components/__tests__/TabBar.test.tsx
```

Expected: FAIL

- [ ] **Step 3: TabBar 구현**

`apps/toss-mini/src/shared/components/TabBar.tsx` 생성:

```tsx
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

type TabItem = {
  key: string;
  label: string;
  icon: string;
};

const TABS: TabItem[] = [
  { key: '/', label: '홈', icon: '🏠' },
  { key: '/map', label: '지도', icon: '🗺️' },
  { key: '/search', label: '검색', icon: '🔍' },
  { key: '/saved', label: '저장', icon: '❤️' },
];

type TabBarProps = {
  currentRoute: string;
  onNavigate: (route: string) => void;
};

export function TabBar({ currentRoute, onNavigate }: TabBarProps) {
  return (
    <View style={styles.container}>
      {TABS.map((tab) => {
        const isActive = currentRoute === tab.key;
        return (
          <Pressable
            key={tab.key}
            style={styles.tab}
            onPress={() => onNavigate(tab.key)}
            accessibilityLabel={tab.label}
          >
            <Text style={styles.icon}>{tab.icon}</Text>
            <Text style={[styles.label, isActive && styles.activeLabel]}>
              {tab.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E7DDD1',
    paddingBottom: 20,
    paddingTop: 8,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  icon: {
    fontSize: 20,
  },
  label: {
    fontSize: 10,
    color: '#888888',
  },
  activeLabel: {
    color: '#5C9E66',
    fontWeight: '600',
  },
});
```

- [ ] **Step 4: 테스트 통과 확인**

```bash
cd apps/toss-mini && pnpm test src/shared/components/__tests__/TabBar.test.tsx
```

Expected: PASS (2개 테스트)

- [ ] **Step 5: 커밋**

```bash
git add apps/toss-mini/src/shared/components/
git commit -m "feat(toss-mini): TabBar 컴포넌트 추가"
```

---

### Task 1.4 — QueryClientProvider + _layout.tsx

**Files:**
- Modify: `apps/toss-mini/src/_app.tsx`
- Create: `apps/toss-mini/pages/_layout.tsx`

- [ ] **Step 1: _app.tsx에 QueryClientProvider 추가**

`apps/toss-mini/src/_app.tsx`를 다음으로 교체:

```tsx
import { AppsInToss } from '@apps-in-toss/framework';
import { getSchemeUri, InitialProps } from '@granite-js/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { PropsWithChildren } from 'react';

import { context } from '../require.context';

// Toss 샌드박스 실제 스킴(intoss://)과 granite.config scheme 불일치 보정
const g = global as any;
if (g.__granite?.app) {
  const actualScheme = getSchemeUri()?.split('://')[0];
  if (actualScheme && actualScheme !== g.__granite.app.scheme) {
    g.__granite.app.scheme = actualScheme;
  }
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      retry: 1,
    },
  },
});

function AppContainer({ children }: PropsWithChildren<InitialProps>) {
  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

export default AppsInToss.registerApp(AppContainer, { context });
```

- [ ] **Step 2: _layout.tsx 생성**

`apps/toss-mini/pages/_layout.tsx` 생성:

```tsx
import { useNavigation } from '@granite-js/react-native';
import React from 'react';
import { View } from 'react-native';
import { TabBar } from '../src/shared/components/TabBar';

export default function Layout({ children }: { children: React.ReactNode }) {
  const navigation = useNavigation();
  const state = navigation.getState();
  const currentRoute = (state?.routes[state.index]?.name as string) ?? '/';

  return (
    <View style={{ flex: 1 }}>
      <View style={{ flex: 1 }}>{children}</View>
      <TabBar
        currentRoute={currentRoute}
        onNavigate={(route) => navigation.navigate(route as never)}
      />
    </View>
  );
}
```

- [ ] **Step 3: 전체 테스트 통과 확인**

```bash
cd apps/toss-mini && pnpm test
```

Expected: PASS

- [ ] **Step 4: 커밋**

```bash
git add apps/toss-mini/src/_app.tsx apps/toss-mini/pages/_layout.tsx
git commit -m "feat(toss-mini): QueryClientProvider + _layout 탭바 레이아웃 추가"
```

---

## Chunk 2: 홈 화면

### Task 2.1 — SpotCard 컴포넌트

**Files:**
- Create: `apps/toss-mini/src/features/home/components/SpotCard.tsx`
- Create: `apps/toss-mini/src/features/home/components/__tests__/SpotCard.test.tsx`

데이터 타입 참고 (`FlowerSpot`):
```ts
{
  id: string; place: string; flower: string; location: string;
  badge: string; thumbnailUrl: string | null; bloomStatus: string;
  description: string | null; helper: string | null;
  latitude: number; longitude: number; tone: 'green' | 'pink' | 'yellow';
}
```

- [ ] **Step 1: 실패 테스트 작성**

`apps/toss-mini/src/features/home/components/__tests__/SpotCard.test.tsx` 생성:

```tsx
import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import TestRenderer, { act } from 'react-test-renderer';
import { Text } from 'react-native';
import { SpotCard } from '../SpotCard';

const MOCK_SPOT = {
  id: 'spot-1',
  place: '여의도 한강공원',
  flower: '벚꽃',
  location: '서울',
  badge: '지금 방문 추천',
  thumbnailUrl: null,
  bloomStatus: '개화 중',
  description: '한강을 따라 벚꽃이 만발합니다.',
  helper: null,
  latitude: 37.52,
  longitude: 126.93,
  tone: 'pink' as const,
};

describe('SpotCard', () => {
  it('명소 이름과 꽃 종류를 렌더링합니다', () => {
    let tree: any;
    act(() => {
      tree = TestRenderer.create(
        <SpotCard spot={MOCK_SPOT} onPress={vi.fn()} />,
      );
    });
    const texts = tree.root
      .findAllByType(Text)
      .map((n: any) => n.props.children);
    expect(texts).toContain('여의도 한강공원');
    expect(texts).toContain('벚꽃');
  });

  it('onPress 콜백을 호출합니다', () => {
    const onPress = vi.fn();
    let tree: any;
    act(() => {
      tree = TestRenderer.create(<SpotCard spot={MOCK_SPOT} onPress={onPress} />);
    });
    const { Pressable } = require('react-native');
    const card = tree.root.findByType(Pressable);
    act(() => {
      card.props.onPress();
    });
    expect(onPress).toHaveBeenCalledWith(MOCK_SPOT);
  });
});
```

- [ ] **Step 2: 실패 확인**

```bash
cd apps/toss-mini && pnpm test src/features/home/components/__tests__/SpotCard.test.tsx
```

Expected: FAIL

- [ ] **Step 3: SpotCard 구현**

`apps/toss-mini/src/features/home/components/SpotCard.tsx` 생성:

```tsx
import { Badge } from '@toss/tds-react-native';
import React from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import type { FlowerSpot } from '@flower-map/flower-domain';

type SpotCardProps = {
  spot: FlowerSpot;
  onPress: (spot: FlowerSpot) => void;
};

const TONE_BADGE: Record<FlowerSpot['tone'], 'teal' | 'blue' | 'green'> = {
  green: 'green',
  pink: 'blue',
  yellow: 'teal',
};

export function SpotCard({ spot, onPress }: SpotCardProps) {
  return (
    <Pressable style={styles.card} onPress={() => onPress(spot)}>
      {spot.thumbnailUrl && (
        <Image
          source={{ uri: spot.thumbnailUrl }}
          style={styles.image}
          resizeMode="cover"
        />
      )}
      <View style={styles.body}>
        <View style={styles.row}>
          <Badge size="small" type={TONE_BADGE[spot.tone]} badgeStyle="weak">
            {spot.badge}
          </Badge>
        </View>
        <Text style={styles.place}>{spot.place}</Text>
        <Text style={styles.flower}>{spot.flower}</Text>
        {spot.description ? (
          <Text style={styles.description} numberOfLines={2}>
            {spot.description}
          </Text>
        ) : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginHorizontal: 16,
    marginBottom: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  image: {
    width: '100%',
    height: 180,
    backgroundColor: '#F0F0F0',
  },
  body: {
    padding: 16,
    gap: 6,
  },
  row: {
    flexDirection: 'row',
  },
  place: {
    fontSize: 18,
    fontWeight: '700',
    color: '#142218',
  },
  flower: {
    fontSize: 14,
    fontWeight: '600',
    color: '#5C9E66',
  },
  description: {
    fontSize: 13,
    color: '#5E7262',
    lineHeight: 18,
  },
});
```

- [ ] **Step 4: 테스트 통과 확인**

```bash
cd apps/toss-mini && pnpm test src/features/home/components/__tests__/SpotCard.test.tsx
```

Expected: PASS (2개 테스트)

- [ ] **Step 5: 커밋**

```bash
git add apps/toss-mini/src/features/home/components/SpotCard.tsx \
        apps/toss-mini/src/features/home/components/__tests__/SpotCard.test.tsx
git commit -m "feat(toss-mini): SpotCard 컴포넌트 추가"
```

---

### Task 2.2 — FlowerFilterChips 컴포넌트

**Files:**
- Create: `apps/toss-mini/src/features/home/components/FlowerFilterChips.tsx`
- Create: `apps/toss-mini/src/features/home/components/__tests__/FlowerFilterChips.test.tsx`

- [ ] **Step 1: 실패 테스트 작성**

`apps/toss-mini/src/features/home/components/__tests__/FlowerFilterChips.test.tsx` 생성:

```tsx
import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import TestRenderer, { act } from 'react-test-renderer';
import { Button } from '@toss/tds-react-native';
import { FlowerFilterChips } from '../FlowerFilterChips';

const FILTERS = [
  { label: '벚꽃', value: '벚꽃' },
  { label: '진달래', value: '진달래' },
];

describe('FlowerFilterChips', () => {
  it('전체 칩과 꽃 필터를 렌더링합니다', () => {
    let tree: any;
    act(() => {
      tree = TestRenderer.create(
        <FlowerFilterChips
          filters={FILTERS}
          selected={null}
          onSelect={vi.fn()}
        />,
      );
    });
    const buttons = tree.root.findAllByType(Button);
    expect(buttons.length).toBe(3); // 전체 + 2개
  });

  it('선택된 꽃 필터를 onSelect로 전달합니다', () => {
    const onSelect = vi.fn();
    let tree: any;
    act(() => {
      tree = TestRenderer.create(
        <FlowerFilterChips
          filters={FILTERS}
          selected={null}
          onSelect={onSelect}
        />,
      );
    });
    const buttons = tree.root.findAllByType(Button);
    act(() => {
      buttons[1].props.onPress(); // 벚꽃 버튼
    });
    expect(onSelect).toHaveBeenCalledWith('벚꽃');
  });

  it('이미 선택된 필터를 다시 누르면 null을 전달합니다', () => {
    const onSelect = vi.fn();
    let tree: any;
    act(() => {
      tree = TestRenderer.create(
        <FlowerFilterChips
          filters={FILTERS}
          selected="벚꽃"
          onSelect={onSelect}
        />,
      );
    });
    const buttons = tree.root.findAllByType(Button);
    act(() => {
      buttons[1].props.onPress(); // 벚꽃 버튼 (이미 선택)
    });
    expect(onSelect).toHaveBeenCalledWith(null);
  });
});
```

- [ ] **Step 2: 실패 확인**

```bash
cd apps/toss-mini && pnpm test src/features/home/components/__tests__/FlowerFilterChips.test.tsx
```

Expected: FAIL

- [ ] **Step 3: FlowerFilterChips 구현**

`apps/toss-mini/src/features/home/components/FlowerFilterChips.tsx` 생성:

```tsx
import { Button } from '@toss/tds-react-native';
import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import type { FlowerFilter } from '@flower-map/flower-domain';

type FlowerFilterChipsProps = {
  filters: FlowerFilter[];
  selected: string | null;
  onSelect: (value: string | null) => void;
};

export function FlowerFilterChips({
  filters,
  selected,
  onSelect,
}: FlowerFilterChipsProps) {
  const all = [{ label: '전체', value: null as null }, ...filters];

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.container}
    >
      {all.map((f) => {
        const isActive = f.value === selected;
        return (
          <View key={f.value ?? '__all'} style={styles.chip}>
            <Button
              size="tiny"
              type={isActive ? 'primary' : 'light'}
              style={isActive ? 'fill' : 'weak'}
              onPress={() => onSelect(isActive ? null : f.value)}
            >
              {f.label}
            </Button>
          </View>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 8,
    flexDirection: 'row',
  },
  chip: {},
});
```

- [ ] **Step 4: 테스트 통과 확인**

```bash
cd apps/toss-mini && pnpm test src/features/home/components/__tests__/FlowerFilterChips.test.tsx
```

Expected: PASS (3개 테스트)

- [ ] **Step 5: 커밋**

```bash
git add apps/toss-mini/src/features/home/components/FlowerFilterChips.tsx \
        apps/toss-mini/src/features/home/components/__tests__/FlowerFilterChips.test.tsx
git commit -m "feat(toss-mini): FlowerFilterChips 컴포넌트 추가"
```

---

### Task 2.3 — HeroCarousel 컴포넌트

**Files:**
- Create: `apps/toss-mini/src/features/home/components/HeroCarousel.tsx`

(HeroCarousel은 SpotCard와 TDS Carousel 합성이므로 별도 단위 테스트 없이 홈 화면에서 통합 검증)

- [ ] **Step 1: HeroCarousel 구현**

`apps/toss-mini/src/features/home/components/HeroCarousel.tsx` 생성:

```tsx
import { Badge, Carousel } from '@toss/tds-react-native';
import React from 'react';
import { Dimensions, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import type { FlowerSpot } from '@flower-map/flower-domain';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = SCREEN_WIDTH - 48;

type HeroCarouselProps = {
  spots: FlowerSpot[];
  onPress: (spot: FlowerSpot) => void;
};

export function HeroCarousel({ spots, onPress }: HeroCarouselProps) {
  if (spots.length === 0) {
    return null;
  }

  return (
    <Carousel itemWidth={CARD_WIDTH} itemGap={12} padding={24}>
      {spots.map((spot) => (
        <Carousel.Item key={spot.id}>
          <Pressable style={styles.card} onPress={() => onPress(spot)}>
            <Image
              source={
                spot.thumbnailUrl
                  ? { uri: spot.thumbnailUrl }
                  : { uri: '' }
              }
              style={styles.image}
              resizeMode="cover"
            />
            <View style={styles.overlay}>
              <Badge size="small" type="blue" badgeStyle="fill">
                {spot.badge}
              </Badge>
              <Text style={styles.place}>{spot.place}</Text>
              <Text style={styles.flower}>{spot.flower} · {spot.location}</Text>
            </View>
          </Pressable>
        </Carousel.Item>
      ))}
    </Carousel>
  );
}

const styles = StyleSheet.create({
  card: {
    width: CARD_WIDTH,
    height: 220,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#E8F5E9',
  },
  image: {
    ...StyleSheet.absoluteFillObject,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.3)',
    padding: 16,
    justifyContent: 'flex-end',
    gap: 4,
  },
  place: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '800',
  },
  flower: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 13,
  },
});
```

- [ ] **Step 2: 커밋**

```bash
git add apps/toss-mini/src/features/home/components/HeroCarousel.tsx
git commit -m "feat(toss-mini): HeroCarousel 컴포넌트 추가"
```

---

### Task 2.4 — 홈 화면 (`pages/index.tsx`) 교체

**Files:**
- Modify: `apps/toss-mini/pages/index.tsx`

- [ ] **Step 1: 홈 화면 구현**

`apps/toss-mini/pages/index.tsx`를 다음으로 교체:

```tsx
import { Loader, Navbar } from '@toss/tds-react-native';
import { useQuery } from '@tanstack/react-query';
import { createRoute } from '@granite-js/react-native';
import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import {
  getFeaturedSpots,
  getFlowerFilters,
  type FlowerSpot,
} from '@flower-map/flower-domain';

import { HeroCarousel } from '../src/features/home/components/HeroCarousel';
import { FlowerFilterChips } from '../src/features/home/components/FlowerFilterChips';
import { SpotCard } from '../src/features/home/components/SpotCard';

export const Route = createRoute('/', {
  component: HomePage,
});

function HomePage() {
  const navigation = Route.useNavigation();
  const [selectedFlower, setSelectedFlower] = useState<string | null>(null);

  const { data: spots = [], isPending: spotsPending } = useQuery({
    queryKey: ['featured-spots'],
    queryFn: () => getFeaturedSpots(20),
  });

  const { data: filters = [] } = useQuery({
    queryKey: ['flower-filters'],
    queryFn: getFlowerFilters,
  });

  const filteredSpots = selectedFlower
    ? spots.filter((s) => s.flower === selectedFlower)
    : spots;

  const heroSpots = spots.slice(0, 5);

  const handleSpotPress = (spot: FlowerSpot) => {
    navigation.navigate('/spot/:id' as never, { id: spot.id } as never);
  };

  if (spotsPending) {
    return (
      <View style={styles.center}>
        <Loader size="large" type="primary" />
      </View>
    );
  }

  return (
    <View style={styles.page}>
      <Navbar title="꽃 어디" />
      <ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        <HeroCarousel spots={heroSpots} onPress={handleSpotPress} />

        <FlowerFilterChips
          filters={filters}
          selected={selectedFlower}
          onSelect={setSelectedFlower}
        />

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            {selectedFlower ? `${selectedFlower} 명소` : '지금 보기 좋은 명소'}
          </Text>
          {filteredSpots.map((spot) => (
            <SpotCard key={spot.id} spot={spot} onPress={handleSpotPress} />
          ))}
          {filteredSpots.length === 0 && (
            <Text style={styles.empty}>해당 꽃 명소가 없습니다.</Text>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: '#F4F8F4' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  scroll: { flex: 1 },
  content: { paddingBottom: 24 },
  section: { marginTop: 8 },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#142218',
    marginHorizontal: 16,
    marginBottom: 12,
  },
  empty: {
    textAlign: 'center',
    color: '#888',
    marginTop: 24,
  },
});
```

- [ ] **Step 2: 타입 체크**

```bash
cd apps/toss-mini && pnpm typecheck
```

Expected: 오류 없음

- [ ] **Step 3: 전체 테스트 통과 확인**

```bash
cd apps/toss-mini && pnpm test
```

Expected: PASS

- [ ] **Step 4: 커밋**

```bash
git add apps/toss-mini/pages/index.tsx
git commit -m "feat(toss-mini): 홈 화면 — HeroCarousel + 꽃 필터 + 명소 리스트 구현"
```

---

## Chunk 3: 명소 상세 화면

### Task 3.1 — 명소 상세 (`pages/spot/[id].tsx`)

**Files:**
- Create: `apps/toss-mini/pages/spot/[id].tsx`

- [ ] **Step 1: 명소 상세 구현**

`apps/toss-mini/pages/spot/[id].tsx` 생성:

```tsx
import { Badge, Button, Loader, Navbar } from '@toss/tds-react-native';
import { useQuery } from '@tanstack/react-query';
import { createRoute, openURL } from '@granite-js/react-native';
import React from 'react';
import { Image, ScrollView, StyleSheet, Text, View } from 'react-native';
import { getSpotById } from '@flower-map/flower-domain';

import { useStorage } from '../../src/shared/hooks/useStorage';

export const Route = createRoute('/spot/:id', {
  validateParams: (params) => params as { id: string },
  component: SpotDetailPage,
});

function SpotDetailPage() {
  const navigation = Route.useNavigation();
  const { id } = Route.useParams();
  const { isSaved, save, remove } = useStorage();

  const { data: spot, isPending, isError } = useQuery({
    queryKey: ['spot', id],
    queryFn: () => getSpotById(id),
    enabled: Boolean(id),
  });

  const handleDirections = () => {
    if (!spot) return;
    const url = `nmap://route/walk?dlat=${spot.latitude}&dlng=${spot.longitude}&dname=${encodeURIComponent(spot.place)}&appname=flower-map`;
    openURL(url).catch(() => {
      // 네이버지도 미설치 시 카카오맵 폴백
      const kakaoUrl = `kakaomap://route?ep=${spot.latitude},${spot.longitude}&by=FOOT`;
      openURL(kakaoUrl);
    });
  };

  const handleSaveToggle = () => {
    if (!spot) return;
    if (isSaved(spot.id)) {
      remove(spot.id);
    } else {
      save(spot.id);
    }
  };

  if (isPending) {
    return (
      <View style={styles.center}>
        <Loader size="large" type="primary" />
      </View>
    );
  }

  if (isError || !spot) {
    return (
      <View style={styles.center}>
        <Navbar
          left={<Navbar.BackButton onPress={() => navigation.goBack()} />}
          title="명소 상세"
        />
        <Text style={styles.errorText}>명소 정보를 불러올 수 없습니다.</Text>
      </View>
    );
  }

  const saved = isSaved(spot.id);

  return (
    <View style={styles.page}>
      <Navbar
        left={<Navbar.BackButton onPress={() => navigation.goBack()} />}
        title={spot.place}
        right={
          <Navbar.TextButton onPress={handleSaveToggle}>
            {saved ? '저장됨' : '저장'}
          </Navbar.TextButton>
        }
      />
      <ScrollView showsVerticalScrollIndicator={false}>
        {spot.thumbnailUrl && (
          <Image
            source={{ uri: spot.thumbnailUrl }}
            style={styles.image}
            resizeMode="cover"
          />
        )}
        <View style={styles.body}>
          <View style={styles.badgeRow}>
            <Badge size="small" type="green" badgeStyle="weak">
              {spot.flower}
            </Badge>
            <Badge size="small" type="blue" badgeStyle="weak">
              {spot.badge}
            </Badge>
          </View>

          <Text style={styles.place}>{spot.place}</Text>
          <Text style={styles.meta}>
            {spot.location} · {spot.bloomStatus}
          </Text>
          <Text style={styles.period}>
            🌸 {spot.bloomStartAt} ~ {spot.bloomEndAt}
          </Text>

          {spot.description ? (
            <Text style={styles.description}>{spot.description}</Text>
          ) : null}

          {spot.helper ? (
            <View style={styles.tipBox}>
              <Text style={styles.tipText}>💡 {spot.helper}</Text>
            </View>
          ) : null}

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>입장료</Text>
            <Text style={styles.infoValue}>{spot.fee}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>주차</Text>
            <Text style={styles.infoValue}>{spot.parking}</Text>
          </View>

          <View style={styles.actions}>
            <Button
              size="big"
              type="primary"
              style="fill"
              onPress={handleDirections}
            >
              🗺️ 길찾기
            </Button>
            <Button
              size="big"
              type={saved ? 'dark' : 'light'}
              style={saved ? 'fill' : 'weak'}
              onPress={handleSaveToggle}
            >
              {saved ? '❤️ 저장됨' : '🤍 저장하기'}
            </Button>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: '#F4F8F4' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  image: { width: '100%', height: 260 },
  body: { padding: 20, gap: 12 },
  badgeRow: { flexDirection: 'row', gap: 8 },
  place: { fontSize: 24, fontWeight: '800', color: '#142218' },
  meta: { fontSize: 14, color: '#5E7262' },
  period: { fontSize: 13, color: '#5C9E66' },
  description: { fontSize: 15, color: '#333', lineHeight: 22 },
  tipBox: {
    backgroundColor: '#EEF4EA',
    borderRadius: 12,
    padding: 14,
  },
  tipText: { fontSize: 14, color: '#2D5C33', lineHeight: 20 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between' },
  infoLabel: { fontSize: 14, color: '#888' },
  infoValue: { fontSize: 14, color: '#333', fontWeight: '500' },
  actions: { marginTop: 8, gap: 10 },
  errorText: { color: '#888', fontSize: 15 },
});
```

Note: `navigation.goBack()`은 React Navigation의 stack navigator에서 이전 화면으로 돌아갑니다. Granite의 `useNavigation()`이 이를 지원합니다.

- [ ] **Step 2: 타입 체크**

```bash
cd apps/toss-mini && pnpm typecheck
```

Expected: 오류 없음

- [ ] **Step 3: 커밋**

```bash
git add apps/toss-mini/pages/spot/
git commit -m "feat(toss-mini): 명소 상세 화면 추가"
```

---

## Chunk 4: 지도 화면

### Task 4.1 — SpotSummaryCard 컴포넌트

**Files:**
- Create: `apps/toss-mini/src/features/map/components/SpotSummaryCard.tsx`
- Create: `apps/toss-mini/src/features/map/components/__tests__/SpotSummaryCard.test.tsx`

- [ ] **Step 1: 실패 테스트 작성**

`apps/toss-mini/src/features/map/components/__tests__/SpotSummaryCard.test.tsx` 생성:

```tsx
import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import TestRenderer, { act } from 'react-test-renderer';
import { Text } from 'react-native';
import { SpotSummaryCard } from '../SpotSummaryCard';

const MOCK_SPOT = {
  id: 'spot-1',
  place: '여의도 한강공원',
  flower: '벚꽃',
  location: '서울',
  badge: '지금 방문 추천',
  thumbnailUrl: null,
  bloomStatus: '개화 중',
  description: null,
  helper: null,
  latitude: 37.52,
  longitude: 126.93,
  tone: 'pink' as const,
};

describe('SpotSummaryCard', () => {
  it('명소 이름과 지역을 렌더링합니다', () => {
    let tree: any;
    act(() => {
      tree = TestRenderer.create(
        <SpotSummaryCard spot={MOCK_SPOT} onPress={vi.fn()} isSelected={false} />,
      );
    });
    const texts = tree.root
      .findAllByType(Text)
      .map((n: any) => n.props.children);
    expect(texts).toContain('여의도 한강공원');
  });

  it('onPress 콜백을 호출합니다', () => {
    const onPress = vi.fn();
    let tree: any;
    act(() => {
      tree = TestRenderer.create(
        <SpotSummaryCard spot={MOCK_SPOT} onPress={onPress} isSelected={false} />,
      );
    });
    const { Pressable } = require('react-native');
    const card = tree.root.findByType(Pressable);
    act(() => {
      card.props.onPress();
    });
    expect(onPress).toHaveBeenCalledWith(MOCK_SPOT);
  });
});
```

- [ ] **Step 2: 실패 확인**

```bash
cd apps/toss-mini && pnpm test src/features/map/components/__tests__/SpotSummaryCard.test.tsx
```

Expected: FAIL

- [ ] **Step 3: SpotSummaryCard 구현**

`apps/toss-mini/src/features/map/components/SpotSummaryCard.tsx` 생성:

```tsx
import { Badge } from '@toss/tds-react-native';
import React from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import type { FlowerSpot } from '@flower-map/flower-domain';

type SpotSummaryCardProps = {
  spot: FlowerSpot;
  isSelected: boolean;
  onPress: (spot: FlowerSpot) => void;
};

export function SpotSummaryCard({ spot, isSelected, onPress }: SpotSummaryCardProps) {
  return (
    <Pressable
      style={[styles.card, isSelected && styles.selected]}
      onPress={() => onPress(spot)}
    >
      {spot.thumbnailUrl && (
        <Image
          source={{ uri: spot.thumbnailUrl }}
          style={styles.image}
          resizeMode="cover"
        />
      )}
      <View style={styles.body}>
        <Badge size="small" type="green" badgeStyle="weak">
          {spot.flower}
        </Badge>
        <Text style={styles.place}>{spot.place}</Text>
        <Text style={styles.meta}>{spot.location} · {spot.bloomStatus}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    width: 200,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    overflow: 'hidden',
    marginRight: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  selected: {
    borderWidth: 2,
    borderColor: '#5C9E66',
  },
  image: {
    width: '100%',
    height: 120,
    backgroundColor: '#E8F5E9',
  },
  body: {
    padding: 12,
    gap: 4,
  },
  place: {
    fontSize: 14,
    fontWeight: '700',
    color: '#142218',
  },
  meta: {
    fontSize: 12,
    color: '#5E7262',
  },
});
```

- [ ] **Step 4: 테스트 통과 확인**

```bash
cd apps/toss-mini && pnpm test src/features/map/components/__tests__/SpotSummaryCard.test.tsx
```

Expected: PASS (2개 테스트)

- [ ] **Step 5: 커밋**

```bash
git add apps/toss-mini/src/features/map/components/SpotSummaryCard.tsx \
        apps/toss-mini/src/features/map/components/__tests__/SpotSummaryCard.test.tsx
git commit -m "feat(toss-mini): SpotSummaryCard 컴포넌트 추가"
```

---

### Task 4.2 — 지도 화면 (`pages/map.tsx`)

**Files:**
- Create: `apps/toss-mini/pages/map.tsx`

- [ ] **Step 1: 지도 화면 구현**

`apps/toss-mini/pages/map.tsx` 생성:

```tsx
import { Loader, Navbar } from '@toss/tds-react-native';
import { useQuery } from '@tanstack/react-query';
import { createRoute } from '@granite-js/react-native';
import React, { useRef, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { getFeaturedSpots, getFlowerFilters, type FlowerSpot } from '@flower-map/flower-domain';

import { NaverMapCanvas } from '../src/features/map/components/NaverMapCanvas';
import { SpotSummaryCard } from '../src/features/map/components/SpotSummaryCard';
import { FlowerFilterChips } from '../src/features/home/components/FlowerFilterChips';

export const Route = createRoute('/map', {
  component: MapPage,
});

const DEFAULT_LATITUDE = 37.5665;
const DEFAULT_LONGITUDE = 126.978;

function MapPage() {
  const navigation = Route.useNavigation();
  const [selectedSpotId, setSelectedSpotId] = useState<string | null>(null);
  const [selectedFlower, setSelectedFlower] = useState<string | null>(null);
  const scrollRef = useRef<ScrollView>(null);

  const { data: spots = [], isPending } = useQuery({
    queryKey: ['featured-spots'],
    queryFn: () => getFeaturedSpots(20),
  });

  const { data: filters = [] } = useQuery({
    queryKey: ['flower-filters'],
    queryFn: getFlowerFilters,
  });

  const filteredSpots = selectedFlower
    ? spots.filter((s) => s.flower === selectedFlower)
    : spots;

  const selectedSpot = filteredSpots.find((s) => s.id === selectedSpotId) ?? filteredSpots[0];

  const handleMarkerTap = (spot: FlowerSpot) => {
    setSelectedSpotId(spot.id);
    const idx = filteredSpots.findIndex((s) => s.id === spot.id);
    if (idx >= 0 && scrollRef.current) {
      scrollRef.current.scrollTo({ x: idx * (200 + 12), animated: true });
    }
  };

  const handleCardPress = (spot: FlowerSpot) => {
    navigation.navigate('/spot/:id' as never, { id: spot.id } as never);
  };

  if (isPending) {
    return (
      <View style={styles.center}>
        <Loader size="large" type="primary" />
      </View>
    );
  }

  return (
    <View style={styles.page}>
      <Navbar title="지도" />
      <NaverMapCanvas
        latitude={selectedSpot?.latitude ?? DEFAULT_LATITUDE}
        longitude={selectedSpot?.longitude ?? DEFAULT_LONGITUDE}
        markerLatitude={selectedSpot?.latitude ?? DEFAULT_LATITUDE}
        markerLongitude={selectedSpot?.longitude ?? DEFAULT_LONGITUDE}
        onMarkerTap={() => {}}
        markerCaption={selectedSpot?.place}
      />
      <FlowerFilterChips
        filters={filters}
        selected={selectedFlower}
        onSelect={setSelectedFlower}
      />
      <ScrollView
        ref={scrollRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.cardList}
      >
        {filteredSpots.map((spot) => (
          <SpotSummaryCard
            key={spot.id}
            spot={spot}
            isSelected={spot.id === selectedSpotId}
            onPress={handleCardPress}
          />
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: '#F4F8F4' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  cardList: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
});
```

Note: 현재 `NaverMapCanvas`는 단일 마커만 지원합니다. 다중 마커가 필요하면 추후 Props 확장 가능.

- [ ] **Step 2: 타입 체크**

```bash
cd apps/toss-mini && pnpm typecheck
```

Expected: 오류 없음

- [ ] **Step 3: 커밋**

```bash
git add apps/toss-mini/pages/map.tsx
git commit -m "feat(toss-mini): 지도 화면 — NaverMap + 꽃 필터 + 수평 카드 리스트"
```

---

## Chunk 5: 검색 화면

### Task 5.1 — SpotListItem 컴포넌트

**Files:**
- Create: `apps/toss-mini/src/features/search/components/SpotListItem.tsx`
- Create: `apps/toss-mini/src/features/search/components/__tests__/SpotListItem.test.tsx`

- [ ] **Step 1: 실패 테스트 작성**

`apps/toss-mini/src/features/search/components/__tests__/SpotListItem.test.tsx` 생성:

```tsx
import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import TestRenderer, { act } from 'react-test-renderer';
import { Text } from 'react-native';
import { SpotListItem } from '../SpotListItem';

const MOCK_SPOT = {
  id: 'spot-1',
  place: '여의도 한강공원',
  flower: '벚꽃',
  location: '서울',
  badge: '지금 방문 추천',
  thumbnailUrl: null,
  bloomStatus: '개화 중',
  description: '벚꽃이 만발합니다.',
  helper: null,
  latitude: 37.52,
  longitude: 126.93,
  tone: 'pink' as const,
};

describe('SpotListItem', () => {
  it('명소 이름, 꽃 종류, 지역을 렌더링합니다', () => {
    let tree: any;
    act(() => {
      tree = TestRenderer.create(
        <SpotListItem spot={MOCK_SPOT} onPress={vi.fn()} />,
      );
    });
    const texts = tree.root
      .findAllByType(Text)
      .map((n: any) => n.props.children);
    expect(texts).toContain('여의도 한강공원');
    expect(texts).toContain('벚꽃');
  });

  it('onPress 콜백을 호출합니다', () => {
    const onPress = vi.fn();
    let tree: any;
    act(() => {
      tree = TestRenderer.create(<SpotListItem spot={MOCK_SPOT} onPress={onPress} />);
    });
    const { Pressable } = require('react-native');
    act(() => {
      tree.root.findByType(Pressable).props.onPress();
    });
    expect(onPress).toHaveBeenCalledWith(MOCK_SPOT);
  });
});
```

- [ ] **Step 2: 실패 확인**

```bash
cd apps/toss-mini && pnpm test src/features/search/components/__tests__/SpotListItem.test.tsx
```

Expected: FAIL

- [ ] **Step 3: SpotListItem 구현**

`apps/toss-mini/src/features/search/components/SpotListItem.tsx` 생성:

```tsx
import { Badge } from '@toss/tds-react-native';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { FlowerSpot } from '@flower-map/flower-domain';

type SpotListItemProps = {
  spot: FlowerSpot;
  onPress: (spot: FlowerSpot) => void;
};

export function SpotListItem({ spot, onPress }: SpotListItemProps) {
  return (
    <Pressable style={styles.item} onPress={() => onPress(spot)}>
      <View style={styles.body}>
        <Text style={styles.place}>{spot.place}</Text>
        <View style={styles.meta}>
          <Text style={styles.flower}>{spot.flower}</Text>
          <Text style={styles.separator}>·</Text>
          <Text style={styles.location}>{spot.location}</Text>
        </View>
        {spot.description ? (
          <Text style={styles.description} numberOfLines={1}>
            {spot.description}
          </Text>
        ) : null}
      </View>
      <Badge size="small" type="green" badgeStyle="weak">
        {spot.badge}
      </Badge>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  item: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0EDE8',
    backgroundColor: '#FFFFFF',
  },
  body: { flex: 1, gap: 4, marginRight: 8 },
  place: { fontSize: 16, fontWeight: '600', color: '#142218' },
  meta: { flexDirection: 'row', gap: 4 },
  flower: { fontSize: 13, color: '#5C9E66' },
  separator: { fontSize: 13, color: '#CCC' },
  location: { fontSize: 13, color: '#888' },
  description: { fontSize: 13, color: '#888' },
});
```

- [ ] **Step 4: 테스트 통과 확인**

```bash
cd apps/toss-mini && pnpm test src/features/search/components/__tests__/SpotListItem.test.tsx
```

Expected: PASS (2개 테스트)

- [ ] **Step 5: 커밋**

```bash
git add apps/toss-mini/src/features/search/components/
git commit -m "feat(toss-mini): SpotListItem 컴포넌트 추가"
```

---

### Task 5.2 — 검색 화면 (`pages/search.tsx`)

**Files:**
- Create: `apps/toss-mini/pages/search.tsx`

- [ ] **Step 1: 검색 화면 구현**

`apps/toss-mini/pages/search.tsx` 생성:

```tsx
import { Loader, Navbar, SearchField } from '@toss/tds-react-native';
import { useQuery } from '@tanstack/react-query';
import { createRoute } from '@granite-js/react-native';
import React, { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { getFeaturedSpots, getFlowerFilters, type FlowerSpot } from '@flower-map/flower-domain';

import { FlowerFilterChips } from '../src/features/home/components/FlowerFilterChips';
import { SpotListItem } from '../src/features/search/components/SpotListItem';

export const Route = createRoute('/search', {
  component: SearchPage,
});

function SearchPage() {
  const navigation = Route.useNavigation();
  const [query, setQuery] = useState('');
  const [selectedFlower, setSelectedFlower] = useState<string | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<string | null>(null);

  const { data: spots = [], isPending } = useQuery({
    queryKey: ['featured-spots'],
    queryFn: () => getFeaturedSpots(100),
  });

  const { data: filters = [] } = useQuery({
    queryKey: ['flower-filters'],
    queryFn: getFlowerFilters,
  });

  const locationFilters = useMemo(
    () => Array.from(new Set(spots.map((s) => s.location))).filter(Boolean),
    [spots],
  );

  const results = useMemo(() => {
    let list = spots;
    if (selectedFlower) {
      list = list.filter((s) => s.flower === selectedFlower);
    }
    if (selectedLocation) {
      list = list.filter((s) => s.location === selectedLocation);
    }
    if (query.trim()) {
      const q = query.trim().toLowerCase();
      list = list.filter(
        (s) =>
          s.place.toLowerCase().includes(q) ||
          s.location.toLowerCase().includes(q) ||
          (s.description?.toLowerCase().includes(q) ?? false),
      );
    }
    return list;
  }, [spots, query, selectedFlower, selectedLocation]);

  const handlePress = (spot: FlowerSpot) => {
    navigation.navigate('/spot/:id' as never, { id: spot.id } as never);
  };

  return (
    <View style={styles.page}>
      <Navbar title="검색" />
      <View style={styles.searchBox}>
        <SearchField
          placeholder="명소 이름, 지역으로 검색"
          value={query}
          onChangeText={setQuery}
          onClear={() => setQuery('')}
        />
      </View>
      <FlowerFilterChips
        filters={filters}
        selected={selectedFlower}
        onSelect={setSelectedFlower}
      />
      <FlowerFilterChips
        filters={locationFilters}
        selected={selectedLocation}
        onSelect={setSelectedLocation}
      />
      {isPending ? (
        <View style={styles.center}>
          <Loader size="medium" type="primary" />
        </View>
      ) : (
        <ScrollView>
          {results.map((spot) => (
            <SpotListItem key={spot.id} spot={spot} onPress={handlePress} />
          ))}
          {results.length === 0 && (
            <Text style={styles.empty}>검색 결과가 없습니다.</Text>
          )}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: '#FFFFFF' },
  searchBox: { paddingHorizontal: 16, paddingVertical: 8 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', marginTop: 40 },
  empty: { textAlign: 'center', color: '#888', marginTop: 40, fontSize: 15 },
});
```

- [ ] **Step 2: 타입 체크**

```bash
cd apps/toss-mini && pnpm typecheck
```

Expected: 오류 없음

- [ ] **Step 3: 커밋**

```bash
git add apps/toss-mini/pages/search.tsx
git commit -m "feat(toss-mini): 검색 화면 — 텍스트 + 꽃 필터 검색"
```

---

## Chunk 6: 저장 화면

### Task 6.1 — SavedSpotCard 컴포넌트

**Files:**
- Create: `apps/toss-mini/src/features/saved/components/SavedSpotCard.tsx`

(SpotCard와 유사하므로 별도 테스트 없이 저장 화면에서 통합 검증)

- [ ] **Step 1: SavedSpotCard 구현**

`apps/toss-mini/src/features/saved/components/SavedSpotCard.tsx` 생성:

```tsx
import { Badge, Button } from '@toss/tds-react-native';
import React from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import type { FlowerSpot } from '@flower-map/flower-domain';

type SavedSpotCardProps = {
  spot: FlowerSpot;
  onPress: (spot: FlowerSpot) => void;
  onRemove: (id: string) => void;
};

export function SavedSpotCard({ spot, onPress, onRemove }: SavedSpotCardProps) {
  return (
    <Pressable style={styles.card} onPress={() => onPress(spot)}>
      {spot.thumbnailUrl && (
        <Image
          source={{ uri: spot.thumbnailUrl }}
          style={styles.image}
          resizeMode="cover"
        />
      )}
      <View style={styles.body}>
        <View style={styles.row}>
          <Badge size="small" type="green" badgeStyle="weak">
            {spot.flower}
          </Badge>
        </View>
        <Text style={styles.place}>{spot.place}</Text>
        <Text style={styles.meta}>{spot.location} · {spot.bloomStatus}</Text>
      </View>
      <Button
        size="tiny"
        type="danger"
        style="weak"
        onPress={() => onRemove(spot.id)}
      >
        삭제
      </Button>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginHorizontal: 16,
    marginBottom: 10,
    padding: 12,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  image: {
    width: 72,
    height: 72,
    borderRadius: 10,
    backgroundColor: '#E8F5E9',
  },
  body: { flex: 1, gap: 4 },
  row: { flexDirection: 'row' },
  place: { fontSize: 15, fontWeight: '600', color: '#142218' },
  meta: { fontSize: 12, color: '#888' },
});
```

- [ ] **Step 2: 커밋**

```bash
git add apps/toss-mini/src/features/saved/components/SavedSpotCard.tsx
git commit -m "feat(toss-mini): SavedSpotCard 컴포넌트 추가"
```

---

### Task 6.2 — 저장 화면 (`pages/saved.tsx`)

**Files:**
- Create: `apps/toss-mini/pages/saved.tsx`

- [ ] **Step 1: 저장 화면 구현**

`apps/toss-mini/pages/saved.tsx` 생성:

```tsx
import { ErrorPage, Loader, Navbar } from '@toss/tds-react-native';
import { useQueries } from '@tanstack/react-query';
import { createRoute } from '@granite-js/react-native';
import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { getSpotById, type FlowerSpot } from '@flower-map/flower-domain';

import { useStorage } from '../src/shared/hooks/useStorage';
import { SavedSpotCard } from '../src/features/saved/components/SavedSpotCard';

export const Route = createRoute('/saved', {
  component: SavedPage,
});

function SavedPage() {
  const navigation = Route.useNavigation();
  const { savedIds, remove } = useStorage();

  const spotQueries = useQueries({
    queries: savedIds.map((id) => ({
      queryKey: ['spot', id],
      queryFn: () => getSpotById(id),
      enabled: Boolean(id),
    })),
  });

  const isPending = spotQueries.some((q) => q.isPending);
  const spots = spotQueries
    .map((q) => q.data)
    .filter((s): s is FlowerSpot => s !== undefined && s !== null);

  const handlePress = (spot: FlowerSpot) => {
    navigation.navigate('/spot/:id' as never, { id: spot.id } as never);
  };

  return (
    <View style={styles.page}>
      <Navbar title="저장" />
      {isPending && savedIds.length > 0 ? (
        <View style={styles.center}>
          <Loader size="large" type="primary" />
        </View>
      ) : spots.length === 0 ? (
        <ErrorPage
          title="저장된 명소가 없어요"
          subtitle="마음에 드는 명소를 저장해보세요"
          onPressRightButton={() => navigation.navigate('/' as never)}
        />
      ) : (
        <ScrollView contentContainerStyle={styles.list}>
          {spots.map((spot) => (
            <SavedSpotCard
              key={spot.id}
              spot={spot}
              onPress={handlePress}
              onRemove={remove}
            />
          ))}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: '#F4F8F4' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  list: { paddingTop: 12, paddingBottom: 24 },
});
```

- [ ] **Step 2: 타입 체크**

```bash
cd apps/toss-mini && pnpm typecheck
```

Expected: 오류 없음

- [ ] **Step 3: 전체 테스트 통과 확인**

```bash
cd apps/toss-mini && pnpm test
```

Expected: PASS (모든 테스트)

- [ ] **Step 4: 최종 커밋**

```bash
git add apps/toss-mini/pages/saved.tsx
git commit -m "feat(toss-mini): 저장 화면 — 로컬 저장 명소 리스트"
```

---

## 완료 후 검증

```bash
# 전체 테스트
cd apps/toss-mini && pnpm test

# 타입 체크
cd apps/toss-mini && pnpm typecheck

# 개발 서버 실행 (샌드박스 앱으로 테스트)
cd apps/toss-mini && pnpm dev
```

샌드박스 앱에서 `intoss://flower-map` 실행 시 4탭 홈 화면이 표시되어야 합니다.
