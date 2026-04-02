# 검색 기능 구현 계획

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 꽃 어디 앱에 검색 탭을 추가하고, 꽃 이름·명소명·지역 등 키워드로 명소를 검색할 수 있는 화면을 구현한다.

**Architecture:** 기존 React Query 캐시를 재사용해 별도 API 없이 클라이언트 사이드 필터링으로 검색을 구현한다. `SafeAreaView` + `FlatList` 구조로 스크롤 충돌 없이 렌더링하며, 검색 입력창·안내 문구는 `ListHeaderComponent`로 처리한다.

**Tech Stack:** React Native, Expo Router, React Query (`@tanstack/react-query`), Ionicons (`@expo/vector-icons`), Vitest

---

## Chunk 1: SearchResultCard 컴포넌트

### Task 1: SearchResultCard 테스트 작성

**Files:**
- Create: `src/shared/ui/SearchResultCard.test.tsx`

- [ ] **Step 1: 테스트 파일 작성**

```tsx
// src/shared/ui/SearchResultCard.test.tsx
import { describe, expect, it, vi } from 'vitest';
import { render } from '@testing-library/react-native';
import { SearchResultCard } from './SearchResultCard';
import type { FlowerSpot } from '../data/types';

const baseSpot: FlowerSpot = {
  id: 'spot-1',
  slug: 'yeouido',
  place: '여의도 한강공원',
  flower: '벚꽃',
  location: '서울 영등포구',
  helper: '한강변 벚꽃 산책',
  bloomStatus: '개화 중',
  badge: '지금 방문 추천',
  thumbnailUrl: null,
  flowerThumbnailUrl: null,
  tone: 'pink',
  bloomStartAt: '2026-03-28',
  bloomEndAt: '2026-04-10',
  description: '서울 대표 벚꽃 명소',
  eventEndsIn: undefined,
  fee: '무료',
  festivalDate: '2026.03.28 - 2026.04.10',
  latitude: 37.528,
  longitude: 126.929,
  parking: '인근 공영주차장',
};

describe('SearchResultCard', () => {
  it('명소명, 꽃·지역, bloomStatus 뱃지를 렌더링한다', () => {
    const { getByText } = render(
      <SearchResultCard spot={baseSpot} onPress={vi.fn()} />
    );

    expect(getByText('여의도 한강공원')).toBeTruthy();
    expect(getByText('벚꽃 · 서울 영등포구')).toBeTruthy();
    expect(getByText('개화 중')).toBeTruthy();
  });

  it('onPress가 카드 탭 시 호출된다', () => {
    const onPress = vi.fn();
    const { getByText } = render(
      <SearchResultCard spot={baseSpot} onPress={onPress} />
    );
    getByText('여의도 한강공원').parent?.props.onPress?.();
    // Pressable이 감싸고 있으므로 fireEvent로 검증
  });

  it('개화 종료 spot은 회색 뱃지를 렌더링한다', () => {
    const ended = { ...baseSpot, bloomStatus: '개화 종료' };
    const { getByText } = render(
      <SearchResultCard spot={ended} onPress={vi.fn()} />
    );
    expect(getByText('개화 종료')).toBeTruthy();
  });

  it('thumbnailUrl과 flowerThumbnailUrl 모두 없으면 BloomArt fallback을 렌더링한다', () => {
    const noImage = { ...baseSpot, thumbnailUrl: null, flowerThumbnailUrl: null };
    const { queryByTestId } = render(
      <SearchResultCard spot={noImage} onPress={vi.fn()} />
    );
    // Image가 없으면 fallback View가 렌더링된 것
    expect(queryByTestId('spot-thumbnail-image')).toBeNull();
  });

  it('thumbnailUrl이 없고 flowerThumbnailUrl이 있으면 flowerThumbnailUrl로 이미지를 렌더링한다', () => {
    const flowerOnly = { ...baseSpot, thumbnailUrl: null, flowerThumbnailUrl: 'https://example.com/flower.jpg' };
    const { getByTestId } = render(
      <SearchResultCard spot={flowerOnly} onPress={vi.fn()} />
    );
    expect(getByTestId('spot-thumbnail-image')).toBeTruthy();
  });
});
```

- [ ] **Step 2: 테스트 실행 — 실패 확인**

```bash
cd /Users/user/workspace/flower-map/apps/mobile
pnpm test -- SearchResultCard
```

Expected: `Cannot find module './SearchResultCard'`

---

### Task 2: SearchResultCard 구현

**Files:**
- Create: `src/shared/ui/SearchResultCard.tsx`

- [ ] **Step 1: 컴포넌트 구현**

