# 내 주변 명소 Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 사용자의 현재 위치 기반으로 가까운 꽃 명소를 홈 화면(섹션)과 지도 화면(버튼)에서 탐색할 수 있게 한다.

**Architecture:** `expo-location`으로 좌표를 수집하고, 이미 캐시된 `spots` 데이터에 Haversine 공식을 적용해 거리를 계산한다. 순수 함수(`getNearbySpots`, `formatDistance`)는 TDD로 작성한다. UI 컴포넌트(HomeScreen, MapScreen)는 React Native 렌더링 환경 제약상 vitest 단위 테스트 대상에서 제외하고, 핸들러 분기는 location.ts 유틸 테스트가 간접 검증한다.

**Tech Stack:** expo-location, React Native (AppState, Linking), TypeScript, vitest

---

## Chunk 1: location.ts 유틸

### Task 1: expo-location 설치

**Files:**
- Modify: `apps/mobile/package.json`

- [ ] **Step 1: expo-location 패키지 설치**

```bash
cd apps/mobile && npx expo install expo-location
```

Expected: `package.json`의 dependencies에 `expo-location`이 추가됨.

- [ ] **Step 2: 설치 확인**

```bash
grep "expo-location" apps/mobile/package.json
```

Expected: `"expo-location": "~xx.x.x"` 출력.

---

### Task 2: location.ts 유틸 TDD 구현

**Files:**
- Create: `apps/mobile/src/shared/lib/location.ts`
- Create: `apps/mobile/src/shared/lib/location.test.ts`

- [ ] **Step 1: 테스트 파일 작성**

`apps/mobile/src/shared/lib/location.test.ts`:

```ts
import { describe, expect, it } from 'vitest';

import type { FlowerSpot } from '../data/types';
import { formatDistance, getNearbySpots } from './location';

// expo-location은 네이티브 모듈이므로 requestAndGetLocation은 단위 테스트 제외.
// 순수 함수(getNearbySpots, formatDistance)만 테스트한다.

const makeSpot = (id: string, lat: number, lng: number): FlowerSpot => ({
  id,
  slug: id,
  badge: '테스트',
  bloomEndAt: '2026-04-10',
  bloomStartAt: '2026-03-28',
  bloomStatus: '개화 중',
  description: '설명',
  fee: '무료',
  festivalDate: '2026.04.01 - 2026.04.07',
  flower: '벚꽃',
  flowerThumbnailUrl: null,
  helper: '팁',
  latitude: lat,
  longitude: lng,
  location: '서울',
  parking: '정보 없음',
  place: `명소 ${id}`,
  thumbnailUrl: null,
  tone: 'pink',
});

describe('getNearbySpots', () => {
  const userCoords = { latitude: 37.5, longitude: 126.9 };

  it('가까운 순으로 정렬한다', () => {
    const near = makeSpot('near', 37.501, 126.901);
    const far = makeSpot('far', 37.6, 127.0);
    const result = getNearbySpots([far, near], userCoords);
    expect(result[0].spot.id).toBe('near');
    expect(result[1].spot.id).toBe('far');
  });

  it('limit 개수만큼만 반환한다', () => {
    const spots = [
      makeSpot('a', 37.501, 126.901),
      makeSpot('b', 37.502, 126.902),
      makeSpot('c', 37.503, 126.903),
      makeSpot('d', 37.504, 126.904),
    ];
    expect(getNearbySpots(spots, userCoords, 2)).toHaveLength(2);
  });

  it('기본 limit은 3이다', () => {
    const spots = Array.from({ length: 5 }, (_, i) =>
      makeSpot(`s${i}`, 37.5 + i * 0.01, 126.9),
    );
    expect(getNearbySpots(spots, userCoords)).toHaveLength(3);
  });

  it('빈 배열이면 빈 배열을 반환한다', () => {
    expect(getNearbySpots([], userCoords)).toEqual([]);
  });

  it('distanceKm 값이 0보다 크다', () => {
    const spot = makeSpot('s', 37.6, 127.0);
    const result = getNearbySpots([spot], userCoords);
    expect(result[0].distanceKm).toBeGreaterThan(0);
  });
});

describe('formatDistance', () => {
  it('1km 미만은 m 단위로 표시한다', () => {
    expect(formatDistance(0.5)).toBe('500m');
    expect(formatDistance(0.8)).toBe('800m');
  });

  it('정확히 1km이면 1km로 표시한다', () => {
    expect(formatDistance(1.0)).toBe('1km');
  });

  it('1km 이상 소수는 소수점 첫째 자리로 표시한다', () => {
    expect(formatDistance(1.25)).toBe('1.3km');
    expect(formatDistance(13.6)).toBe('13.6km');
  });

  it('반올림을 적용한다', () => {
    expect(formatDistance(0.9999)).toBe('1000m');
    expect(formatDistance(1.049)).toBe('1km');
    expect(formatDistance(1.051)).toBe('1.1km');
  });
});
```

