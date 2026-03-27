# 설계 문서: 꽃 대표 썸네일 폴백

**날짜**: 2026-03-27
**범위**: 명소 썸네일 없을 때 해당 꽃의 대표 썸네일을 표시

---

## 배경

현재 이미지 폴백 체인은 `spot.thumbnailUrl → BloomArt` 2단계다. 명소에 썸네일이 없을 때 꽃별 대표 이미지를 보여주면 빈 화면보다 맥락 있는 UI를 제공할 수 있다.

---

## 폴백 체인

```
spot.thumbnailUrl → flower.thumbnailUrl → BloomArt
```

1. 명소 자체 썸네일이 있으면 사용
2. 없으면 해당 꽃의 대표 썸네일 사용
3. 둘 다 없으면 기존 BloomArt 유지

---

## 변경 레이어

### 레이어 1: Supabase — DB 마이그레이션

`flowers` 테이블에 `thumbnail_url text` 컬럼 추가.

```sql
ALTER TABLE flowers ADD COLUMN thumbnail_url text;
```

### 레이어 2: 어드민 — 꽃 편집 UI

**변경 파일:**
- `apps/admin/src/features/flowers/FlowerForm.tsx` — `ImageUploader` 컴포넌트 추가
- `apps/admin/src/features/flowers/flowerSchema.ts` — `thumbnail_url` 필드 추가
- `apps/admin/src/features/flowers/flowerRepository.ts` — insert/update에 `thumbnail_url` 포함

`ImageUploader`는 스팟 폼과 동일하게 `/api/upload` 엔드포인트를 사용한다.

### 레이어 3: 모바일 — 데이터 + UI

**변경 파일:**

| 파일 | 변경 내용 |
|------|----------|
| `src/shared/data/types.ts` | `PublishedSpotFlower`에 `thumbnail_url: string \| null` 추가. `FlowerSpot`에 `flowerThumbnailUrl: string \| null` 추가 |
| `src/shared/data/spotMappers.ts` | `toFlowerSpot()`에 `flowerThumbnailUrl: row.flower.thumbnail_url ?? null` 매핑 추가 |
| `src/shared/data/spotMappers.test.ts` | `flowerThumbnailUrl` 매핑 케이스 추가 |
| `src/shared/data/spotRepository.ts` | 쿼리를 `flower:flowers(name_ko, thumbnail_url)`로 변경 |
| `src/shared/ui/resolveSpotImage.ts` | 신규 — 이미지 소스 결정 헬퍼 |
| `src/shared/ui/resolveSpotImage.test.ts` | 신규 — 3가지 케이스 테스트 |
| `src/features/home/screens/HomeScreen.tsx` | `resolveSpotImage()` 사용 |
| `src/features/map/screens/MapScreen.tsx` | `resolveSpotImage()` 사용 |
| `src/features/map/screens/SpotListScreen.tsx` | `resolveSpotImage()` 사용 (해당 화면에 이미지가 있는 경우) |
| `src/features/spot/screens/SpotDetailScreen.tsx` | `resolveSpotImage()` 사용 |

---

## resolveSpotImage 헬퍼

```typescript
// src/shared/ui/resolveSpotImage.ts
import type { FlowerSpot } from '../data/types';

export function resolveSpotImage(spot: FlowerSpot): { uri: string } | null {
  const url = spot.thumbnailUrl ?? spot.flowerThumbnailUrl;
  return url ? { uri: url } : null;
}
```

기존 인라인 삼항 표현식 `spot.thumbnailUrl ? { uri: spot.thumbnailUrl } : undefined`을 모두 `resolveSpotImage(spot) ?? undefined`로 교체한다.

---

## 데이터 흐름

```
어드민: 꽃 편집 → ImageUploader → /api/upload → Vercel Blob → flowers.thumbnail_url

모바일 앱:
  getPublishedSpots()
    → Supabase: spots JOIN flowers(name_ko, thumbnail_url)
      → toFlowerSpot() → FlowerSpot.flowerThumbnailUrl
        → resolveSpotImage(spot)
          → spot.thumbnailUrl 있음 → { uri: spot.thumbnailUrl }
          → spot.thumbnailUrl 없고 flowerThumbnailUrl 있음 → { uri: flowerThumbnailUrl }
          → 둘 다 없음 → null → BloomArt 렌더링
```

---

## 테스트 전략

**resolveSpotImage.test.ts:**
```typescript
// 케이스 1: spot.thumbnailUrl 있음 → spot URL 반환
// 케이스 2: spot.thumbnailUrl 없고 flowerThumbnailUrl 있음 → flower URL 반환
// 케이스 3: 둘 다 null → null 반환
```

**spotMappers.test.ts 추가 케이스:**
```typescript
// flowerThumbnailUrl 매핑 확인 (null / URL 있음)
```

---

## 제외 범위 (이번 작업 아님)

- Vercel Blob에 꽃 이미지 실제 업로드 (어드민 UI 구현 후 수동으로 진행)
- 이미지 리사이징/최적화
- 실시간 꽃 썸네일 변경 반영 (React Query staleTime 5분 이내 반영됨)