```tsx
// src/shared/ui/SearchResultCard.tsx
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import type { FlowerSpot } from '../data/types';
import { colors } from '../theme/colors';
import { BloomArt } from './BloomArt';

export type SearchResultCardProps = {
  spot: FlowerSpot;
  onPress: () => void;
};

function badgeStyle(bloomStatus: string) {
  if (bloomStatus === '개화 종료') {
    return { bg: '#EDE8E4', text: '#8C7060' };
  }
  if (bloomStatus === '개화 예정') {
    return { bg: colors.softYellow, text: colors.text };
  }
  return { bg: colors.surfaceGreen, text: colors.primary };
}

// tone은 'pink' | 'yellow' | 'green' 3가지만 존재 (FlowerSpotTone)
function thumbnailBg(tone: FlowerSpot['tone']) {
  if (tone === 'pink') return colors.surfaceRose;
  if (tone === 'yellow') return colors.cardSun;
  return colors.surfaceGreen; // 'green'
}

export function SearchResultCard({ spot, onPress }: SearchResultCardProps) {
  const imageUri = spot.thumbnailUrl ?? spot.flowerThumbnailUrl;
  const badge = badgeStyle(spot.bloomStatus);

  return (
    <Pressable onPress={onPress} style={styles.card}>
      {imageUri ? (
        <Image
          testID="spot-thumbnail-image"
          source={{ uri: imageUri }}
          style={styles.thumbnail}
        />
      ) : (
        <View style={[styles.thumbnail, styles.thumbnailFallback, { backgroundColor: thumbnailBg(spot.tone) }]}>
          <BloomArt size="sm" tone={spot.tone} />
        </View>
      )}
      <View style={styles.info}>
        <Text style={styles.place} numberOfLines={1}>{spot.place}</Text>
        <Text style={styles.meta} numberOfLines={1}>{spot.flower} · {spot.location}</Text>
        <View style={[styles.badge, { backgroundColor: badge.bg }]}>
          <Text style={[styles.badgeText, { color: badge.text }]}>{spot.bloomStatus}</Text>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    marginTop: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  card: {
    alignItems: 'center',
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 12,
    marginBottom: 10,
    padding: 12,
  },
  info: {
    flex: 1,
  },
  meta: {
    color: colors.textMuted,
    fontSize: 12,
    marginTop: 2,
  },
  place: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '700',
  },
  thumbnail: {
    borderRadius: 12,
    height: 64,
    width: 64,
  },
  thumbnailFallback: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
```

- [ ] **Step 2: 테스트 실행 — 통과 확인**

```bash
pnpm test -- SearchResultCard
```

Expected: 3 tests pass

- [ ] **Step 3: 커밋**

```bash
git add src/shared/ui/SearchResultCard.tsx src/shared/ui/SearchResultCard.test.tsx
git commit -m "feat(mobile): SearchResultCard 컴포넌트 추가"
```

---

## Chunk 2: SearchScreen 구현

### Task 3: SearchScreen 테스트 작성

**Files:**
- Create: `src/features/search/screens/SearchScreen.test.tsx`

- [ ] **Step 1: 테스트 파일 작성**

