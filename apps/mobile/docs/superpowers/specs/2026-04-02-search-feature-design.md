# 검색 기능 설계

**날짜:** 2026-04-02
**상태:** 승인됨

---

## 개요

홈·지도·저장·내정보로 구성된 현재 탭에 검색 탭을 추가한다. 사용자가 꽃 이름, 명소명, 주소 등 키워드로 명소를 빠르게 찾을 수 있도록 한다.

---

## 탭 구조 변경

| 위치 | 기존 | 변경 후 |
|------|------|---------|
| 1 | 홈 | 홈 |
| 2 | 지도 | 지도 |
| 3 | (없음) | **검색** ← 추가 |
| 4 | 저장 | 저장 |
| 5 | 내정보 | 내정보 |

검색을 중앙(3번째)에 배치해 엄지 접근성을 높이고, 앱의 핵심 탐색 기능임을 강조한다.

---

## 컴포넌트 및 파일 구조

### 새로 생성

```
app/(tabs)/search.tsx                        # 탭 라우트 (SearchScreen 마운트)
src/features/search/screens/SearchScreen.tsx # 검색 화면 로직
src/shared/ui/SearchResultCard.tsx           # 검색 결과용 컴팩트 카드
```

### 수정

```
app/(tabs)/_layout.tsx   # 검색 탭 추가 (3번째 위치, search-outline / search 아이콘)
```

---

## SearchScreen 동작

### 데이터 흐름

1. `useQuery(spotKeys.all, getPublishedSpots)`로 전체 명소 데이터 가져옴 (React Query 캐시 공유 - 별도 API 호출 없음)
   - `spotKeys`는 `src/shared/data/spotRepository.ts`에 정의됨
2. 사용자가 입력창에 검색어를 입력하면 클라이언트 사이드 필터링 수행
3. 검색 결과를 `SearchResultCard` 목록으로 렌더링

### 검색 로직

- 검색 대상 필드: `place`(명소명), `flower`(꽃이름), `location`(주소), `helper`(한줄 설명)
- 매칭 방식: `includes()` 포함 검색, 대소문자 무관 (`toLowerCase()`)
- 검색어가 빈 문자열이면 결과 없음 (초기 안내 상태 표시)
- 개화 종료 명소도 검색 결과에 포함 (사용자가 직접 찾는 경우이므로 제외하지 않음)

### 상태별 UI

| 상태 | 표시 내용 |
|------|----------|
| 초기 (검색어 없음) | "꽃 이름, 명소 이름, 지역으로 검색해보세요" 안내 |
| 데이터 로딩 중 (`isLoading`) | SkeletonBox 3개 |
| 에러 (`isError`) | "데이터를 불러오지 못했어요. 잠시 후 다시 시도해 주세요." 텍스트 |
| 결과 있음 | SearchResultCard 목록 + "n곳의 명소를 찾았어요" 결과 수 표시 |
| 결과 없음 | "검색 결과가 없어요" 안내 문구 |

---

## SearchResultCard 컴포넌트

### 레이아웃

```
┌────────────────────────────────────────────┐
│ [64×64 썸네일]  명소명 (bold, 15px)        │
│                꽃 · 지역 (muted, 12px)     │
│                [bloomStatus 뱃지]           │
└────────────────────────────────────────────┘
```

- 카드 전체가 Pressable → `spot/[slug]` 이동
- 썸네일: `thumbnailUrl` → `flowerThumbnailUrl` → 폴백 순서로 사용
  - 이미지: 64×64, `borderRadius: 12`, `resizeMode: 'cover'`
  - 폴백: tone에 맞는 색상 배경(pink→`colors.surfaceRose`, yellow→`colors.cardSun`, green→`colors.surfaceGreen`) + `<BloomArt size="sm" tone={spot.tone} />`
- 뱃지: `bloomStatus` 값 표시, 색상은 아래 규칙을 따름

| bloomStatus | 배경색 | 텍스트 색 |
|------------|--------|----------|
| 개화 중 | `colors.surfaceGreen` | `colors.primary` |
| 지금 보기 좋아요 | `colors.surfaceGreen` | `colors.primary` |
| 개화 예정 | `colors.softYellow` | `colors.text` |
| 개화 종료 | `#EDE8E4` | `#8C7060` |

### Props

```ts
type SearchResultCardProps = {
  spot: FlowerSpot;
  onPress: () => void;
};
```

---

## 코드 검증 사항 (구현 전 확인 완료)

| 항목 | 위치 | 확인 결과 |
|------|------|----------|
| `getPublishedSpots` 함수 | `src/shared/data/spotRepository.ts` | ✅ 존재 |
| `spotKeys.all` | `src/shared/data/spotRepository.ts` | ✅ 존재 |
| `flowerThumbnailUrl` 필드 | `FlowerSpot` type (`src/shared/data/types.ts`) | ✅ 존재 |
| `bloomStatus` 값 | `src/shared/data/spotMappers.ts` - `toBloomStatus()` | `'개화 예정'` / `'개화 종료'` / `'지금 보기 좋아요'` / `'개화 중'` ✅ |
| `colors.cardSun` | `src/shared/theme/colors.ts` | `'#FFF8E6'` ✅ 존재 |

---

## 기술 결정 사항

- **클라이언트 필터링**: 명소 데이터가 이미 React Query로 캐싱되어 있어 별도 검색 API 불필요. 데이터 규모상 성능 문제 없음.
- **디바운스 없음**: 클라이언트 사이드 필터링이므로 네트워크 비용이 없다. 키 입력마다 즉시 필터링한다 (`useMemo` 사용).
- **목록 렌더링**: `FlatList` 사용. `ScreenShell`은 내부에 `ScrollView`를 포함하므로 검색 화면은 `ScreenShell`을 사용하지 않는다. `SafeAreaView` + `FlatList`로 직접 구성하며, 검색 입력창·안내 문구는 `FlatList`의 `ListHeaderComponent`로 처리한다.
- **검색 입력창**: `TextInput` — placeholder `"꽃 이름, 명소, 지역으로 검색"`, `keyboardType: 'default'`, 배경 `colors.card`, `borderRadius: 999`, `borderWidth: 1`, `borderColor: colors.border`, 내부 패딩 `paddingHorizontal: 16, paddingVertical: 12`.
- **결과 수 표시 위치**: 검색 입력창과 결과 목록 사이 (`"n곳의 명소를 찾았어요"`, `fontSize: 13`, `color: colors.textMuted`).
- **카드 간격**: `SearchResultCard` 간 `marginBottom: 10`. 카드 내부 패딩 `padding: 12`.
- **`app/(tabs)/search.tsx` 역할**: `SearchScreen`을 단순 re-export하는 라우트 파일. 다른 탭(index, map 등)과 동일한 패턴.
- **기존 카드 미재사용**: `SpotSummaryCard`는 지도용으로 고정 너비·색상으로 설계되어 있어 검색 결과에 부적합. 새 컴팩트 카드를 `shared/ui`에 추가.
- **탭 아이콘**: Ionicons `search-outline` / `search` 사용.
