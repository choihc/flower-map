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
| 검색 중 (로딩) | 스켈레톤 |
| 결과 있음 | SearchResultCard 목록 + 결과 수 표시 |
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
- 썸네일: `thumbnailUrl` 또는 `flowerThumbnailUrl` 우선 사용, 없으면 꽃 tone에 맞는 색상 배경 + BloomArt
- 뱃지: `bloomStatus` 값 표시 (`개화 중`, `지금 보기 좋아요`, `개화 예정`, `개화 종료`)

### Props

```ts
type SearchResultCardProps = {
  spot: FlowerSpot;
  onPress: () => void;
};
```

---

## 기술 결정 사항

- **클라이언트 필터링**: 명소 데이터가 이미 React Query로 캐싱되어 있어 별도 검색 API 불필요. 데이터 규모상 성능 문제 없음.
- **기존 카드 미재사용**: `SpotSummaryCard`는 지도용으로 고정 너비·색상으로 설계되어 있어 검색 결과에 부적합. 새 컴팩트 카드를 `shared/ui`에 추가.
- **탭 아이콘**: Ionicons `search-outline` / `search` 사용.
