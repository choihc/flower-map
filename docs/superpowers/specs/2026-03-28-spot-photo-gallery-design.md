# 명소 사진 갤러리 설계 문서

**날짜**: 2026-03-28
**상태**: 확정

---

## 개요

명소 상세보기(SpotDetailScreen)에서 텍스트 기반 후기(ReviewSection)를 제거하고,
명소별 대표 사진 5장 내외를 갤러리 형태로 표시하는 기능으로 교체한다.

---

## 1. DB 스키마

### 신규 테이블: `spot_photos`

```sql
CREATE TABLE spot_photos (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  spot_id     uuid NOT NULL REFERENCES spots(id) ON DELETE CASCADE,
  url         text NOT NULL,          -- 외부 http/https URL 전용
  sort_order  integer NOT NULL DEFAULT 0,
  caption     text,
  created_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE spot_photos ENABLE ROW LEVEL SECURITY;
```

- `url`은 외부 http/https URL 전용. Supabase Storage path 미사용.
- `updated_at` 불필요 — caption/sort_order 수정은 삭제 후 재삽입으로 처리

### RLS 정책

모바일 앱은 anon 키로 published spots를 조회하므로, SELECT는 `anon, authenticated` 모두 허용.
INSERT/DELETE는 기존 테이블 패턴과 동일하게 `admin_users` 테이블 조인으로 제한.

```sql
-- anon + authenticated 모두 읽기 (published spot의 photos만)
CREATE POLICY "spot_photos_select"
ON spot_photos
FOR SELECT
TO anon, authenticated
USING (
  EXISTS (
    SELECT 1 FROM spots
    WHERE spots.id = spot_photos.spot_id
      AND spots.status = 'published'
  )
);

-- 어드민만 삽입
CREATE POLICY "spot_photos_insert"
ON spot_photos
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid())
);

-- 어드민만 삭제
CREATE POLICY "spot_photos_delete"
ON spot_photos
FOR DELETE
TO authenticated
USING (
  EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid())
);
```

---

## 2. JSON 데이터 구조

각 import JSON 파일의 spot 항목에 `photos` 배열 추가:

```json
{
  "slug": "jeju-jeongnong-ro",
  "name": "제주 전농로 왕벚꽃길",
  "thumbnail_url": "https://...",
  "photos": [
    { "url": "https://...", "sort_order": 0, "caption": "전농로 벚꽃 전경" },
    { "url": "https://...", "sort_order": 1, "caption": null },
    { "url": "https://...", "sort_order": 2, "caption": null }
  ]
}
```

- `thumbnail_url`: 기존 히어로 카드용 이미지, 유지
- `photos` 필드 없으면 `[]`로 처리 (optional, default [])

### Zod 스키마 수정 (`importSchema.ts`)

`photos`는 `importedSpotSchema`에만 추가 (spot 테이블 컬럼과 무관한 임포트 전용 필드):

```ts
const importedPhotoSchema = z.object({
  url: z.string().url(),
  sort_order: z.number().int().optional().default(0),
  caption: z.string().nullable().optional(),
});

// importedSpotSchema에 추가
photos: z.array(importedPhotoSchema).optional().default([]),
```

### import 스크립트 처리 (`actions.ts`)

`planImportWrite.ts`는 수정 없이 spot 테이블 데이터만 처리.
photos 처리는 `actions.ts` 루프에서 upsert 결과 id를 캡처한 뒤 별도로 실행:

```
toCreate 항목:
  1. createSpot(data) → 반환된 row.id 캡처
  2. DELETE FROM spot_photos WHERE spot_id = row.id
  3. INSERT INTO spot_photos (spot_id, url, sort_order, caption) ...

toUpdate 항목:
  1. updateSpot(plan.toUpdate[n].id, data) → plan.toUpdate[n].id 재사용
  2. DELETE FROM spot_photos WHERE spot_id = plan.toUpdate[n].id
  3. INSERT INTO spot_photos (spot_id, url, sort_order, caption) ...
```

photos가 빈 배열이면 DELETE만 실행 (INSERT 없음).

---

## 3. 모바일 앱 변경

### 3-1. 제거

- `ReviewSection` 컴포넌트를 `SpotDetailScreen`에서 제거
- `reviewRepository.ts` / `reviewKeys` import 제거 (파일 자체는 유지)

