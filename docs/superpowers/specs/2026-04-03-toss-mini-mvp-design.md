# 토스 미니 앱 MVP 설계

## 1. 목표

기존 `apps/mobile`에 영향 없이, 앱인토스 전용 미니앱을 `apps/toss-mini`에서 독립적으로 개발한다.

핵심 목표:
- 기존 모바일 앱 홈 화면과 동일한 UX를 앱인토스 환경에서 구현
- TDS React Native 컴포넌트 사용 (앱인토스 검수 기준 충족)
- 로그인 없이 읽기 중심 MVP 제공
- 저장 기능은 앱인토스 Storage API로 로컬 처리

## 2. 범위

### 포함
- 4탭 네비게이션 (홈 / 지도 / 검색 / 저장)
- 홈: 히어로 캐러셀 + 꽃 필터 칩 + 명소 카드 리스트
- 지도: 네이버 지도 + 마커 + 꽃 필터 + 수평 카드 리스트
- 검색: 텍스트 검색 + 꽃 종류/지역 필터
- 저장: 로컬 저장 명소 리스트
- 명소 상세: 사진, 정보, 길찾기, 저장 토글

### 제외
- 로그인 / 회원가입
- 서버 기반 즐겨찾기 동기화
- 리뷰 / 커뮤니티
- 사용자 업로드
- 내 정보 탭

## 3. 아키텍처

### 3.1 페이지 구조

Granite 파일 기반 라우팅 + `_layout.tsx` 공통 탭바 방식을 사용한다.

```
apps/toss-mini/pages/
├── _layout.tsx        # TDS 하단 탭바 공통 레이아웃
├── index.tsx          # 홈
├── map.tsx            # 지도
├── search.tsx         # 검색
├── saved.tsx          # 저장
├── spot/[id].tsx      # 명소 상세 (딥링크: intoss://flower-map/spot/[id])
└── _404.tsx           # 404
```

URL 스킴: `intoss://flower-map` (Toss 샌드박스 실제 스킴 기준)

### 3.2 소스 구조

```
apps/toss-mini/src/
├── _app.tsx                      # QueryClientProvider + Granite scheme 보정
├── features/
│   ├── home/
│   │   └── components/
│   │       ├── HeroCarousel.tsx          # 히어로 캐러셀 (TDS Carousel)
│   │       ├── FlowerFilterChips.tsx     # 꽃 종류 필터 (TDS Button outlined)
│   │       └── SpotCard.tsx              # 명소 카드 (TDS List + Badge)
│   ├── map/
│   │   └── components/
│   │       ├── NaverMapCanvas.tsx        # 기존 유지
│   │       └── SpotSummaryCard.tsx       # 지도용 수평 카드
│   ├── search/
│   │   └── components/
│   │       ├── SearchHeader.tsx          # TDS SearchField
│   │       └── SpotListItem.tsx          # 검색 결과 아이템
│   └── saved/
│       └── components/
│           └── SavedSpotCard.tsx         # 저장된 명소 카드
└── shared/
    ├── components/
    │   ├── TabBar.tsx                    # TDS 하단 탭바
    │   └── QueryProvider.tsx             # TanStack QueryClient
    └── hooks/
        └── useStorage.ts                 # 앱인토스 Storage API 래핑
```

### 3.3 데이터 레이어

| 소스 | 용도 |
|------|------|
| `packages/flower-domain` | `getFeaturedSpots`, `getFlowerFilters`, `getSpotById`, `getSpotsAround` |
| TanStack Query v5 | 데이터 캐싱 / 로딩 / 에러 상태 |
| 앱인토스 Storage API | 저장된 명소 ID 목록 (`saved-spots` 키) |

## 4. 화면별 상세 설계

### 4.1 홈 (`pages/index.tsx`)

**레이아웃 (위 → 아래):**
1. TDS Navbar — "꽃 어디" 타이틀
2. TDS Carousel — 개화 중인 명소 최대 5개 히어로 카드
3. TDS Button (outlined, 가로 스크롤) — 꽃 종류 필터 칩
4. TDS List — 필터된 명소 카드 (이미지 + Badge + 제목 + 한 줄 설명)

**데이터:**
- `getFeaturedSpots()` → TanStack Query `useQuery`
- `getFlowerFilters()` → 꽃 필터 목록
- 필터 선택 시 클라이언트 사이드 필터링

**상태:**
- `selectedFlower: string | null` — 선택된 꽃 종류

### 4.2 지도 (`pages/map.tsx`)

