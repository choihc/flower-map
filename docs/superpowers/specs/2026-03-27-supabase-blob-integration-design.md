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
      → POST /api/upload (기존 라우트)
        → route.ts → uploadImage.ts → @vercel/blob put()
          → result.data.url 반환
    → thumbnail_url 필드에 URL 자동 입력
    → Supabase DB 저장 (spots 테이블)

[모바일 (React Native / Expo)]
  Supabase Client (EXPO_PUBLIC_ 환경 변수, auth 없음)
    → spotRepository.ts (async 쿼리 2개)
      → @tanstack/react-query (캐싱, 리패치)
        → 화면별 스켈레톤 → 데이터 렌더링
          → thumbnailUrl 있으면 URL 이미지, 없으면 BloomArt fallback
```

---

## 파트 1: 어드민 — Vercel Blob 이미지 업로드

### 기존 구조

```
app/api/upload/route.ts      ← POST 처리, uploadImage() 호출 (변경 없음)
src/lib/blob/uploadImage.ts  ← 스텁 → 이번에 구현
src/lib/blob/uploadStatus.ts ← HTTP 상태코드 매핑 (변경 없음)
```

`UploadImageResult` 타입 (변경 없음):
```typescript
// 성공
{ success: true, data: { filename: string; contentType: string | null; url: string }, error: null }
// 실패
{ success: false, data: { filename: string; contentType: string | null; url: null }, error: { code, message } }
```

### 변경 파일

| 파일 | 종류 | 설명 |
|------|------|------|
| `apps/admin/package.json` | 수정 | `@vercel/blob` 추가 |
| `apps/admin/src/lib/blob/uploadImage.ts` | 수정 | 스텁 → `put()` 실제 구현 |
| `apps/admin/src/lib/blob/uploadImage.test.ts` | 수정 | `vi.mock('@vercel/blob')`으로 재작성 |
| `apps/admin/src/features/spots/SpotForm.tsx` | 수정 | `thumbnail_url` 텍스트 인풋 → `ImageUploader` 컴포넌트 교체 |

### uploadImage.ts 구현

```typescript
import { put } from '@vercel/blob';

export async function uploadImage(file: File): Promise<UploadImageResult> {
  const blob = await put(file.name, file, { access: 'public' });
  return {
    success: true,
    data: { filename: file.name, contentType: file.type || null, url: blob.url },
    error: null,
  };
}
```

### uploadImage.test.ts 테스트 전략

```typescript
vi.mock('@vercel/blob', () => ({
  put: vi.fn().mockResolvedValue({ url: 'https://blob.example.com/test.jpg' }),
}));

// 성공 케이스: put() 호출 시 result.data.url 반환 확인
// 실패 케이스: put() reject 시 에러 처리 확인 (선택)
```

### SpotForm 이미지 UI

- 기존 `thumbnail_url` 텍스트 인풋 → `ImageUploader` 컴포넌트로 교체
- 업로드 전: 파일 선택 버튼
- 업로드 중: 로딩 스피너
- 업로드 후: 미리보기 이미지 + "다시 선택" 버튼
- 수정 모드(기존 URL 있는 경우): 현재 이미지 미리보기로 초기 표시

---

## 파트 2: 모바일 — Supabase + React Query 연동

### 추가 패키지

```json
"@supabase/supabase-js": "^2.57.4",
"@tanstack/react-query": "^5.x"
```

### 환경 변수

Expo는 `EXPO_PUBLIC_` 접두사 필수 (빌드 타임에 번들에 인라인됨).

`apps/mobile/.env.local` (로컬 개발용):
```
EXPO_PUBLIC_SUPABASE_URL=https://ktmykdcmknaqsomzeank.supabase.co
EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY=<publishable key>
```

> EAS Build 등 CI 환경에서는 EAS 환경변수를 별도 설정해야 한다.

### Supabase 클라이언트 설정

모바일 앱은 **인증 없이 공개 데이터(published spots)만 읽는다.** 따라서 `AsyncStorage` 어댑터가 불필요하다. 세션 유지 옵션을 비활성화한 단순 클라이언트를 사용한다:

```typescript
// src/shared/lib/supabase.ts
import { createClient } from '@supabase/supabase-js';