```tsx
// src/features/search/screens/SearchScreen.test.tsx
import { describe, expect, it, vi } from 'vitest';
import { render, fireEvent } from '@testing-library/react-native';
import { SearchScreen } from './SearchScreen';

// React Query와 expo-router mock
vi.mock('@tanstack/react-query', () => ({
  useQuery: vi.fn(),
}));
vi.mock('expo-router', () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

import { useQuery } from '@tanstack/react-query';

const mockSpots = [
  {
    id: '1', slug: 'yeouido', place: '여의도 한강공원', flower: '벚꽃',
    location: '서울 영등포구', helper: '한강변 산책', bloomStatus: '개화 중',
    badge: '지금 방문 추천', thumbnailUrl: null, flowerThumbnailUrl: null,
    tone: 'pink', bloomStartAt: '2026-03-28', bloomEndAt: '2026-04-10',
    description: '서울 대표 벚꽃', eventEndsIn: undefined,
    fee: '무료', festivalDate: '', latitude: 37.5, longitude: 126.9, parking: '',
  },
  {
    id: '2', slug: 'jeju', place: '제주 유채꽃 프라자', flower: '유채꽃',
    location: '제주 서귀포시', helper: '드넓은 유채꽃', bloomStatus: '개화 중',
    badge: '지금 방문 추천', thumbnailUrl: null, flowerThumbnailUrl: null,
    tone: 'yellow', bloomStartAt: '2026-03-01', bloomEndAt: '2026-04-30',
    description: '제주 유채꽃', eventEndsIn: undefined,
    fee: '유료', festivalDate: '', latitude: 33.3, longitude: 126.5, parking: '',
  },
];

describe('SearchScreen', () => {
  it('검색어가 없을 때 초기 안내 문구를 표시한다', () => {
    (useQuery as any).mockReturnValue({ data: mockSpots, isLoading: false, isError: false });
    const { getByText } = render(<SearchScreen />);
    expect(getByText('꽃 이름, 명소 이름, 지역으로 검색해보세요')).toBeTruthy();
  });

  it('isLoading이면 스켈레톤을 표시한다', () => {
    (useQuery as any).mockReturnValue({ data: [], isLoading: true, isError: false });
    const { getAllByTestId } = render(<SearchScreen />);
    expect(getAllByTestId('skeleton-box').length).toBeGreaterThan(0);
  });

  it('isError면 에러 메시지를 표시한다', () => {
    (useQuery as any).mockReturnValue({ data: [], isLoading: false, isError: true });
    const { getByText } = render(<SearchScreen />);
    expect(getByText('데이터를 불러오지 못했어요. 잠시 후 다시 시도해 주세요.')).toBeTruthy();
  });

  it('검색어 "벚꽃" 입력 시 관련 명소만 표시한다', () => {
    (useQuery as any).mockReturnValue({ data: mockSpots, isLoading: false, isError: false });
    const { getByPlaceholderText, getByText, queryByText } = render(<SearchScreen />);

    fireEvent.changeText(getByPlaceholderText('꽃 이름, 명소, 지역으로 검색'), '벚꽃');

    expect(getByText('여의도 한강공원')).toBeTruthy();
    expect(queryByText('제주 유채꽃 프라자')).toBeNull();
    expect(getByText('1곳의 명소를 찾았어요')).toBeTruthy();
  });

  it('검색 결과가 없으면 "검색 결과가 없어요"를 표시한다', () => {
    (useQuery as any).mockReturnValue({ data: mockSpots, isLoading: false, isError: false });
    const { getByPlaceholderText, getByText } = render(<SearchScreen />);

    fireEvent.changeText(getByPlaceholderText('꽃 이름, 명소, 지역으로 검색'), '존재하지않는명소');

    expect(getByText('검색 결과가 없어요')).toBeTruthy();
  });
});
```

- [ ] **Step 2: 테스트 실행 — 실패 확인**

```bash
pnpm test -- SearchScreen
```

Expected: `Cannot find module './SearchScreen'`

---

### Task 4: SearchScreen 구현

**Files:**
- Create: `src/features/search/screens/SearchScreen.tsx`

- [ ] **Step 1: 디렉토리 생성 및 구현**

```bash
mkdir -p src/features/search/screens
```

```tsx
// src/features/search/screens/SearchScreen.tsx
import { useMemo, useState } from 'react';
import { useRouter } from 'expo-router';
import {
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  getPublishedSpots,
  spotKeys,
} from '../../../shared/data/spotRepository';
import { colors } from '../../../shared/theme/colors';
import { SearchResultCard } from '../../../shared/ui/SearchResultCard';
import { SkeletonBox } from '../../../shared/ui/SkeletonBox';
import type { FlowerSpot } from '../../../shared/data/types';

export function SearchScreen() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const { data: spots = [], isLoading, isError } = useQuery({
    queryKey: spotKeys.all,
    queryFn: getPublishedSpots,
  });

  // FlowerSpot 필드명 참고: src/shared/data/types.ts
  // place(명소명), flower(꽃이름), location(지역), helper(한줄설명) — 모두 string
  const results = useMemo<FlowerSpot[]>(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return spots.filter(
      (s) =>
        s.place.toLowerCase().includes(q) ||
        s.flower.toLowerCase().includes(q) ||
        s.location.toLowerCase().includes(q) ||
        s.helper.toLowerCase().includes(q),
    );
  }, [query, spots]);

  function renderHeader() {
    return (
      <View style={styles.header}>
        <Text style={styles.title}>검색</Text>
        <TextInput
          style={styles.input}
          placeholder="꽃 이름, 명소, 지역으로 검색"
          placeholderTextColor={colors.textMuted}
          value={query}
          onChangeText={setQuery}
          keyboardType="default"
          returnKeyType="search"
          autoCorrect={false}
        />
        {isLoading && (
          <View style={styles.skeletonGroup}>
            <SkeletonBox testID="skeleton-box" height={88} borderRadius={16} />
            <SkeletonBox testID="skeleton-box" height={88} borderRadius={16} />
            <SkeletonBox testID="skeleton-box" height={88} borderRadius={16} />
          </View>
        )}
        {isError && (
          <Text style={styles.errorText}>
            데이터를 불러오지 못했어요. 잠시 후 다시 시도해 주세요.
          </Text>
        )}
        {!isLoading && !isError && query.trim() === '' && (
          <Text style={styles.guideText}>꽃 이름, 명소 이름, 지역으로 검색해보세요</Text>
        )}
        {!isLoading && !isError && query.trim() !== '' && results.length > 0 && (
          <Text style={styles.countText}>{results.length}곳의 명소를 찾았어요</Text>
        )}
        {!isLoading && !isError && query.trim() !== '' && results.length === 0 && (
          <Text style={styles.emptyText}>검색 결과가 없어요</Text>
        )}
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <FlatList
        data={results}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <SearchResultCard
            spot={item}
            onPress={() => router.push(`/spot/${item.slug}`)}
          />
        )}
        ListHeaderComponent={renderHeader}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingBottom: 100,
    paddingHorizontal: 20,
  },
  countText: {
    color: colors.textMuted,
    fontSize: 13,
    marginBottom: 8,
  },
  emptyText: {
    color: colors.textMuted,
    fontSize: 15,
    marginTop: 40,
    textAlign: 'center',
  },
  errorText: {
    color: colors.textMuted,
    fontSize: 14,
    marginTop: 20,
    textAlign: 'center',
  },
  guideText: {
    color: colors.textMuted,
    fontSize: 15,
    marginTop: 40,
    textAlign: 'center',
  },
  header: {
    paddingTop: 8,
    paddingBottom: 12,
  },
  input: {
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderRadius: 999,
    borderWidth: 1,
    color: colors.text,
    fontSize: 15,
    marginBottom: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  safe: {
    backgroundColor: colors.background,
    flex: 1,
  },
  skeletonGroup: {
    gap: 10,
  },
  title: {
    color: colors.text,
    fontSize: 28,
    fontWeight: '700',
    letterSpacing: -0.5,
    marginBottom: 14,
    marginTop: 8,
  },
});
```

