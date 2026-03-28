# 지도 캐로셀 + 내 위치 아이콘 Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** MapScreen 하단 summaryPanel을 가로 스크롤 캐로셀로 교체하고, 내 위치 버튼 📍 이모지를 MaterialIcons "my-location" 아이콘으로 교체한다.

**Architecture:** 현재 summaryPanel의 내용을 SpotSummaryCard 컴포넌트로 분리하고, FlatList로 감싸 스와이프 캐로셀을 구현한다. snapToInterval + decelerationRate="fast" 조합으로 카드 단위 스냅을 구현하며, 마커 탭/내 위치/딥링크 각각의 진입점에서 FlatList.scrollToIndex를 호출해 카드와 지도 카메라를 항상 동기화한다.

**Tech Stack:** React Native FlatList, @expo/vector-icons MaterialIcons, Dimensions API, useRef, useCallback, ViewToken

---

## 파일 구조

| 파일 | 역할 |
|------|------|
| `apps/mobile/src/features/map/components/SpotSummaryCard.tsx` | **신규** — 카드 1장 UI (이미지·뱃지·제목·설명·버튼). 현재 summaryPanel 내용 이관. |
| `apps/mobile/src/features/map/screens/MapScreen.tsx` | **수정** — summaryPanel → FlatList 캐로셀, 내 위치 아이콘 교체, 관련 상태·핸들러 업데이트 |

테스트 파일은 별도로 생성하지 않는다. React Native 컴포넌트는 네이티브 런타임 없이 단위 테스트가 어려우며, 이 프로젝트의 기존 패턴(순수 함수만 테스트)에 따라 UI 동작은 디바이스/시뮬레이터에서 수동 검증한다.

---

## Chunk 1: SpotSummaryCard 컴포넌트 신규 생성

### Task 1: SpotSummaryCard.tsx 생성

**Files:**
- Create: `apps/mobile/src/features/map/components/SpotSummaryCard.tsx`

현재 `MapScreen.tsx`의 `summaryPanel` View (라인 277~313)를 독립 컴포넌트로 추출한다. `useRouter` + `Linking`을 컴포넌트 내부에서 직접 사용한다.

- [ ] **Step 1: 파일 생성**

