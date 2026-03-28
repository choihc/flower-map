# 지도 캐로셀 + 내 위치 아이콘 설계 문서

**날짜**: 2026-03-28
**상태**: 확정

---

## 개요

MapScreen 하단의 단일 summaryPanel을 가로 스크롤 캐로셀로 교체하여 여러 명소를 탐색할 수 있게 한다.
내 위치 버튼의 📍 이모지를 `MaterialIcons "my-location"` 아이콘으로 교체한다.

---

## 1. 캐로셀 설계

### 현재 구조

```
<View style={styles.summaryPanel}>   ← 선택된 spot 1개 고정 표시
  이미지 / 뱃지 / 이름 / 설명 / 버튼
</View>
```

### 변경 후 구조

```tsx
// 파일 상단 외부 상수 (컴포넌트 밖에 선언)
const CARD_WIDTH = Dimensions.get('window').width - 40; // 좌우 패딩 20씩
const CARD_GAP = 10;
const viewabilityConfig = { itemVisiblePercentThreshold: 50 };

// 컴포넌트 내부
const flatListRef = useRef<FlatList>(null);

// FlatList를 패딩 래퍼 View로 감싸서 contentContainerStyle paddingHorizontal 없이 정확한 snap 정렬 유지
<View style={{ paddingHorizontal: 20 }}>
  <FlatList
    ref={flatListRef}
    horizontal
    data={visibleSpots}
    renderItem={({ item }) => <SpotSummaryCard spot={item} />}
    keyExtractor={(item) => item.slug}
    snapToInterval={CARD_WIDTH + CARD_GAP}
    decelerationRate="fast"
    showsHorizontalScrollIndicator={false}
    ItemSeparatorComponent={() => <View style={{ width: CARD_GAP }} />}
    onViewableItemsChanged={handleViewableChange}
    viewabilityConfig={viewabilityConfig}
    getItemLayout={(_data, index) => ({
      length: CARD_WIDTH + CARD_GAP,
      offset: (CARD_WIDTH + CARD_GAP) * index,
      index,
    })}
    onScrollToIndexFailed={(info) => {
      setTimeout(() => {
        flatListRef.current?.scrollToIndex({ index: info.index, animated: true });
      }, 100);
    }}
    ListEmptyComponent={
      <View style={{ width: CARD_WIDTH, alignItems: 'center', paddingVertical: 20 }}>
        <Text style={{ color: colors.textMuted }}>표시할 명소가 없습니다.</Text>
      </View>
    }
  />
</View>
```

> **주의**: `pagingEnabled`는 사용하지 않는다. `pagingEnabled`는 window 너비 단위로 페이징하므로 카드 너비(`CARD_WIDTH`)와 경계가 맞지 않아 스와이프 후 카드가 어중간한 위치에 멈춘다. 대신 `snapToInterval={CARD_WIDTH + CARD_GAP}` + `decelerationRate="fast"` 조합을 사용한다.

> **패딩 처리**: `contentContainerStyle={{ paddingHorizontal: 20 }}`을 사용하면 카드 시작 위치가 20px 밀려 snap 경계(0, CARD_WIDTH+GAP, ...)와 어긋난다. 대신 FlatList를 `paddingHorizontal: 20`인 View로 감싸고, contentContainerStyle에는 패딩을 넣지 않는다. 이렇게 하면 첫 번째 카드가 offset 0에서 정확히 스냅된다.

### onViewableItemsChanged 안정성

`onViewableItemsChanged`에 인라인 함수를 전달하면 렌더마다 새 참조가 생성되어 FlatList 경고/크래시가 발생한다. `useCallback`으로 감싸고, `viewabilityConfig`는 컴포넌트 외부 상수로 선언한다:

```ts
const handleViewableChange = useCallback(
  ({ viewableItems }: { viewableItems: ViewToken[] }) => {
    if (viewableItems.length > 0) {
      setSelectedSpotSlug(viewableItems[0].item.slug);
    }
  },
  [],
);
```

### 동작 연동

**카드 스와이프** → `onViewableItemsChanged` → `setSelectedSpotSlug(item.slug)` → 지도 카메라 이동 + 마커 변경

**마커 탭** → `handleSelectSpot(slug)`:

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

**내 위치 버튼 → 가장 가까운 spot 선택 + 캐로셀 스크롤**:

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

**initialSpotSlug 딥링크 → 해당 카드로 스크롤**:

기존 `initialSpotSlug` useEffect를 아래와 같이 교체한다. `spots`가 로드된 후에야 FlatList가 렌더되므로 `spots` 의존성을 함께 포함한다:

```ts
useEffect(() => {
  if (initialSpotSlug && spots.length > 0) {
    setSelectedSpotSlug(initialSpotSlug);
    setSelectedFlower('전체');
    const index = spots.findIndex((s) => s.slug === initialSpotSlug);
    if (index !== -1) {
      // 레이아웃 완성 후 스크롤되도록 setTimeout 사용
      setTimeout(() => {
        flatListRef.current?.scrollToIndex({ index, animated: false });
      }, 0);
    }
  }
}, [initialSpotSlug, spots]);
```

**필터 변경** → 새 visibleSpots 계산 후 첫 번째 카드로 리셋:

```ts
const handleFlowerChange = (flower: string) => {
  setSelectedFlower(flower);
  setUserCameraCoords(null);
  // 필터 변경 시점에 새 visibleSpots를 직접 계산하여 즉시 리셋
  const newVisibleSpots = flower === '전체' ? spots : spots.filter((s) => s.flower === flower);
  const firstSlug = newVisibleSpots[0]?.slug ?? '';
  setSelectedSpotSlug(firstSlug);
  flatListRef.current?.scrollToOffset({ offset: 0, animated: false });
};
```

### 기존 랜덤 fallback useEffect 제거

현재 MapScreen의 아래 useEffect는 제거한다:

```ts
// 제거 대상
useEffect(() => {
  if (!visibleSpots.some((spot) => spot.slug === selectedSpotSlug) && visibleSpots.length > 0) {
    const randomSpot = visibleSpots[Math.floor(Math.random() * visibleSpots.length)];
    setSelectedSpotSlug(randomSpot.slug);
  }
}, [selectedSpotSlug, visibleSpots]);
```

이 역할은 `handleFlowerChange`에서 명시적으로 첫 번째 spot을 선택하는 로직으로 대체한다.

### 기존 floatingAction("상세") 버튼 제거

캐로셀 카드 내부에 이미 "상세 보기" 버튼이 있으므로, 지도 위의 `floatingAction` 버튼과 관련 스타일(`floatingAction`, `floatingActionText`)을 제거한다.

### getItemLayout + scrollToIndex

`scrollToIndex`가 정상 작동하려면 `getItemLayout`으로 각 아이템의 크기와 오프셋을 미리 알려줘야 한다. 레이아웃 계산 전 호출 시 `onScrollToIndexFailed`에서 setTimeout으로 재시도한다.

---

## 2. SpotSummaryCard 컴포넌트

**파일 위치**: `apps/mobile/src/features/map/components/SpotSummaryCard.tsx`

### Props

```ts
type SpotSummaryCardProps = {
  spot: FlowerSpot;
};
```

### 내부 구성

현재 summaryPanel의 내용을 그대로 이관한다:
- 상단 이미지 (height 156, 없으면 BloomArt) — `resolveSpotImage(spot)` 사용
- 뱃지 / 명소명 / 위치(`spot.flower · spot.location`) / 설명(`spot.description`)
- "상세 보기" 버튼 → `router.push(\`/spot/${spot.slug}\`)` (`useRouter()` 카드 내부에서 직접 사용)
- "길찾기" 버튼 → `Linking.openURL` (현재 MapScreen summaryPanel과 동일한 nmap:// 딥링크 로직)

### 카드 너비

```ts
// SpotSummaryCard.tsx 내부
const CARD_WIDTH = Dimensions.get('window').width - 40;
```

카드 루트 View에 `width: CARD_WIDTH` 적용하여 고정 너비 보장.

---

## 3. 내 위치 아이콘

### 변경 전

```tsx
<Text style={styles.floatingLocationButtonText}>
  {locationLoading ? '...' : '📍'}
</Text>
```

### 변경 후

```tsx
import { MaterialIcons } from '@expo/vector-icons';

{locationLoading
  ? <ActivityIndicator size="small" color={colors.textMuted} />
  : <MaterialIcons name="my-location" size={20} color={colors.text} />
}
```

`floatingLocationButtonText` 스타일 제거, `floatingLocationButton` 스타일에 `alignItems: 'center', justifyContent: 'center'` 추가 (아이콘 중앙 정렬).

---

## 4. 수정 파일

| 파일 | 변경 내용 |
|------|-----------|
| `apps/mobile/src/features/map/screens/MapScreen.tsx` | summaryPanel → FlatList 캐로셀 / floatingAction 버튼 제거 / 랜덤 useEffect 제거 / 📍 → MaterialIcons / initialSpotSlug useEffect 교체 |
| `apps/mobile/src/features/map/components/SpotSummaryCard.tsx` | 신규 — 카드 컴포넌트 추출 |

---

## 5. 구현 순서

1. `SpotSummaryCard.tsx` 신규 생성 (현재 summaryPanel 내용 이관, `CARD_WIDTH` 상수 내부 선언, `useRouter` + `Linking` 직접 사용)
2. `MapScreen.tsx` — 파일 상단에 `CARD_WIDTH`, `CARD_GAP`, `viewabilityConfig` 외부 상수 선언
3. `MapScreen.tsx` — `flatListRef` useRef 추가, `handleViewableChange` useCallback 작성
4. `MapScreen.tsx` — `handleSelectSpot`에 `findIndex` + `scrollToIndex` 연동 추가
5. `MapScreen.tsx` — `handleLocationPress`에 `findIndex` + `scrollToIndex` 연동 추가
6. `MapScreen.tsx` — `handleFlowerChange`에 새 visibleSpots 계산 + `setSelectedSpotSlug(firstSlug)` + `scrollToOffset(0)` 추가
7. `MapScreen.tsx` — 랜덤 fallback `useEffect` 제거, `initialSpotSlug` useEffect를 spots 의존성 포함 버전으로 교체
8. `MapScreen.tsx` — `floatingAction` 버튼 및 관련 스타일 제거
9. `MapScreen.tsx` — summaryPanel을 `paddingHorizontal: 20` View + FlatList(SpotSummaryCard)로 교체 (`getItemLayout`, `onScrollToIndexFailed`, `ListEmptyComponent` 포함)
10. `MapScreen.tsx` — 📍 이모지를 MaterialIcons로 교체, `floatingLocationButtonText` 스타일 제거, `floatingLocationButton`에 중앙 정렬 추가