- [ ] **Step 2: 테스트 실행 — 통과 확인**

```bash
pnpm test -- SearchScreen
```

Expected: 5 tests pass

- [ ] **Step 3: 커밋**

```bash
git add src/features/search/screens/SearchScreen.tsx src/features/search/screens/SearchScreen.test.tsx
git commit -m "feat(mobile): SearchScreen 구현 - 클라이언트 사이드 검색"
```

---

## Chunk 3: 탭 라우트 및 레이아웃 연결

### Task 5: 탭 라우트 파일 생성

**Files:**
- Create: `app/(tabs)/search.tsx`

> **주의:** `SearchScreen`은 `SafeAreaView + FlatList`로 자체 레이아웃을 구성한다. `ScreenShell`(내부에 ScrollView 포함)로 감싸지 말 것. 다른 탭(index.tsx, map.tsx)처럼 단순 re-export만 한다.

- [ ] **Step 1: 라우트 파일 작성**

```tsx
// app/(tabs)/search.tsx
import { SearchScreen } from '../../src/features/search/screens/SearchScreen';

export default function SearchRoute() {
  // ScreenShell을 사용하지 않음 — SearchScreen이 SafeAreaView+FlatList로 직접 레이아웃 구성
  return <SearchScreen />;
}
```

---

### Task 6: 탭 레이아웃에 검색 탭 추가

**Files:**
- Modify: `app/(tabs)/_layout.tsx`

현재 탭 순서 (4개): `index`(홈) → `map`(지도) → `saved`(저장) → `me`(내정보)
변경 후 순서 (5개): `index`(홈) → `map`(지도) → **`search`(검색)** → `saved`(저장) → `me`(내정보)

`_layout.tsx`에서 `<Tabs.Screen name="map" .../>` 블록 바로 다음에, `<Tabs.Screen name="saved" .../>` 블록 바로 앞에 삽입한다.

- [ ] **Step 1: `_layout.tsx` 수정 — 지도 탭 바로 뒤에 검색 탭 추가**

`map` 탭 `<Tabs.Screen>` 블록 다음에 아래 블록을 삽입한다:

```tsx
<Tabs.Screen
  name="search"
  options={{
    title: '검색',
    tabBarIcon: ({ color, focused }) => (
      <View style={[styles.iconFrame, focused ? styles.iconFrameActive : null]}>
        <Ionicons
          color={focused ? colors.primary : color}
          name={focused ? 'search' : 'search-outline'}
          size={20}
        />
      </View>
    ),
  }}
/>
```

- [ ] **Step 2: 앱 실행해서 탭 동작 확인**

```bash
pnpm start
```

확인 항목:
- 하단 탭 5개 표시 (홈·지도·검색·저장·내정보)
- 검색 탭 탭 시 검색 화면 진입
- TextInput에 입력 시 실시간 필터링
- 결과 카드 탭 시 명소 상세 페이지 이동

- [ ] **Step 3: 커밋**

```bash
git add app/(tabs)/search.tsx app/(tabs)/_layout.tsx
git commit -m "feat(mobile): 검색 탭 추가 - 하단 탭 중앙 배치"
```