```tsx
// apps/mobile/src/features/map/components/SpotSummaryCard.tsx
import { useRouter } from 'expo-router';
import { Dimensions, ImageBackground, Linking, Pressable, StyleSheet, Text, View } from 'react-native';

import type { FlowerSpot } from '../../../shared/data/types';
import { resolveSpotImage } from '../../../shared/lib/resolveSpotImage';
import { colors } from '../../../shared/theme/colors';
import { BloomArt } from '../../../shared/ui/BloomArt';

const CARD_WIDTH = Dimensions.get('window').width - 40;

type SpotSummaryCardProps = {
  spot: FlowerSpot;
};

export function SpotSummaryCard({ spot }: SpotSummaryCardProps) {
  const router = useRouter();
  const spotImage = resolveSpotImage(spot);

  return (
    <View style={styles.card}>
      {spotImage ? (
        <ImageBackground imageStyle={styles.imageInner} source={spotImage} style={styles.image}>
          <View style={styles.imageShade} />
        </ImageBackground>
      ) : (
        <View style={styles.artContainer}>
          <BloomArt size="md" tone="pink" />
        </View>
      )}
      <View style={styles.body}>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{spot.badge}</Text>
        </View>
        <Text style={styles.title}>{spot.place}</Text>
        <Text style={styles.meta}>
          {spot.flower} · {spot.location}
        </Text>
        <Text numberOfLines={2} style={styles.description}>
          {spot.description}
        </Text>
        <View style={styles.actions}>
          <Pressable onPress={() => router.push(`/spot/${spot.slug}`)} style={styles.ghostButton}>
            <Text style={styles.ghostButtonText}>상세 보기</Text>
          </Pressable>
          <Pressable
            onPress={() => {
              const url = `nmap://route/car?dlat=${spot.latitude}&dlng=${spot.longitude}&dname=${encodeURIComponent(spot.place)}&appname=com.kkoteodi.mobile`;
              Linking.openURL(url).catch(() =>
                Linking.openURL(
                  `https://map.naver.com/p/directions/-/-/${spot.longitude},${spot.latitude},${encodeURIComponent(spot.place)}/-/car`,
                ),
              );
            }}
            style={styles.directionsButton}
          >
            <Text style={styles.directionsButtonText}>길찾기</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  actions: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 10,
    marginTop: 14,
  },
  artContainer: {
    alignItems: 'center',
    backgroundColor: colors.cardRose,
    justifyContent: 'center',
    minHeight: 160,
  },
  badge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.72)',
    borderRadius: 999,
    marginBottom: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  badgeText: {
    color: colors.secondary,
    fontSize: 12,
    fontWeight: '700',
  },
  body: {
    padding: 18,
  },
  card: {
    backgroundColor: colors.cardRose,
    borderColor: '#F2D4DA',
    borderRadius: 30,
    borderWidth: 1,
    overflow: 'hidden',
    width: CARD_WIDTH,
  },
  description: {
    color: colors.textMuted,
    fontSize: 14,
    lineHeight: 20,
    marginTop: 8,
  },
  directionsButton: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: 999,
    flex: 1,
    paddingVertical: 11,
  },
  directionsButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  ghostButton: {
    alignItems: 'center',
    borderColor: colors.border,
    borderRadius: 999,
    borderWidth: 1,
    flex: 1,
    paddingVertical: 11,
  },
  ghostButtonText: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '700',
  },
  image: {
    height: 156,
    width: '100%',
  },
  imageInner: {
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
  },
  imageShade: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  meta: {
    color: colors.textMuted,
    fontSize: 14,
    marginTop: 4,
  },
  title: {
    color: colors.text,
    fontSize: 24,
    fontWeight: '700',
  },
});
```

- [ ] **Step 2: TypeScript 컴파일 오류 없는지 확인**

```bash
cd apps/mobile && npx tsc --noEmit 2>&1 | head -30
```

Expected: 오류 없음 (또는 이 파일과 무관한 기존 오류만)

- [ ] **Step 3: 커밋**

```bash
git add apps/mobile/src/features/map/components/SpotSummaryCard.tsx
git commit -m "feat(mobile): SpotSummaryCard 컴포넌트 추출 (지도 캐로셀 카드)"
```

---

## Chunk 2: MapScreen 캐로셀 + 아이콘 교체

### Task 2: MapScreen.tsx 전면 업데이트

**Files:**
- Modify: `apps/mobile/src/features/map/screens/MapScreen.tsx`

현재 파일에서 아래 변경을 모두 적용한다:

1. 외부 상수 선언 (`CARD_WIDTH`, `CARD_GAP`, `viewabilityConfig`)
2. `flatListRef` + `handleViewableChange` 추가
3. `handleSelectSpot` — `findIndex` + `scrollToIndex` 추가
4. `handleLocationPress` — `findIndex` + `scrollToIndex` 추가
5. `handleFlowerChange` — visibleSpots 재계산 + `setSelectedSpotSlug` + `scrollToOffset(0)`
6. 랜덤 fallback `useEffect` 제거
7. `initialSpotSlug` useEffect 교체 (spots 의존성 + `scrollToIndex`)
8. `floatingAction` 버튼 및 스타일 제거
9. `summaryPanel` → FlatList(SpotSummaryCard) 교체
10. 📍 → MaterialIcons + `ActivityIndicator`

- [ ] **Step 1: import 구문 업데이트**

파일 상단 import를 아래로 교체한다. 제거 대상: `ImageBackground`, `Linking`, `ScrollView`, `useRouter`, `BloomArt`, `resolveSpotImage`. 추가 대상: `useCallback`, `useRef`, `ActivityIndicator`, `Dimensions`, `FlatList`, `ViewToken`, `MaterialIcons`, `SpotSummaryCard`.

> `useRouter`는 MapScreen에서 더 이상 불필요하다 — `floatingAction` 버튼 제거 후 `router`를 사용하는 곳이 없으며, `SpotSummaryCard`가 자체 `useRouter`를 사용한다. `BloomArt`도 `SpotSummaryCard`로 이관되어 MapScreen에서 불필요하다.

```tsx
import { useCallback, useEffect, useRef, useState } from 'react';
import Constants, { ExecutionEnvironment } from 'expo-constants';
import { useLocalSearchParams } from 'expo-router';
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  UIManager,
  View,
} from 'react-native';
import type { ViewToken } from 'react-native';