- [ ] **Step 2: 테스트가 실패하는지 확인**

```bash
cd apps/mobile && pnpm test -- location.test
```

Expected: `Cannot find module './location'` 에러.

- [ ] **Step 3: location.ts 구현**

`apps/mobile/src/shared/lib/location.ts`:

```ts
import * as ExpoLocation from 'expo-location';

import type { FlowerSpot } from '../data/types';

export type Coords = { latitude: number; longitude: number };
export type NearbySpot = { spot: FlowerSpot; distanceKm: number };
export type LocationResult = Coords | 'denied' | null;
// Coords   = 위치 획득 성공
// 'denied' = 권한 거부
// null     = 기타 에러 (타임아웃 등)

export async function requestAndGetLocation(): Promise<LocationResult> {
  try {
    const { status } = await ExpoLocation.requestForegroundPermissionsAsync();
    if (status !== 'granted') return 'denied';
    const position = await ExpoLocation.getCurrentPositionAsync({});
    return {
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
    };
  } catch {
    return null;
  }
}

function haversineKm(a: Coords, b: Coords): number {
  const R = 6371;
  const dLat = ((b.latitude - a.latitude) * Math.PI) / 180;
  const dLng = ((b.longitude - a.longitude) * Math.PI) / 180;
  const sinDLat = Math.sin(dLat / 2);
  const sinDLng = Math.sin(dLng / 2);
  const chord =
    sinDLat * sinDLat +
    Math.cos((a.latitude * Math.PI) / 180) *
      Math.cos((b.latitude * Math.PI) / 180) *
      sinDLng * sinDLng;
  return R * 2 * Math.atan2(Math.sqrt(chord), Math.sqrt(1 - chord));
}

export function getNearbySpots(
  spots: FlowerSpot[],
  userCoords: Coords,
  limit = 3,
): NearbySpot[] {
  return spots
    .map((spot) => ({
      spot,
      distanceKm: haversineKm(userCoords, { latitude: spot.latitude, longitude: spot.longitude }),
    }))
    .sort((a, b) => a.distanceKm - b.distanceKm)
    .slice(0, limit);
}

export function formatDistance(km: number): string {
  if (km < 1) {
    return `${Math.round(km * 1000)}m`;
  }
  const rounded = Math.round(km * 10) / 10;
  // 정수이면 소수점 없이 표시 (예: 1.0 → "1km"), 소수이면 그대로 (예: 1.3 → "1.3km")
  return rounded % 1 === 0 ? `${Math.round(rounded)}km` : `${rounded}km`;
}
```

- [ ] **Step 4: 테스트 통과 확인**

```bash
cd apps/mobile && pnpm test -- location.test
```

Expected: 모든 테스트 PASS.

- [ ] **Step 5: 커밋**

```bash
git add apps/mobile/src/shared/lib/location.ts apps/mobile/src/shared/lib/location.test.ts apps/mobile/package.json apps/mobile/pnpm-lock.yaml
git commit -m "feat(mobile): location 유틸 추가 (Haversine 거리 계산, expo-location 권한)"
```

---

## Chunk 2: HomeScreen "내 주변 명소" 섹션

### Task 3: HomeScreen에 위치 기반 섹션 추가

**Files:**
- Modify: `apps/mobile/src/features/home/screens/HomeScreen.tsx`

