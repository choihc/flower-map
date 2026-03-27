# 내 주변 명소 기능 설계

## 개요

사용자의 현재 위치를 기반으로 가까운 꽃 명소를 홈 화면과 지도 화면에서 탐색할 수 있는 기능.
위치 권한은 사용자가 명시적으로 버튼을 눌렀을 때만 요청하며, 거부 시 안내 메시지로 대체한다.

## 기술 선택

- 위치 수집: `expo-location`
- 거리 계산: 클라이언트 사이드 Haversine 공식 (별도 API 호출 없음)
- 기존 `spots` 데이터(React Query 캐시)를 재활용하여 추가 네트워크 비용 없음

---

## 1. 공통 유틸 — `src/shared/lib/location.ts`

### 타입

```ts
export type Coords = { latitude: number; longitude: number };
export type NearbySpot = { spot: FlowerSpot; distanceKm: number };
export type LocationResult = Coords | 'denied' | null;
// Coords  = 성공
// 'denied' = 권한 거부
// null     = 기타 에러 (타임아웃 등)
```

### `requestAndGetLocation(): Promise<LocationResult>`

- `expo-location`의 `requestForegroundPermissionsAsync`로 권한 요청
- 권한 거부(`status !== 'granted'`) 시 `'denied'` 반환
- 승인 시 `getCurrentPositionAsync`로 좌표 반환
- 기타 에러(타임아웃 등) 시 `null` 반환

### `getNearbySpots(spots, userCoords, limit?): NearbySpot[]`

- `FlowerSpot` 타입은 `src/shared/data/types`에서 import
- Haversine 공식으로 각 스팟까지의 거리(km) 계산
- 거리 오름차순 정렬 후 `limit`개 반환 (기본값 3)
- `spots`가 빈 배열이면 빈 배열 반환

### 거리 포맷 헬퍼 — `formatDistance(km: number): string`

- 1km 미만: `"800m"` (`Math.round(km * 1000)` m)
- 1km 이상: `"1.2km"` (`Math.round(km * 10) / 10` km)

---

## 2. HomeScreen — "내 주변 명소" 섹션

### 위치

히어로 카드(`SpotHeroCard`) 바로 아래, 꽃 종류 선택(`SectionHeading`) 위에 삽입.

### 상태

```ts
type LocationState = 'idle' | 'loading' | 'granted' | 'denied';
const [locationState, setLocationState] = useState<LocationState>('idle');
const [userCoords, setUserCoords] = useState<Coords | null>(null);
```

### 버튼 탭 핸들러

`requestAndGetLocation()`의 반환값(`LocationResult`)으로 상태를 분기한다:

```ts
const handleLocationPress = async () => {
  setLocationState('loading');
  const result = await requestAndGetLocation();
  if (result === 'denied') {
    setLocationState('denied');
  } else if (result === null) {
    setLocationState('idle'); // 에러 → idle 복귀
  } else {
    setUserCoords(result);
    setLocationState('granted');
  }
};
```

### AppState 재시도 처리

`denied` 상태에서 사용자가 설정 앱으로 이동 후 돌아오면 버튼을 다시 표시한다.
`useRef`로 최신 `locationState`를 추적하고, 의존성 배열은 `[]`로 고정하여 불필요한 리스너 재등록을 방지한다.

```ts
const locationStateRef = useRef(locationState);
useEffect(() => { locationStateRef.current = locationState; }, [locationState]);

useEffect(() => {
  const sub = AppState.addEventListener('change', (state) => {
    if (state === 'active' && locationStateRef.current === 'denied') {
      setLocationState('idle');
    }
  });
  return () => sub.remove();
}, []);
```

### UI

**idle / loading 상태**
```
[ 📍 내 주변 명소 보기 ]   ← Pressable 버튼 (loading 시 disabled)
```

**granted 상태 — nearbySpots.length > 0**
```
SectionHeading: "내 주변 명소"  meta: "현재 위치 기준"
┌──────────────────────────────┐
│ 여의도 윤중로          1.2km │
│ 벚꽃 · 서울 영등포구         │
├──────────────────────────────┤
│ 서울대공원 벚꽃길      3.4km │
│ 벚꽃 · 경기 과천시           │
└──────────────────────────────┘
```
각 행은 `Pressable` → 명소 상세 페이지로 이동.
스타일은 HomeScreen 내에 인라인으로 정의 (크로스 파일 스타일 공유 없음).

**granted 상태 — nearbySpots.length === 0**
섹션 전체 미표시.

**denied 상태**
```
"위치 권한을 허용하면 주변 명소를 볼 수 있어요."
[ 설정에서 허용하기 ]   ← Linking.openSettings() 호출
```