export const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL!,
  process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
  { auth: { persistSession: false, autoRefreshToken: false } },
);
```

### 신규 파일

| 파일 | 설명 |
|------|------|
| `apps/mobile/src/shared/lib/supabase.ts` | Supabase 클라이언트 싱글톤 (auth 비활성화) |
| `apps/mobile/src/shared/lib/queryClient.ts` | QueryClient 설정 (staleTime: 5분) |

### 수정 파일

| 파일 | 변경 내용 |
|------|----------|
| `src/shared/data/types.ts` | `PublishedSpotRow`에 `thumbnail_url: string \| null` 추가. `FlowerSpot`에 `thumbnailUrl: string \| null` 추가 |
| `src/shared/data/spotMappers.ts` | `toFlowerSpot()`에 `thumbnailUrl: row.thumbnail_url ?? null` 매핑 추가 |
| `src/shared/data/spotMappers.test.ts` | 기존 fixture에 `thumbnail_url: null` 추가. `thumbnailUrl` 매핑 검증 케이스 추가 |
| `src/shared/data/spotRepository.ts` | mock import 제거. `getPublishedSpots`, `getPublishedSpotBySlug` 2개만 유지하며 async 전환. `getPublishedFlowerLabels`, `getPublishedRegionSummaries` **삭제** |
| `src/shared/data/spotRepository.test.ts` | 4개 함수 → 2개 함수 기준으로 재작성. Supabase client를 `vi.mock`으로 교체 |
| `src/shared/mocks/spots.ts` | 삭제 |
| `src/shared/mocks/spotAssets.ts` | 삭제 |
| `src/features/spot/spotDetailRoute.ts` | `resolveSpotSlug()`가 `getPublishedSpotBySlug()`를 동기 호출 중 → slug 형식만 검증하는 순수 함수로 단순화 (존재 여부는 쿼리에서 처리) |
| `src/features/spot/spotDetailRoute.test.ts` | 단순화된 동작 기준으로 재작성 |
| `src/features/home/screens/HomeScreen.tsx` | `spotAssets` import 제거. `thumbnailUrl` 기반 이미지. `getPublishedFlowerLabels`/`getPublishedRegionSummaries` 호출 제거 → spots 결과에서 파생. 스켈레톤 추가 |
| `src/features/map/screens/MapScreen.tsx` | `spotAssets` import 제거. `thumbnailUrl` 기반 이미지. 스켈레톤 추가 |
| `src/features/map/screens/SpotListScreen.tsx` | 스켈레톤 추가 |
| `src/features/spot/screens/SpotDetailScreen.tsx` | `spotAssets` import 제거. `thumbnailUrl` 기반 이미지. 스켈레톤 추가 |
| `app/_layout.tsx` | `QueryClientProvider`로 앱 전체 래핑 |

### spotRepository.ts — 쿼리 설계

```typescript
export async function getPublishedSpots(): Promise<FlowerSpot[]> {
  const { data } = await supabase
    .from('spots')
    .select('*, flowers(name_ko)')
    .eq('status', 'published')
    .order('display_order', { ascending: true });
  return (data ?? []).map((row) => toFlowerSpot(row));
}

export async function getPublishedSpotBySlug(slug: string): Promise<FlowerSpot | undefined> {
  const { data } = await supabase
    .from('spots')
    .select('*, flowers(name_ko)')
    .eq('status', 'published')
    .eq('slug', slug)
    .maybeSingle();
  return data ? toFlowerSpot(data) : undefined;
}
```

### React Query 쿼리 키 및 화면 사용 패턴

```typescript
// 쿼리 키 상수
export const spotKeys = {
  all: ['spots'] as const,
  detail: (slug: string) => ['spots', slug] as const,
}

// 전체 스팟 조회
const { data: spots = [], isLoading } = useQuery({
  queryKey: spotKeys.all,
  queryFn: getPublishedSpots,
})

// 꽃/지역 목록은 spots에서 파생 (별도 쿼리 없음)
const flowerLabels = [...new Set(spots.map((s) => s.flower))]
const regionSummaries = [...new Set(spots.map((s) => toRegionSummary(s.location)))]

// 단일 스팟 (SpotDetailScreen)
const { data: spot, isLoading } = useQuery({
  queryKey: spotKeys.detail(slug),
  queryFn: () => getPublishedSpotBySlug(slug),
})
```

### 이미지 처리 전략

```
FlowerSpot.thumbnailUrl 있음 → <Image source={{ uri: thumbnailUrl }} />
                                또는 <ImageBackground source={{ uri: thumbnailUrl }} />
FlowerSpot.thumbnailUrl 없음 → <BloomArt /> (fallback)
```

### 스켈레톤 UI 전략

별도 라이브러리 없이 React Native 기본 View + 반투명 색상으로 구현.

| 화면 | 스켈레톤 항목 |
|------|-------------|
| HomeScreen | 히어로 카드 (390px), 꽃 타일 4개, 스팟 카드 4개 |
| MapScreen | 지도는 즉시 표시, 하단 리스트 스켈레톤 |
| SpotListScreen | 리스트 아이템 4개 반복 |
| SpotDetailScreen | 히어로 이미지, 텍스트 블록 3개 |

---

## 데이터 흐름 요약

```
어드민에서 스팟 등록
  → 이미지 /api/upload → Vercel Blob → thumbnail_url 획득
  → Supabase spots 테이블에 status='published'로 저장

모바일 앱 실행
  → React Query가 getPublishedSpots() 호출
    → Supabase에서 published 스팟 조회
      → 스켈레톤 표시 중 → 데이터 도착 → 렌더링
        → thumbnailUrl 있으면 Blob URL 이미지, 없으면 BloomArt
```

---

## 제외 범위 (이번 작업 아님)

- 오프라인 캐시 (AsyncStorage 등)
- 푸시 알림
- 실시간 구독 (Supabase Realtime)
- 이미지 리사이징/최적화 파이프라인
- EAS Build 환경변수 설정
