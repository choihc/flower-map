# 설계 문서: Supabase + Vercel Blob 연동

**날짜**: 2026-03-27
**범위**: 어드민 Vercel Blob 이미지 업로드 / 모바일 Supabase 실데이터 연동

---

## 배경

모바일 앱은 현재 하드코딩된 목업 데이터(4개 스팟)를 사용 중이다. 어드민 대시보드는 Supabase와 연결되어 있으나, 썸네일 이미지 업로드(`uploadImage.ts`)가 스텁 상태다. 이 작업은 두 가지를 동시에 완성한다:

1. 어드민에서 Vercel Blob으로 이미지를 업로드하고 URL을 스팟 데이터에 저장
2. 모바일 앱이 Supabase에서 실데이터를 읽어 표시

---

## 전체 아키텍처

```
[어드민 (Next.js)]
  SpotForm
    → ImageUploader 컴포넌트
      → POST /api/upload-image (서버 라우트)
        → @vercel/blob (BLOB_READ_WRITE_TOKEN)
          → blob URL 반환
    → thumbnail_url 필드에 URL 자동 입력
    → Supabase DB 저장 (spots 테이블)

[모바일 (React Native / Expo)]
  Supabase Client (EXPO_PUBLIC_ 환경 변수)
    → spotRepository.ts (async 쿼리)
      → @tanstack/react-query (캐싱, 리패치)
        → 화면별 스켈레톤 → 데이터 렌더링
          → thumbnail_url 있으면 URL 이미지, 없으면 BloomArt fallback
```

---

## 파트 1: 어드민 — Vercel Blob 이미지 업로드

### 변경 파일

| 파일 | 종류 | 설명 |
|------|------|------|
| `apps/admin/package.json` | 수정 | `@vercel/blob` 추가 |
| `apps/admin/.env.local` | 기존 | `BLOB_READ_WRITE_TOKEN` 이미 세팅됨 |
| `apps/admin/app/api/upload-image/route.ts` | 신규 | 서버 사이드 Blob 업로드 API 라우트 |
| `apps/admin/src/lib/blob/uploadImage.ts` | 수정 | 스텁 → 실제 구현 (API route 호출) |
| `apps/admin/src/features/spots/SpotForm.tsx` | 수정 | 텍스트 인풋 → 파일 선택 + 업로드 UI |

### 업로드 흐름

```
사용자: 파일 선택
  → ImageUploader: 파일 미리보기 표시
  → "업로드" 버튼 클릭
    → uploadImage(file) 호출
      → POST /api/upload-image (FormData)
        → put(filename, body, { access: 'public' }) via @vercel/blob
          → { url } 반환
    → thumbnail_url hidden input에 URL 저장
    → 미리보기 이미지 URL로 교체
```

### API 라우트 설계

```
POST /api/upload-image
  Content-Type: multipart/form-data
  Body: { file: File }

Response (성공):
  { success: true, url: "https://..." }

Response (실패):
  { success: false, error: "..." }
```

- `BLOB_READ_WRITE_TOKEN`은 서버에서만 사용 (클라이언트 노출 없음)
- 파일 크기 제한: 5MB
- 허용 타입: image/jpeg, image/png, image/webp

### SpotForm 이미지 UI

- 기존 `thumbnail_url` 텍스트 인풋 → `ImageUploader` 컴포넌트로 교체
- 업로드 전: 파일 선택 버튼 + 드래그 영역
- 업로드 중: 로딩 스피너
- 업로드 후: 미리보기 이미지 + "다시 선택" 버튼
- 기존 URL이 있는 경우(수정 모드): 현재 이미지 미리보기로 초기 표시

---

## 파트 2: 모바일 — Supabase + React Query 연동

### 추가 패키지

```json
"@supabase/supabase-js": "^2.57.4",
"@tanstack/react-query": "^5.x"
```

### 환경 변수

Expo는 `EXPO_PUBLIC_` 접두사 필수 (빌드 타임에 번들에 포함됨).

`apps/mobile/.env.local`:
```
EXPO_PUBLIC_SUPABASE_URL=https://ktmykdcmknaqsomzeank.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=<anon key>
```

### 신규 파일

| 파일 | 설명 |
|------|------|
| `apps/mobile/src/shared/lib/supabase.ts` | Supabase 클라이언트 싱글톤 |
| `apps/mobile/src/shared/lib/queryClient.ts` | QueryClient 설정 (staleTime 등) |

### 수정 파일

| 파일 | 변경 내용 |
|------|----------|
| `src/shared/data/types.ts` | `PublishedSpotRow`에 `thumbnail_url: string \| null` 추가 |
| `src/shared/data/spotRepository.ts` | mock import 제거, Supabase async 쿼리로 전환 |
| `src/shared/mocks/spots.ts` | 삭제 (더 이상 사용 안 함) |
| `src/shared/mocks/spotAssets.ts` | 유지 (로컬 이미지 fallback용으로 한시적 활용 가능) |
| `app/_layout.tsx` | `QueryClientProvider`로 앱 전체 래핑 |

### spotRepository.ts 변경 방향

```typescript
// Before (동기)
export function getPublishedSpots(): FlowerSpot[]

// After (비동기, React Query와 함께 사용)
export async function getPublishedSpots(): Promise<FlowerSpot[]>
```

Supabase 쿼리:
```sql
SELECT spots.*, flowers.name_ko
FROM spots
JOIN flowers ON spots.flower_id = flowers.id
WHERE spots.status = 'published'
ORDER BY spots.display_order ASC
```

### React Query 사용 패턴

```typescript
// 쿼리 키 상수
export const spotKeys = {
  all: ['spots'] as const,
  detail: (slug: string) => ['spots', slug] as const,
}

// 화면에서 사용
const { data: spots, isLoading } = useQuery({
  queryKey: spotKeys.all,
  queryFn: getPublishedSpots,
})
```

### 이미지 처리 전략

```
thumbnail_url 있음 → <Image source={{ uri: thumbnail_url }} />
thumbnail_url 없음 → <BloomArt /> (기존 fallback 유지)
```

### 스켈레톤 UI 전략

별도 스켈레톤 라이브러리 없이 React Native의 기본 View + 반투명 색상으로 플레이스홀더 구현.

| 화면 | 스켈레톤 항목 |
|------|-------------|
| HomeScreen | 히어로 카드 (390px 높이), 꽃 타일 4개, 스팟 카드 4개 |
| MapScreen | 지도는 즉시 표시, 하단 리스트 스켈레톤 |
| SpotListScreen | 리스트 아이템 4개 반복 |
| SpotDetailScreen | 히어로 이미지, 텍스트 블록 3개 |

---

## 데이터 흐름 요약

```
어드민에서 스팟 등록
  → 이미지 Vercel Blob 업로드 → thumbnail_url 획득
  → Supabase spots 테이블에 status='published'로 저장

모바일 앱 실행
  → React Query가 getPublishedSpots() 호출
    → Supabase에서 published 스팟 조회
      → 스켈레톤 표시 중 → 데이터 도착 → 렌더링
        → thumbnail_url 있으면 Blob URL 이미지, 없으면 BloomArt
```

---

## 제외 범위 (이번 작업 아님)

- 오프라인 캐시 (AsyncStorage 등)
- 푸시 알림
- 실시간 구독 (Supabase Realtime)
- 이미지 리사이징/최적화 파이프라인