**레이아웃:**
1. TDS Navbar — "지도"
2. `NaverMapCanvas` (기존 컴포넌트) — 전체 너비, 고정 높이
3. TDS Button (outlined, 가로 스크롤) — 꽃 필터 칩 (홈과 동일)
4. 수평 스크롤 명소 카드 — 마커 탭 연동

**인터랙션:**
- 마커 탭 → 해당 명소 카드로 스크롤 포커스
- 카드 스크롤 → 지도 카메라 이동

**데이터:**
- `getFeaturedSpots()` or `getSpotsAround()` (위치 권한 있을 시)

### 4.3 검색 (`pages/search.tsx`)

**레이아웃:**
1. TDS Navbar + TDS SearchField
2. 꽃 종류 필터 칩 (가로 스크롤)
3. 지역 필터 칩 (가로 스크롤)
4. TDS List — 검색 결과

**검색 로직:**
- 텍스트 입력 시 `getFeaturedSpots()` 결과를 클라이언트에서 필터링 (이름/설명 포함 여부)
- 꽃 종류/지역 필터는 클라이언트 사이드 조합

### 4.4 저장 (`pages/saved.tsx`)

**레이아웃:**
1. TDS Navbar — "저장"
2. 저장된 명소 없을 시: TDS ErrorPage (empty state)
3. 저장된 명소 있을 시: TDS List

**저장 메커니즘:**
```ts
// useStorage hook
const { savedIds, save, remove, isSaved } = useStorage();

// 내부 구현
await setItem('saved-spots', JSON.stringify([...savedIds, id]));
const raw = await getItem('saved-spots');
```

저장된 ID 목록 → `getSpotById(id)` 병렬 fetch → 명소 데이터 표시

### 4.5 명소 상세 (`pages/spot/[id].tsx`)

**레이아웃:**
1. TDS Navbar — 뒤로가기 + 명소 이름
2. 대표 이미지 (Image)
3. TDS Badge — 꽃 종류
4. 제목, 지역, 개화 기간
5. 설명
6. 길찾기 버튼 → `openURL` (카카오맵 / 네이버지도 deep link)
7. 저장 버튼 → `useStorage` 토글

**데이터:**
- `useParams({ from: '/spot/[id]' })` → id 추출
- `getSpotById(id)` → TanStack Query

## 5. 공통 설계

### 5.1 `_layout.tsx` 탭바

```tsx
// Granite _layout.tsx
export default function Layout({ children }) {
  const navigation = Route.useNavigation();
  return (
    <View style={{ flex: 1 }}>
      {children}
      <TabBar
        tabs={[
          { key: '/', label: '홈', icon: 'home' },
          { key: '/map', label: '지도', icon: 'map' },
          { key: '/search', label: '검색', icon: 'search' },
          { key: '/saved', label: '저장', icon: 'heart' },
        ]}
        onPress={(key) => navigation.navigate(key)}
      />
    </View>
  );
}
```

### 5.2 QueryClient 설정

`src/_app.tsx`의 `AppContainer`에서 `QueryClientProvider` 래핑:
```tsx
const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 5 * 60 * 1000 } },
});

function AppContainer({ children }) {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}
```

### 5.3 이미지

명소 이미지는 **Vercel Blob** URL을 그대로 사용한다. 별도 변환 없이 RN `Image` 컴포넌트에 전달.

### 5.4 에러 / 로딩 상태

| 상태 | 처리 |
|------|------|
| `isPending` | TDS `Loader` |
| `isError` | TDS `ErrorPage` |
| 빈 결과 | TDS `ErrorPage` (empty state variant) |

### 5.5 Granite scheme 보정 (기존 적용)

`src/_app.tsx`에서 `global.__granite.app.scheme`을 `intoss`로 보정.
Toss 샌드박스가 `intoss://` 스킴으로 앱을 열기 때문.

## 6. 기술 스택

| 항목 | 선택 |
|------|------|
| 앱 프레임워크 | Granite JS + AppsInToss |
| UI 컴포넌트 | TDS React Native (`@toss/tds-react-native`) |
| 데이터 페칭 | TanStack Query v5 |
| 지도 | @mj-studio/react-native-naver-map |
| 도메인 로직 | `packages/flower-domain` |
| 로컬 저장 | 앱인토스 Storage API |
| 라우팅 | Granite 파일 기반 라우팅 |

## 7. 구현 순서 (권장)

1. `_app.tsx` QueryClientProvider 추가
2. `_layout.tsx` + TabBar 컴포넌트
3. 홈 화면 (데이터 연결 포함)
4. 명소 상세 화면
5. 지도 화면
6. 검색 화면
7. 저장 화면