> UI 컴포넌트는 vitest 단위 테스트 환경 제약상 렌더링 테스트를 생략하고, 핵심 로직은 Task 2의 location.ts 유틸 테스트가 검증한다.

- [ ] **Step 1: react import에 useRef 추가**

파일 1번 줄을 아래로 교체한다:

```ts
import { useEffect, useRef, useState } from 'react';
```

- [ ] **Step 2: react-native import에 AppState, Linking 추가**

기존:
```ts
import { ImageBackground, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
```

변경 후:
```ts
import { AppState, type AppStateStatus, ImageBackground, Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
```

- [ ] **Step 3: location 유틸 import 추가**

기존 import 블록 끝에 추가:

```ts
import {
  type Coords,
  formatDistance,
  getNearbySpots,
  requestAndGetLocation,
} from '../../../shared/lib/location';
```

- [ ] **Step 4: 상태 및 AppState 구독 추가**

컴포넌트 내 `const [selectedFlower, ...]` 선언 아래에 추가:

```ts
type LocationState = 'idle' | 'loading' | 'granted' | 'denied';
const [locationState, setLocationState] = useState<LocationState>('idle');
const [userCoords, setUserCoords] = useState<Coords | null>(null);

const locationStateRef = useRef<LocationState>('idle');
useEffect(() => {
  locationStateRef.current = locationState;
}, [locationState]);

useEffect(() => {
  const sub = AppState.addEventListener('change', (state: AppStateStatus) => {
    if (state === 'active' && locationStateRef.current === 'denied') {
      setLocationState('idle');
    }
  });
  return () => sub.remove();
}, []);
```

- [ ] **Step 5: 핸들러 및 파생값 추가**

`orderedSpots` 선언 바로 아래에 추가:

```ts
const nearbySpots = userCoords ? getNearbySpots(featuredSpots, userCoords) : [];

const handleLocationPress = async () => {
  setLocationState('loading');
  const result = await requestAndGetLocation();
  if (result === 'denied') {
    setLocationState('denied');
  } else if (result === null) {
    setLocationState('idle');
  } else {
    setUserCoords(result);
    setLocationState('granted');
  }
};
```

- [ ] **Step 6: JSX에 섹션 삽입**

`<SpotHeroCard ... />` 닫는 태그 바로 아래, `<SectionHeading ... title="꽃 종류 선택" />` 위에 아래 블록을 삽입한다:

```tsx
{locationState === 'granted' && nearbySpots.length > 0 ? (
  <>
    <SectionHeading meta="현재 위치 기준" title="내 주변 명소" />
    <View style={styles.nearbyList}>
      {nearbySpots.map(({ spot: nearby, distanceKm }) => (
        <Pressable
          key={nearby.id}
          onPress={() => router.push(`/spot/${nearby.slug}`)}
          style={styles.nearbyRow}
        >
          <View style={styles.nearbyInfo}>
            <Text style={styles.nearbyTitle}>{nearby.place}</Text>
            <Text style={styles.nearbyMeta}>
              {nearby.flower} · {nearby.location}
            </Text>
          </View>
          <Text style={styles.nearbyDistance}>{formatDistance(distanceKm)}</Text>
        </Pressable>
      ))}
    </View>
  </>
) : locationState === 'denied' ? (
  <View style={styles.locationDenied}>
    <Text style={styles.locationDeniedText}>
      위치 권한을 허용하면 주변 명소를 볼 수 있어요.
    </Text>
    <Pressable onPress={() => Linking.openSettings()} style={styles.locationSettingsButton}>
      <Text style={styles.locationSettingsButtonText}>설정에서 허용하기</Text>
    </Pressable>
  </View>
) : (
  <Pressable
    disabled={locationState === 'loading'}
    onPress={handleLocationPress}
    style={[
      styles.locationButton,
      locationState === 'loading' ? styles.locationButtonDisabled : null,
    ]}
  >
    <Text style={styles.locationButtonText}>
      {locationState === 'loading' ? '위치 확인 중...' : '📍 내 주변 명소 보기'}
    </Text>
  </Pressable>
)}
```

- [ ] **Step 7: 스타일 추가**

`StyleSheet.create({...})` 내에 추가:

```ts
locationButton: {
  alignItems: 'center',
  backgroundColor: colors.card,
  borderColor: colors.border,
  borderRadius: 999,
  borderWidth: 1,
  marginBottom: 20,
  paddingVertical: 14,
},
locationButtonDisabled: {
  opacity: 0.5,
},
locationButtonText: {
  color: colors.text,
  fontSize: 15,
  fontWeight: '600',
},
locationDenied: {
  backgroundColor: colors.cardAlt,
  borderRadius: 20,
  marginBottom: 20,
  padding: 16,
},
locationDeniedText: {
  color: colors.textMuted,
  fontSize: 14,
  lineHeight: 20,
  marginBottom: 12,
},
locationSettingsButton: {
  alignSelf: 'flex-start',
  backgroundColor: colors.primary,
  borderRadius: 999,
  paddingHorizontal: 14,
  paddingVertical: 10,
},
locationSettingsButtonText: {
  color: '#FFFFFF',
  fontSize: 13,
  fontWeight: '700',
},
nearbyDistance: {
  color: colors.primary,
  fontSize: 14,
  fontWeight: '700',
},
nearbyInfo: {
  flex: 1,
},
nearbyList: {
  marginBottom: 20,
},
nearbyMeta: {
  color: colors.textMuted,
  fontSize: 13,
  marginTop: 3,
},
nearbyRow: {
  alignItems: 'center',
  borderBottomColor: colors.border,
  borderBottomWidth: 1,
  flexDirection: 'row',
  justifyContent: 'space-between',
  paddingVertical: 14,
},
nearbyTitle: {
  color: colors.text,
  fontSize: 16,
  fontWeight: '700',
},
```

- [ ] **Step 8: 전체 테스트 통과 확인**

```bash
cd apps/mobile && pnpm test
```

Expected: 모든 테스트 PASS.

- [ ] **Step 9: 커밋**

```bash
git add apps/mobile/src/features/home/screens/HomeScreen.tsx
git commit -m "feat(mobile): 홈 화면에 내 주변 명소 섹션 추가"
```

---

## Chunk 3: MapScreen 위치 버튼

### Task 4: MapScreen에 위치 버튼 + NativeMapCanvas userCamera 추가

**Files:**
- Modify: `apps/mobile/src/features/map/screens/MapScreen.tsx`

- [ ] **Step 1: import 추가**

기존 import 블록에 location 유틸 추가:

```ts
import {
  type Coords,
  getNearbySpots,
  requestAndGetLocation,
} from '../../../shared/lib/location';
```

- [ ] **Step 2: NativeMapCanvasProps 타입에 userCamera 추가**

기존:
```ts
type NativeMapCanvasProps = {
  spots: FlowerSpot[];
  selectedSpotSlug: string;
  onSelectSpot: (spotSlug: string) => void;
};
```

변경 후:
```ts
type NativeMapCanvasProps = {
  spots: FlowerSpot[];
  selectedSpotSlug: string;
  userCamera?: Coords;
  onSelectSpot: (spotSlug: string) => void;
};
```

- [ ] **Step 3: NativeMapCanvas 함수 시그니처 및 camera prop 분기 수정**

함수 시그니처:
```ts
function NativeMapCanvas({ spots, selectedSpotSlug, userCamera, onSelectSpot }: NativeMapCanvasProps) {
```

`NaverMapView`의 `camera` prop — 기존 아래 블록 전체를 교체한다:

기존 (lines 53–62 근처):
```ts
camera={
  selectedCoordinate
    ? {
        latitude: selectedCoordinate.latitude,
        longitude: selectedCoordinate.longitude,
        zoom: selectedSpot.flower === '유채꽃' ? 8.6 : 10.4,
      }
    : defaultCamera
}
```

변경 후:
```ts
camera={
  userCamera
    ? { latitude: userCamera.latitude, longitude: userCamera.longitude, zoom: 11 }
    : selectedCoordinate
      ? {
          latitude: selectedCoordinate.latitude,
          longitude: selectedCoordinate.longitude,
          zoom: selectedSpot.flower === '유채꽃' ? 8.6 : 10.4,
        }
      : defaultCamera
}
```

- [ ] **Step 4: MapScreen 상태 추가**