---

## 3. MapScreen — 위치 버튼

### 위치

지도 우하단 기존 "상세" 플로팅 버튼 위에 위치 아이콘 버튼 추가.

### 상태 추가

```ts
const [userCameraCoords, setUserCameraCoords] = useState<Coords | null>(null);
const [locationLoading, setLocationLoading] = useState(false);
```

### visibleSpots 정의

MapScreen에서 `visibleSpots`는 꽃 필터(`selectedFlower`)를 적용한 스팟 목록이다:

```ts
const visibleSpots = selectedFlower === '전체'
  ? spots
  : spots.filter((spot) => spot.flower === selectedFlower);
```

### 카메라 동작 전략

`NativeMapCanvas`에 `userCamera?: Coords` prop 추가. 카메라 우선순위:

1. `userCamera`가 있으면 사용자 위치로 이동 (zoom: 11)
2. 없으면 기존 `selectedSpot` 기반 카메라 (꽃 종류에 따라 zoom 8.6 또는 10.4)

**필터 변경 시 카메라 처리**: `selectedFlower` 필터가 바뀌면 `userCameraCoords`를 `null`로 초기화.

```ts
const handleFlowerChange = (flower: string) => {
  setSelectedFlower(flower);
  setUserCameraCoords(null);
};
```

### 동작 흐름

1. 버튼 탭 → `setLocationLoading(true)` → `requestAndGetLocation()` 호출
2. 성공(`Coords`) 시:
   - `setUserCameraCoords(coords)` → 카메라 사용자 위치로 이동
   - 가장 가까운 명소 선택: `visibleSpots`가 비어 있으면 `spots` 전체를 fallback
     ```ts
     const pool = visibleSpots.length > 0 ? visibleSpots : spots;
     const nearest = getNearbySpots(pool, coords, 1)[0];
     if (nearest) setSelectedSpotSlug(nearest.spot.slug);
     ```
3. `'denied'` 또는 `null` 시: **의도적 침묵** — 지도 화면은 위치 버튼이 보조 기능이므로 별도 에러 UI 없이 `locationLoading(false)`만 호출. 버튼이 다시 활성화되어 재시도 가능하므로 사용자에게 충분하다고 판단.
4. 완료 시 (성공/실패 모두): `setLocationLoading(false)`
5. 마커 탭 시: `setUserCameraCoords(null)` → 명소 선택 모드 복귀
6. **웹 환경**: `Platform.OS === 'web'`이면 버튼 비노출

### `NativeMapCanvas` prop 변경 및 카메라 분기

```ts
type NativeMapCanvasProps = {
  spots: FlowerSpot[];
  selectedSpotSlug: string;
  userCamera?: Coords;           // 추가
  onSelectSpot: (spotSlug: string) => void;
};
```

`NativeMapCanvas` 내부에서 `NaverMapView`의 `camera`를 다음과 같이 분기한다:

```ts
const camera = userCamera
  ? { latitude: userCamera.latitude, longitude: userCamera.longitude, zoom: 11 }
  : selectedCoordinate
    ? { latitude: selectedCoordinate.latitude, longitude: selectedCoordinate.longitude,
        zoom: selectedSpot.flower === '유채꽃' ? 8.6 : 10.4 }
    : defaultCamera;
```

즉 `userCamera`가 존재하면 항상 우선 적용하고, 없으면 기존 `selectedSpot` 기반 카메라를 사용한다.

---

## 에러 처리

| 상황 | 처리 |
|------|------|
| 위치 권한 거부 | `'denied'` 반환 → HomeScreen: `denied` 상태. MapScreen: 무시 |
| 위치 획득 실패 (타임아웃 등) | `null` 반환 → HomeScreen: `idle` 상태 복귀. MapScreen: 무시 |
| `granted` + `spots` 빈 배열 | `nearbySpots` 빈 배열 → 섹션 미표시 |
| `denied` 후 설정에서 허용 | `AppState` active 복귀 시 `idle`로 리셋 (`useRef` 패턴 사용) |
| `visibleSpots` 빈 배열 (MapScreen) | `spots` 전체를 fallback으로 `getNearbySpots` 호출 |
| MapScreen 버튼 연타 | `locationLoading` 상태로 버튼 비활성화 |

---

## 파일 변경 목록

| 파일 | 변경 유형 |
|------|----------|
| `src/shared/lib/location.ts` | 신규 |
| `src/features/home/screens/HomeScreen.tsx` | 수정 |
| `src/features/map/screens/MapScreen.tsx` | 수정 |