import { MaterialIcons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';

import {
  deriveFlowerLabels,
  getPublishedSpots,
  spotKeys,
} from '../../../shared/data/spotRepository';
import type { FlowerSpot } from '../../../shared/data/types';
import { colors } from '../../../shared/theme/colors';
import { ScreenShell } from '../../../shared/ui/ScreenShell';
import { SkeletonBox } from '../../../shared/ui/SkeletonBox';
import {
  type Coords,
  getNearbySpots,
  requestAndGetLocation,
} from '../../../shared/lib/location';
import { SpotSummaryCard } from '../components/SpotSummaryCard';
```

- [ ] **Step 2: 파일 상단 외부 상수 추가**

`defaultCamera` 상수 아래에 추가한다:

```ts
const CARD_WIDTH = Dimensions.get('window').width - 40;
const CARD_GAP = 10;
const viewabilityConfig = { itemVisiblePercentThreshold: 50 };
```

- [ ] **Step 3: MapScreen 컴포넌트 내부 — `router` 선언 제거**

현재 MapScreen 컴포넌트 상단의 `const router = useRouter();` 선언을 제거한다.
`router`는 `floatingAction` 버튼(Step 8에서 제거)과 summaryPanel(Step 10에서 제거)에서만 사용되었으며, 이후 SpotSummaryCard가 자체 `useRouter`를 가진다.

- [ ] **Step 4: MapScreen 컴포넌트 내부 — ref + handleViewableChange 추가**

`const [locationLoading, setLocationLoading] = useState(false);` 바로 다음에 추가:

```ts
const flatListRef = useRef<FlatList>(null);

const handleViewableChange = useCallback(
  ({ viewableItems }: { viewableItems: ViewToken[] }) => {
    if (viewableItems.length > 0) {
      setSelectedSpotSlug((viewableItems[0].item as FlowerSpot).slug);
    }
  },
  [],
);
```

- [ ] **Step 5: handleSelectSpot 교체**

기존:
```ts
const handleSelectSpot = (spotSlug: string) => {
  setUserCameraCoords(null);
  setSelectedSpotSlug(spotSlug);
};
```

교체:
```ts
const handleSelectSpot = (spotSlug: string) => {
  setUserCameraCoords(null);
  setSelectedSpotSlug(spotSlug);
  const index = visibleSpots.findIndex((s) => s.slug === spotSlug);
  if (index !== -1) {
    flatListRef.current?.scrollToIndex({ index, animated: true });
  }
};
```

- [ ] **Step 6: handleFlowerChange 교체**

기존:
```ts
const handleFlowerChange = (flower: string) => {
  setSelectedFlower(flower);
  setUserCameraCoords(null);
};
```

교체:
```ts
const handleFlowerChange = (flower: string) => {
  setSelectedFlower(flower);
  setUserCameraCoords(null);
  const newVisibleSpots = flower === '전체' ? spots : spots.filter((s) => s.flower === flower);
  const firstSlug = newVisibleSpots[0]?.slug ?? '';
  setSelectedSpotSlug(firstSlug);
  flatListRef.current?.scrollToOffset({ offset: 0, animated: false });
};
```

- [ ] **Step 7: handleLocationPress 교체**

기존 `if (nearest) setSelectedSpotSlug(nearest.spot.slug);` 부분을 교체:

```ts
const handleLocationPress = async () => {
  if (locationLoading) return;
  setLocationLoading(true);
  const result = await requestAndGetLocation();
  if (result !== 'denied' && result !== null) {
    setUserCameraCoords(result);
    const pool = visibleSpots.length > 0 ? visibleSpots : spots;
    const nearest = getNearbySpots(pool, result, 1)[0];
    if (nearest) {
      setSelectedSpotSlug(nearest.spot.slug);
      const index = pool.findIndex((s) => s.slug === nearest.spot.slug);
      if (index !== -1) {
        flatListRef.current?.scrollToIndex({ index, animated: true });
      }
    }
  } else {
    setUserCameraCoords(null);
  }
  setLocationLoading(false);
};
```

- [ ] **Step 8: 기존 useEffect 두 개 교체**

**제거 대상 1** (랜덤 fallback, 라인 185~190):
```ts
// 제거
useEffect(() => {
  if (!visibleSpots.some((spot) => spot.slug === selectedSpotSlug) && visibleSpots.length > 0) {
    const randomSpot = visibleSpots[Math.floor(Math.random() * visibleSpots.length)];
    setSelectedSpotSlug(randomSpot.slug);
  }
}, [selectedSpotSlug, visibleSpots]);
```

**교체 대상** (initialSpotSlug useEffect, 라인 149~154):
```ts
// 기존
useEffect(() => {
  if (initialSpotSlug) {
    setSelectedSpotSlug(initialSpotSlug);
    setSelectedFlower('전체');
  }
}, [initialSpotSlug]);
```

아래로 교체:
```ts
useEffect(() => {
  if (initialSpotSlug && spots.length > 0) {
    setSelectedSpotSlug(initialSpotSlug);
    setSelectedFlower('전체');
    const index = spots.findIndex((s) => s.slug === initialSpotSlug);
    if (index !== -1) {
      setTimeout(() => {
        flatListRef.current?.scrollToIndex({ index, animated: false });
      }, 0);
    }
  }
}, [initialSpotSlug, spots]);
```

- [ ] **Step 9: floatingAction 버튼 및 관련 스타일 제거**

JSX에서 아래 블록을 제거한다:
```tsx
// 제거
<Pressable onPress={() => router.push(`/spot/${selectedSpot.slug}`)} style={styles.floatingAction}>
  <Text style={styles.floatingActionText}>상세</Text>
</Pressable>
```

`styles.floatingAction`, `styles.floatingActionText` 스타일 객체도 제거한다.

- [ ] **Step 10: 📍 → MaterialIcons 교체**

기존:
```tsx
<Text style={styles.floatingLocationButtonText}>
  {locationLoading ? '...' : '📍'}
</Text>
```

교체:
```tsx
{locationLoading ? (
  <ActivityIndicator color={colors.textMuted} size="small" />
) : (
  <MaterialIcons color={colors.text} name="my-location" size={20} />
)}
```

스타일에서 `floatingLocationButtonText` 제거, `floatingLocationButton`에 `alignItems: 'center', justifyContent: 'center'` 추가:

```ts
floatingLocationButton: {
  alignItems: 'center',
  backgroundColor: '#FFFFFF',
  borderRadius: 999,
  bottom: 60,
  height: 44,
  justifyContent: 'center',
  position: 'absolute',
  right: 16,
  width: 44,
},
```

- [ ] **Step 11: summaryPanel → FlatList 캐로셀로 교체**

기존 `<View style={styles.summaryPanel}>...</View>` (라인 277~313) 전체를 아래로 교체한다:

```tsx
<View style={{ paddingHorizontal: 20 }}>
  <FlatList
    ref={flatListRef}
    data={visibleSpots}
    decelerationRate="fast"
    getItemLayout={(_data, index) => ({
      index,
      length: CARD_WIDTH + CARD_GAP,
      offset: (CARD_WIDTH + CARD_GAP) * index,
    })}
    horizontal
    ItemSeparatorComponent={() => <View style={{ width: CARD_GAP }} />}
    keyExtractor={(item) => item.slug}
    ListEmptyComponent={
      <View style={{ alignItems: 'center', paddingVertical: 20, width: CARD_WIDTH }}>
        <Text style={{ color: colors.textMuted }}>표시할 명소가 없습니다.</Text>
      </View>
    }
    onScrollToIndexFailed={(info) => {
      setTimeout(() => {
        flatListRef.current?.scrollToIndex({ index: info.index, animated: true });
      }, 100);
    }}
    onViewableItemsChanged={handleViewableChange}
    renderItem={({ item }) => <SpotSummaryCard spot={item} />}
    showsHorizontalScrollIndicator={false}
    snapToInterval={CARD_WIDTH + CARD_GAP}
    viewabilityConfig={viewabilityConfig}
  />
</View>
```

기존 `styles.summaryPanel`, `styles.summaryActions`, `styles.summaryArt`, `styles.summaryBadge`, `styles.summaryBadgeText`, `styles.summaryBody`, `styles.summaryCopy`, `styles.summaryGhostButton`, `styles.summaryGhostButtonText`, `styles.summaryImage`, `styles.summaryImageInner`, `styles.summaryImageShade`, `styles.summaryMeta`, `styles.summaryTitle`, `styles.summaryDirectionsButton`, `styles.summaryDirectionsButtonText` 스타일 모두 제거한다.

`spotImage` 계산을 제거한다 (summaryPanel에서만 사용하던 변수):
```ts
// 제거
const spotImage = selectedSpot ? resolveSpotImage(selectedSpot) : null;
```

> **⚠️ 주의**: `selectedSpot` 선언(기존 라인 157)은 **반드시 유지**한다. `mapOverlay`의 `selectedSpot.place`, `selectedSpot.helper`와 `NativeMapCanvas`의 `selectedSpotSlug={selectedSpot.slug}` prop에서 여전히 사용된다.
> ```ts
> // 유지 — 제거하지 말 것
> const selectedSpot = visibleSpots.find((spot) => spot.slug === selectedSpotSlug) ?? visibleSpots[0] ?? spots[0];
> ```

`resolveSpotImage` import도 제거한다 (`spotImage` 줄을 제거하면 더 이상 사용되지 않음).

- [ ] **Step 12: TypeScript 컴파일 오류 없는지 확인**

```bash
cd apps/mobile && npx tsc --noEmit 2>&1 | head -40
```

Expected: 오류 없음 (또는 이 파일과 무관한 기존 오류만)

- [ ] **Step 13: 커밋**

```bash
git add apps/mobile/src/features/map/screens/MapScreen.tsx
git commit -m "feat(mobile): 지도 캐로셀 + MaterialIcons 내 위치 아이콘 적용

- summaryPanel → FlatList 가로 스크롤 캐로셀 (SpotSummaryCard)
- snapToInterval + decelerationRate=fast로 카드 단위 스냅
- 마커 탭/내 위치/딥링크 진입 시 scrollToIndex 연동
- 필터 변경 시 첫 번째 카드로 리셋 (race condition 방지)
- 랜덤 fallback useEffect 제거
- floatingAction(상세) 버튼 제거 (카드 내 상세보기 버튼으로 대체)
- 📍 이모지 → MaterialIcons my-location 아이콘"
```

---

## 수동 검증 체크리스트

디바이스/시뮬레이터에서 아래 동작을 확인한다:

- [ ] 지도 화면 진입 시 캐로셀에 명소 카드들이 표시됨
- [ ] 카드를 좌우로 스와이프하면 지도 카메라가 해당 명소로 이동함
- [ ] 지도 마커를 탭하면 해당 카드로 캐로셀이 자동 스크롤됨
- [ ] 꽃 필터 변경 시 첫 번째 카드로 리셋되고 지도도 이동함
- [ ] 내 위치 버튼 탭 시 가장 가까운 명소 카드로 스크롤됨
- [ ] 내 위치 아이콘이 📍 → MaterialIcons my-location으로 변경됨
- [ ] 로딩 중 ActivityIndicator 표시됨
- [ ] SpotDetailScreen에서 "지도에서 보기" 탭 → 해당 카드가 선택된 상태로 진입됨
- [ ] 카드의 "상세 보기" 버튼 → SpotDetailScreen으로 이동
- [ ] 카드의 "길찾기" 버튼 → 네이버 지도 앱 딥링크 작동