기존 `useState` 선언부 아래에 추가:

```ts
const [userCameraCoords, setUserCameraCoords] = useState<Coords | null>(null);
const [locationLoading, setLocationLoading] = useState(false);
```

- [ ] **Step 5: 핸들러 추가**

`visibleSpots` 선언 아래에 추가:

```ts
const handleLocationPress = async () => {
  if (locationLoading) return;
  setLocationLoading(true);
  const result = await requestAndGetLocation();
  if (result !== 'denied' && result !== null) {
    setUserCameraCoords(result);
    const pool = visibleSpots.length > 0 ? visibleSpots : spots;
    const nearest = getNearbySpots(pool, result, 1)[0];
    if (nearest) setSelectedSpotSlug(nearest.spot.slug);
  }
  setLocationLoading(false);
};

const handleSelectSpot = (spotSlug: string) => {
  setUserCameraCoords(null);
  setSelectedSpotSlug(spotSlug);
};

const handleFlowerChange = (flower: string) => {
  setSelectedFlower(flower);
  setUserCameraCoords(null);
};
```

- [ ] **Step 6: NativeMapCanvas 호출부 업데이트**

기존:
```tsx
<NativeMapCanvas onSelectSpot={setSelectedSpotSlug} selectedSpotSlug={selectedSpot.slug} spots={visibleSpots} />
```

변경 후:
```tsx
<NativeMapCanvas
  onSelectSpot={handleSelectSpot}
  selectedSpotSlug={selectedSpot.slug}
  spots={visibleSpots}
  userCamera={userCameraCoords ?? undefined}
/>
```

- [ ] **Step 7: 꽃 필터 칩 onPress를 handleFlowerChange로 교체**

기존:
```tsx
onPress={() => setSelectedFlower(flower)}
```

변경 후:
```tsx
onPress={() => handleFlowerChange(flower)}
```

- [ ] **Step 8: 위치 버튼 JSX 추가**

`mapFloatingLayer` View 내 기존 "상세" 버튼 위에 추가. `Platform.OS !== 'web'` 조건으로 웹 환경 제외:

```tsx
{Platform.OS !== 'web' && (
  <Pressable
    disabled={locationLoading}
    onPress={handleLocationPress}
    style={[
      styles.floatingLocationButton,
      locationLoading ? styles.floatingButtonDisabled : null,
    ]}
  >
    <Text style={styles.floatingLocationButtonText}>
      {locationLoading ? '...' : '📍'}
    </Text>
  </Pressable>
)}
```

- [ ] **Step 9: 스타일 추가**

```ts
floatingButtonDisabled: {
  opacity: 0.5,
},
floatingLocationButton: {
  backgroundColor: '#FFFFFF',
  borderRadius: 999,
  bottom: 60,
  paddingHorizontal: 14,
  paddingVertical: 10,
  position: 'absolute',
  right: 16,
},
floatingLocationButtonText: {
  fontSize: 18,
},
```

- [ ] **Step 10: 전체 테스트 통과 확인**

```bash
cd apps/mobile && pnpm test
```

Expected: 모든 테스트 PASS.

- [ ] **Step 11: 커밋**

```bash
git add apps/mobile/src/features/map/screens/MapScreen.tsx
git commit -m "feat(mobile): 지도 화면에 내 위치 기반 명소 선택 버튼 추가"
```

---

## 완료 확인

- [ ] `pnpm test` 전체 테스트 통과
- [ ] 홈 화면: "📍 내 주변 명소 보기" 버튼 → 권한 요청 → 주변 명소 최대 3개 표시 (거리 포함)
- [ ] 홈 화면: 권한 거부 시 "설정에서 허용하기" 버튼 표시
- [ ] 홈 화면: 설정에서 권한 허용 후 앱 복귀 시 버튼 재표시 (AppState 구독)
- [ ] 지도 화면: 📍 버튼 → 권한 요청 → 카메라 내 위치로 이동 + 가장 가까운 명소 하단 패널 표시
- [ ] 지도 화면: 꽃 필터 변경 시 카메라가 내 위치 고정에서 일반 모드로 복귀
- [ ] 지도 화면: 웹 환경에서 위치 버튼 미표시