### 3-2. 신규 컴포넌트: `SpotPhotoGallery`

**파일 위치**: `apps/mobile/src/features/spot/components/SpotPhotoGallery.tsx`

**레이아웃 (C안 — Instagram 스타일)**

```
┌──────────────────────────────┐
│                              │
│        메인 사진 (대형)        │  ← 탭하면 전체화면 Modal
│                              │
└──────────────────────────────┘
┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐
│  1  │ │  2  │ │  3  │ │  4  │ │  5  │  ← 가로 스크롤 썸네일
└─────┘ └─────┘ └─────┘ └─────┘ └─────┘
```

- 썸네일 탭 → 메인 사진 교체 (로컬 state)
- 메인 사진 탭 → `Modal` 전체화면 뷰어 (단순 표시, 핀치줌 없음)
- **사진 0건**: 섹션 전체 숨김 (null 반환). `thumbnail_url` fallback 없음.

**SpotDetailScreen 내 삽입 위치**: `SpotHeroCard` 바로 아래, 방문 정보 섹션 위.
현재 하드코딩된 "운영 팁" 섹션은 이번 작업 범위에서 제외 (유지).

### 3-3. 데이터 페칭

**파일 위치**: `apps/mobile/src/shared/data/photoRepository.ts`

- `spotRepository.ts` JOIN 수정 없이, **별도 useQuery**로 분리
- `getPhotosBySpotId(spotId: string)`: `spot_photos` 테이블에서 `sort_order` 오름차순 조회
- React Query key: `photoKeys.bySpot(spotId)`
- `SpotDetailScreen`에서 `spot.id` 확보 후 두 번째 `useQuery`로 photos 조회

---

## 4. 어드민 패널 변경

**기존 라우트**: `apps/admin/app/(dashboard)/spots/[id]/page.tsx`
**기존 폼 컴포넌트**: `apps/admin/src/features/spots/SpotForm.tsx`

### 사진 CRUD Server Actions

spot 저장과 독립적인 별도 Server Actions:

```ts
// apps/admin/src/features/spots/photoActions.ts
addSpotPhotoAction(spotId, { url, sort_order, caption })
deleteSpotPhotoAction(photoId)
```

### Database 타입 업데이트

`apps/admin/src/lib/types.ts`의 `Database` 타입에 `spot_photos` 테이블 추가.

### SpotForm.tsx 수정

- 하단에 **사진 관리 섹션** 추가
  - 현재 등록된 사진 목록 표시 (URL, sort_order, caption)
  - URL 직접 입력 + sort_order + caption → "추가" 버튼 → `addSpotPhotoAction` 호출
  - 각 사진 "삭제" 버튼 → `deleteSpotPhotoAction` 호출
  - `ImageUploader` 컴포넌트 미사용 (URL 직접 입력 전용)
- review 관련 어드민 UI가 있다면 함께 제거

---

## 5. 구현 순서

1. Supabase 마이그레이션 — `spot_photos` 테이블 + RLS 정책 생성
2. `importSchema.ts` Zod 수정 — `photos` 배열 필드 추가
3. JSON 파일 업데이트 — 각 spot에 `photos` 배열 추가 (외부 URL)
4. `actions.ts` 수정 — spot upsert 후 `spot_photos` DELETE + INSERT 처리 (id 캡처 패턴)
5. `photoRepository.ts` 작성
6. `SpotPhotoGallery` 컴포넌트 작성
7. `SpotDetailScreen` 수정 — ReviewSection 제거, SpotPhotoGallery 삽입 (HeroCard 바로 아래)
8. 어드민 패널 — `types.ts` 업데이트 + `photoActions.ts` + `SpotForm.tsx` 사진 섹션 추가

---

## 6. 비고

- 외부 URL 사용 시 hotlinking이 차단된 사이트 주의 (Unsplash, 공식 관광청 권장)
- 추후 Supabase Storage로 전환 시 `url` 컬럼 값만 교체하면 됨
- `spot_reviews` 테이블은 DB에서 즉시 삭제하지 않고 추후 정리
- `reviewRepository.ts` 등 review 관련 코드는 파일 보존, import만 제거
- 하드코딩된 "운영 팁" 섹션(`SpotDetailScreen`)은 이번 범위 외
