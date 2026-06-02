# Agoda → trip.com 예약 제휴 전환 구현 플랜

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**연관 스펙:** `docs/specs/2026-06-02-hocance-booking-affiliate-link-spec.md`

**Goal:** 호캉스 예약 버튼이 호텔별 trip.com 제휴 URL(없으면 trip.com 검색)로 연결되도록, Agoda CID+hid 클라이언트 생성 방식을 DB 저장 URL 방식으로 전환한다.

**Architecture:** DB `stays`에 `tripcom_booking_url` 컬럼을 신설(컬럼 전략 A). 모바일은 저장된 URL을 그대로 열고, 없으면 `kr.trip.com` 검색으로 fallback. 어드민의 "Agoda 호텔 ID" 입력을 "trip.com 예약 URL" 입력으로 교체. 기존 `agoda_hotel_id` 컬럼은 **이번 PR에서 제거하지 않고 유지**하여, OTA 미수신 구버전 앱이 전환기 동안 기존 agoda 동작을 유지하도록 한다(후속 마이그레이션에서 drop).

**Tech Stack:** Supabase(raw SQL migration), Next.js(App Router, server actions), React Native/Expo, zod, vitest.

---

## 파일 구조 (변경/생성)

| 구분 | 파일 | 책임 |
|------|------|------|
| 생성 | `supabase/migrations/20260602_stays_tripcom_booking_url.sql` | `tripcom_booking_url` 컬럼 추가 |
| 수정 | `apps/web/src/lib/types.ts` | StayRow/StayInsert/StayUpdate에 필드 추가 |
| 수정 | `apps/web/src/features/stays/staySchema.ts` | `tripcom_booking_url` 필드(+ `agoda_hotel_id` 제거) |
| 수정 | `apps/web/src/features/stays/staySchema.test.ts` | 신규 필드 테스트 |
| 수정 | `apps/web/src/lib/data/stays.ts` | `buildStayWriteInput`, `updateStayTripcomUrl` |
| 수정 | `apps/web/src/features/stays/actions.ts` | `updateStayTripcomUrlAction` |
| 수정 | `apps/web/src/features/stays/StayDetailForm.tsx` | trip.com URL 카드 |
| 수정 | `apps/web/src/features/import/ImportFormatGuide.tsx` | 안내·예시 |
| 삭제 | `apps/web/src/features/stays/agodaHidParser.ts` + `.test.ts` | hid 파서 불필요 |
| 수정 | `apps/mobile/src/shared/data/types.ts` | `Stay.tripcomBookingUrl`, `StayRow.tripcom_booking_url` |
| 수정 | `apps/mobile/src/shared/data/stayMappers.ts` + `.test.ts` | 매핑 |
| 수정 | `apps/mobile/src/features/stays/lib/affiliateHotel.ts` + `.test.ts` | URL 결정·검색·오픈 |
| 수정 | `apps/mobile/.../StayDetailScreen.tsx`, `StayListScreen.tsx`, `HocanceTop5Section.tsx`, `NearbyStaysSection.tsx` | 호출부·문구 |
| 수정 | 모바일 픽스처 테스트(스윕) | `agodaHotelId` → `tripcomBookingUrl` |
| 수정 | `apps/mobile/.env.local` | `EXPO_PUBLIC_AGODA_CID` 제거 |

**테스트 실행 규칙:** web/mobile 각 앱 디렉터리에서 `npx vitest run <path>`. 타입체크는 각 앱에서 `npx tsc --noEmit`.

---

## Task 0: 작업 브랜치 생성

- [ ] **Step 1: feature 브랜치 분기**

```bash
git checkout -b feat/stays-tripcom-affiliate
```

---

## Task 1: DB 마이그레이션 — `tripcom_booking_url` 추가

**Files:**
- Create: `supabase/migrations/20260602_stays_tripcom_booking_url.sql`

- [ ] **Step 1: 마이그레이션 파일 작성**

```sql
-- stays 테이블에 trip.com 제휴 예약 URL 컬럼 추가.
-- 값이 있으면 앱이 해당 URL을 그대로 열고, 없으면 trip.com 호텔명 검색으로 fallback.
-- 기존 agoda_hotel_id 컬럼은 전환기 동안 유지(구버전 앱 호환). OTA 보급 후 별도 마이그레이션으로 drop.
alter table public.stays
  add column if not exists tripcom_booking_url text;

comment on column public.stays.tripcom_booking_url is
  'trip.com 제휴 예약 URL 전체. 값이 있으면 그대로 오픈, null이면 kr.trip.com 호텔명 검색으로 fallback.';
```

- [ ] **Step 2: 적용 (운영 DB는 배포 절차에서 별도 적용)**

로컬/스테이징에 supabase CLI가 있으면 `supabase db push`. 없으면 Supabase 대시보드 SQL 에디터에 위 SQL 실행. (이 플랜에서는 파일 작성까지가 코드 산출물.)

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/20260602_stays_tripcom_booking_url.sql
git commit -m "feat(db): stays에 tripcom_booking_url 컬럼 추가

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 2: 웹 타입 — StayRow/StayInsert/StayUpdate 필드 추가

**Files:**
- Modify: `apps/web/src/lib/types.ts:233` (StayRow), `:265` (StayInsert), StayUpdate

- [ ] **Step 1: StayRow에 필드 추가**

`apps/web/src/lib/types.ts`의 `StayRow`에서 `agoda_hotel_id: string | null;` 줄 **바로 아래**에 추가(agoda 줄은 유지 — 컬럼 존재):

```ts
  agoda_hotel_id: string | null;
  tripcom_booking_url: string | null;
```

- [ ] **Step 2: StayInsert에 필드 추가**

`StayInsert`의 `agoda_hotel_id?: string | null;` 아래에 추가:

```ts
  agoda_hotel_id?: string | null;
  tripcom_booking_url?: string | null;
```

- [ ] **Step 3: StayUpdate 확인**

`StayUpdate`가 `Partial<StayInsert>` 또는 유사 구조면 자동 반영됨. 명시적 정의라면 동일하게 `tripcom_booking_url?: string | null;` 추가. (파일에서 `StayUpdate` 정의를 열어 확인.)

- [ ] **Step 4: 타입체크**

Run: `cd apps/web && npx tsc --noEmit`
Expected: PASS (기존 코드가 agoda를 계속 참조하므로 이 시점엔 에러 없음)

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/lib/types.ts
git commit -m "feat(web): Stay 타입에 tripcom_booking_url 추가

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 3: import 스키마 — `tripcom_booking_url` 필드 (TDD)

**Files:**
- Modify: `apps/web/src/features/stays/staySchema.ts:43`
- Test: `apps/web/src/features/stays/staySchema.test.ts:146-159`

- [ ] **Step 1: 실패 테스트 작성**

`staySchema.test.ts`의 기존 `agoda_hotel_id` 관련 3개 테스트(146~159줄)를 아래로 **교체**:

```ts
  it('tripcom_booking_url null/생략 모두 허용', () => {
    expect(staySchema.safeParse({ ...baseStay }).success).toBe(true);
    expect(staySchema.safeParse({ ...baseStay, tripcom_booking_url: null }).success).toBe(true);
  });

  it('tripcom_booking_url 유효한 https URL 허용', () => {
    const url = 'https://kr.trip.com/hotels/detail/?hotelId=123&Allianceid=456&SID=789';
    const r = staySchema.parse({ ...baseStay, tripcom_booking_url: url });
    expect(r.tripcom_booking_url).toBe(url);
  });

  it('tripcom_booking_url의 비-http(s) 스킴 차단 (XSS 방지)', () => {
    expect(staySchema.safeParse({ ...baseStay, tripcom_booking_url: 'javascript:alert(1)' }).success).toBe(false);
    expect(staySchema.safeParse({ ...baseStay, tripcom_booking_url: 'not-a-url' }).success).toBe(false);
  });
```

- [ ] **Step 2: 테스트 실패 확인**

Run: `cd apps/web && npx vitest run src/features/stays/staySchema.test.ts`
Expected: FAIL (스키마에 `tripcom_booking_url` 없음 → 알 수 없는 키 또는 타입 미정)

- [ ] **Step 3: 스키마 수정**

`staySchema.ts`의 `agoda_hotel_id: z.string().trim().min(1).nullable().optional(),` 줄(43)을 아래로 **교체**:

```ts
    tripcom_booking_url: httpsOnlyUrlSchema.nullable().optional(),
```

(`httpsOnlyUrlSchema`는 같은 파일 상단에 이미 정의되어 있음.)

- [ ] **Step 4: 테스트 통과 확인**

Run: `cd apps/web && npx vitest run src/features/stays/staySchema.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/features/stays/staySchema.ts apps/web/src/features/stays/staySchema.test.ts
git commit -m "feat(web): stay import 스키마 agoda_hotel_id를 tripcom_booking_url로 교체

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 4: 웹 데이터 계층 — `buildStayWriteInput` / `updateStayTripcomUrl`

**Files:**
- Modify: `apps/web/src/lib/data/stays.ts:20` (buildStayWriteInput), `:95-103` (update 함수)

- [ ] **Step 1: buildStayWriteInput 필드 교체**

`stays.ts`의 `agoda_hotel_id: emptyToNull(input.agoda_hotel_id),` 줄을 아래로 **교체**:

```ts
    tripcom_booking_url: emptyToNull(input.tripcom_booking_url),
```

- [ ] **Step 2: update 함수 교체**

`updateStayAgodaHotelId` 함수 전체(주석 포함)를 아래로 **교체**:

```ts
/**
 * 호텔 trip.com 예약 URL 업데이트. null이면 컬럼을 비움 (검색 fallback).
 */
export async function updateStayTripcomUrl(
  client: SupabaseClient<Database>,
  id: string,
  url: string | null,
): Promise<void> {
  const update: StayUpdate = { tripcom_booking_url: url };
  const { error } = await (client.from('stays') as any).update(update).eq('id', id);
  if (error != null) throw error;
}
```

- [ ] **Step 3: 타입체크**

Run: `cd apps/web && npx tsc --noEmit`
Expected: FAIL — `actions.ts`가 아직 `updateStayAgodaHotelId`를 import (다음 Task에서 해결). 이 시점 에러는 예상된 것.

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/lib/data/stays.ts
git commit -m "feat(web): stays 데이터 계층을 tripcom_booking_url로 전환

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 5: 웹 서버 액션 — `updateStayTripcomUrlAction`

**Files:**
- Modify: `apps/web/src/features/stays/actions.ts`

- [ ] **Step 1: import 및 액션 교체**

`actions.ts` 상단 import에서 다음 줄을 교체:
- 기존: `import { bulkUpdateStayStatus, updateStayAgodaHotelId, updateStayThumbnail } from '@/lib/data/stays';`
- 변경: `import { bulkUpdateStayStatus, updateStayTripcomUrl, updateStayThumbnail } from '@/lib/data/stays';`

그리고 `import { parseAgodaHotelId } from './agodaHidParser';` 줄 **삭제**.

`updateStayAgodaHotelIdAction` 함수 전체(주석 포함, 43~70줄)를 아래로 **교체**:

```ts
/**
 * 호텔 trip.com 예약 URL 업데이트.
 * 입력은 전체 URL 또는 빈 문자열(→ null, 검색 fallback).
 * http(s) 스킴만 허용 — XSS 방어. 비-http(s)면 Error throw(폼이 메시지 표시).
 */
export async function updateStayTripcomUrlAction(id: string, rawUrl: string): Promise<void> {
  const supabase = await createServerSupabaseClient();
  const client = supabase as unknown as SupabaseClient<Database>;

  const trimmed = rawUrl.trim();
  let url: string | null = null;
  if (trimmed.length > 0) {
    if (!/^https?:\/\//i.test(trimmed)) {
      throw new Error('예약 URL은 http(s)로 시작하는 전체 URL이어야 합니다.');
    }
    url = trimmed;
  }

  await updateStayTripcomUrl(client, id, url);

  revalidatePath('/admin/stays');
  revalidatePath(`/admin/stays/${id}`);
}
```

- [ ] **Step 2: 타입체크**

Run: `cd apps/web && npx tsc --noEmit`
Expected: FAIL — `StayDetailForm.tsx`가 아직 `updateStayAgodaHotelIdAction` 참조(다음 Task). 예상된 에러.

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/features/stays/actions.ts
git commit -m "feat(web): updateStayTripcomUrlAction 추가 (agoda 액션 대체)

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 6: 어드민 폼 — trip.com 예약 URL 카드

**Files:**
- Modify: `apps/web/src/features/stays/StayDetailForm.tsx`

- [ ] **Step 1: import 교체**

`import { updateStayAgodaHotelIdAction, updateStayThumbnailAction } from './actions';`
→ `import { updateStayThumbnailAction, updateStayTripcomUrlAction } from './actions';`

- [ ] **Step 2: 상태/핸들러 교체**

`agodaPending`/`agodaMessage` 상태와 `handleAgodaSubmit`를 아래로 **교체**:

```tsx
  const [tripcomPending, startTripcomTransition] = useTransition();
  const [tripcomMessage, setTripcomMessage] = useState<{ kind: 'success' | 'error'; text: string } | null>(null);

  function handleTripcomSubmit(formData: FormData) {
    const raw = String(formData.get('tripcom_booking_url_input') ?? '');
    setTripcomMessage(null);
    startTripcomTransition(async () => {
      try {
        await updateStayTripcomUrlAction(stay.id, raw);
        setTripcomMessage({ kind: 'success', text: 'trip.com 예약 URL을 저장했습니다.' });
        router.refresh();
      } catch (error) {
        setTripcomMessage({
          kind: 'error',
          text: error instanceof Error ? error.message : 'trip.com 예약 URL 저장 중 오류가 발생했습니다.',
        });
      }
    });
  }
```

- [ ] **Step 3: 카드 JSX 교체**

"Agoda 호텔 ID (예약 직링크)" 카드(`<Card …xl:col-span-full>` 블록 전체)를 아래로 **교체**:

```tsx
      <Card className="overflow-hidden xl:col-span-full">
        <CardHeader className="px-6 py-6">
          <CardTitle>trip.com 예약 URL</CardTitle>
          <CardDescription>
            trip.com 제휴 예약 URL 전체를 붙여넣으세요. 비우면 호텔명으로 trip.com 검색이 열립니다.
          </CardDescription>
        </CardHeader>
        <CardContent className="px-6 pb-6">
          <form action={handleTripcomSubmit} className="space-y-4">
            <div className="rounded-2xl border border-border bg-background px-4 py-3">
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm font-medium text-foreground">현재 상태</span>
                {stay.tripcom_booking_url ? (
                  <Badge variant="default" className="rounded-full px-2.5 py-1">
                    직링크 활성
                  </Badge>
                ) : (
                  <Badge variant="outline" className="rounded-full px-2.5 py-1">
                    검색 fallback
                  </Badge>
                )}
              </div>
              {stay.tripcom_booking_url ? (
                <a
                  href={stay.tripcom_booking_url}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-2 block break-all text-sm text-blue-600 underline"
                >
                  {stay.tripcom_booking_url}
                </a>
              ) : (
                <p className="mt-2 text-sm text-muted-foreground">
                  URL이 없어 호텔명 검색으로 fallback됩니다.
                </p>
              )}
            </div>
            <div className="space-y-2">
              <label htmlFor="tripcom_booking_url_input" className="text-sm font-medium text-foreground">
                trip.com 예약 URL 입력
              </label>
              <input
                id="tripcom_booking_url_input"
                name="tripcom_booking_url_input"
                type="text"
                defaultValue={stay.tripcom_booking_url ?? ''}
                placeholder="https://kr.trip.com/hotels/detail/?hotelId=...&Allianceid=...&SID=..."
                className="w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm"
              />
            </div>
            <div className="flex items-center gap-3">
              <Button type="submit" disabled={tripcomPending}>
                저장
              </Button>
              {tripcomMessage ? (
                <p
                  className={
                    tripcomMessage.kind === 'success'
                      ? 'text-sm text-foreground'
                      : 'text-sm text-destructive'
                  }
                  role={tripcomMessage.kind === 'error' ? 'alert' : undefined}
                >
                  {tripcomMessage.text}
                </p>
              ) : null}
            </div>
          </form>
        </CardContent>
      </Card>
```

- [ ] **Step 4: 타입체크 + 빌드 확인**

Run: `cd apps/web && npx tsc --noEmit`
Expected: PASS (web 전 영역에서 agoda 참조 제거됨 — Task 8에서 파서 삭제 후 완전 정리)

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/features/stays/StayDetailForm.tsx
git commit -m "feat(web): 어드민 stay 상세 폼을 trip.com 예약 URL 입력으로 교체

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 7: import 안내 — ImportFormatGuide 갱신

**Files:**
- Modify: `apps/web/src/features/import/ImportFormatGuide.tsx:72,93,108,123`

- [ ] **Step 1: 예시 JSON 키 교체 (93, 123줄)**

두 곳의 `"agoda_hotel_id": "12345678",`를 아래로 **교체**:

```
      "tripcom_booking_url": "https://kr.trip.com/hotels/detail/?hotelId=12345678&Allianceid=AAA&SID=BBB",
```

- [ ] **Step 2: 힌트 문구 교체 (72, 108줄)**

72줄 hint에서 `agoda_hotel_id` 설명 문장을 아래로 **교체**:
- 기존: `cid=12345 / agoda_hotel_id 같은 placeholder URL/ID는 반드시 실제 값으로 교체하세요. agoda_hotel_id는 호텔 페이지로 직접 진입하기 위한 Agoda 호텔 식별자(hid)로, Agoda Partners 백오피스에서 조회 가능합니다. 없으면 호텔명 검색으로 fallback됩니다.`
- 변경: `tripcom_booking_url 같은 placeholder URL은 반드시 실제 값으로 교체하세요. tripcom_booking_url은 trip.com 제휴 예약 URL 전체로, 입력하면 그 URL로 바로 진입합니다. 없으면 호텔명으로 trip.com 검색 fallback됩니다.`

108줄 hint에서 `agoda_hotel_id` 언급을 아래로 **교체**:
- 기존: `…/booking_query_override/thumbnail_url/agoda_hotel_id 등 옵션 필드는 3번 카드 예시 참고. agoda_hotel_id를 입력하면 호텔 페이지로 직접 진입 (없으면 호텔명 검색 fallback).`
- 변경: `…/booking_query_override/thumbnail_url/tripcom_booking_url 등 옵션 필드는 3번 카드 예시 참고. tripcom_booking_url을 입력하면 그 URL로 직접 진입 (없으면 호텔명 검색 fallback).`

- [ ] **Step 3: 타입체크**

Run: `cd apps/web && npx tsc --noEmit`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/features/import/ImportFormatGuide.tsx
git commit -m "docs(web): import 안내를 tripcom_booking_url로 갱신

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 8: agodaHidParser 삭제

**Files:**
- Delete: `apps/web/src/features/stays/agodaHidParser.ts`, `apps/web/src/features/stays/agodaHidParser.test.ts`

- [ ] **Step 1: 잔여 참조 확인**

Run: `grep -rn "agodaHidParser\|parseAgodaHotelId" apps/web/src`
Expected: 결과 없음(Task 5에서 import 제거 완료). 결과가 있으면 먼저 제거.

- [ ] **Step 2: 파일 삭제**

```bash
git rm apps/web/src/features/stays/agodaHidParser.ts apps/web/src/features/stays/agodaHidParser.test.ts
```

- [ ] **Step 3: web 전체 테스트 + 타입체크**

Run: `cd apps/web && npx tsc --noEmit && npx vitest run`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git commit -m "chore(web): 사용하지 않는 agodaHidParser 제거

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 9: 모바일 타입 — Stay/StayRow 필드 교체

**Files:**
- Modify: `apps/mobile/src/shared/data/types.ts:102` (Stay), `:128` (StayRow)

- [ ] **Step 1: Stay 필드 교체**

`Stay` 타입의 `agodaHotelId: string | null;`를 아래로 **교체**:

```ts
  tripcomBookingUrl: string | null;
```

- [ ] **Step 2: StayRow 필드 교체**

`StayRow` 타입의 `agoda_hotel_id: string | null;`를 아래로 **교체**:

```ts
  tripcom_booking_url: string | null;
```

- [ ] **Step 3: 타입체크**

Run: `cd apps/mobile && npx tsc --noEmit`
Expected: FAIL — 매퍼·호출부·픽스처가 아직 agoda 참조(다음 Task들). 예상된 에러.

- [ ] **Step 4: Commit**

```bash
git add apps/mobile/src/shared/data/types.ts
git commit -m "feat(mobile): Stay 타입을 tripcomBookingUrl로 교체

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 10: 모바일 매퍼 — toStay (TDD)

**Files:**
- Modify: `apps/mobile/src/shared/data/stayMappers.ts:33`
- Test: `apps/mobile/src/shared/data/stayMappers.test.ts:22,170-178`

- [ ] **Step 1: 테스트 픽스처 + 케이스 교체**

`stayMappers.test.ts`의 `baseStayRow`에서 `agoda_hotel_id: null,`(22줄)을 아래로 **교체**:

```ts
  tripcom_booking_url: null,
```

그리고 기존 `agoda_hotel_id` 매핑 테스트 2개(170~178줄)를 아래로 **교체**:

```ts
  it('tripcom_booking_url이 null이면 tripcomBookingUrl을 null로 매핑한다', () => {
    const stay = toStay({ ...baseStayRow, tripcom_booking_url: null });
    expect(stay.tripcomBookingUrl).toBeNull();
  });

  it('tripcom_booking_url이 있으면 tripcomBookingUrl로 그대로 매핑한다', () => {
    const url = 'https://kr.trip.com/hotels/detail/?hotelId=123';
    const stay = toStay({ ...baseStayRow, tripcom_booking_url: url });
    expect(stay.tripcomBookingUrl).toBe(url);
  });
```

- [ ] **Step 2: 테스트 실패 확인**

Run: `cd apps/mobile && npx vitest run src/shared/data/stayMappers.test.ts`
Expected: FAIL (매퍼가 아직 `agodaHotelId` 반환)

- [ ] **Step 3: 매퍼 수정**

`stayMappers.ts`의 `agodaHotelId: row.agoda_hotel_id ?? null,`(33줄)을 아래로 **교체**:

```ts
    tripcomBookingUrl: row.tripcom_booking_url ?? null,
```

- [ ] **Step 4: 테스트 통과 확인**

Run: `cd apps/mobile && npx vitest run src/shared/data/stayMappers.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add apps/mobile/src/shared/data/stayMappers.ts apps/mobile/src/shared/data/stayMappers.test.ts
git commit -m "feat(mobile): stayMappers를 tripcomBookingUrl로 전환

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 11: 모바일 affiliateHotel.ts 재작성 (TDD)

**Files:**
- Modify: `apps/mobile/src/features/stays/lib/affiliateHotel.ts`
- Test: `apps/mobile/src/features/stays/lib/affiliateHotel.test.ts`

- [ ] **Step 1: 테스트 파일 전체 교체 (실패 테스트)**

`affiliateHotel.test.ts` 전체를 아래로 **교체**:

```ts
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { Alert, Linking } from 'react-native';

import {
  buildTripcomHotelSearchUrl,
  openTripcomHotel,
  resolveBookingQuery,
} from './affiliateHotel';

describe('resolveBookingQuery', () => {
  it('override가 null이면 호텔명을 그대로 반환한다', () => {
    expect(resolveBookingQuery('호텔 나루', null)).toBe('호텔 나루');
  });
  it('override가 공백만 있으면 호텔명으로 폴백한다', () => {
    expect(resolveBookingQuery('호텔 나루', '   ')).toBe('호텔 나루');
  });
  it('override가 유효하면 그대로 사용한다', () => {
    expect(resolveBookingQuery('호텔 나루', '호텔 나루 인천')).toBe('호텔 나루 인천');
  });
});

describe('buildTripcomHotelSearchUrl', () => {
  it('kr.trip.com 호텔 리스트 + keyword + locale/curr 파라미터를 포함한다', () => {
    const url = buildTripcomHotelSearchUrl('호텔 나루');
    expect(url.startsWith('https://kr.trip.com/hotels/list')).toBe(true);
    expect(url).toContain(`keyword=${encodeURIComponent('호텔 나루')}`);
    expect(url).toContain('locale=ko-KR');
    expect(url).toContain('curr=KRW');
  });
  it('한글 검색어는 percent-encoded 된다', () => {
    const url = buildTripcomHotelSearchUrl('호텔 나루');
    expect(url).not.toContain('호텔');
  });
});

describe('openTripcomHotel', () => {
  beforeEach(() => { vi.restoreAllMocks(); });

  it('tripcomBookingUrl이 있으면 그 URL을 그대로 연다', async () => {
    const openSpy = vi.spyOn(Linking, 'openURL').mockResolvedValue(true as unknown as void);
    const url = 'https://kr.trip.com/hotels/detail/?hotelId=123&Allianceid=A&SID=B';
    await openTripcomHotel({ name: '호텔 나루', queryOverride: null, tripcomBookingUrl: url });
    expect(openSpy.mock.calls[0][0]).toBe(url);
  });

  it('tripcomBookingUrl이 null이면 검색 URL로 fallback', async () => {
    const openSpy = vi.spyOn(Linking, 'openURL').mockResolvedValue(true as unknown as void);
    await openTripcomHotel({ name: '호텔 나루', queryOverride: null, tripcomBookingUrl: null });
    const calledUrl = openSpy.mock.calls[0][0] as string;
    expect(calledUrl).toContain('keyword=');
    expect(calledUrl.startsWith('https://kr.trip.com/hotels/list')).toBe(true);
  });

  it('tripcomBookingUrl이 공백이면 검색 URL로 fallback', async () => {
    const openSpy = vi.spyOn(Linking, 'openURL').mockResolvedValue(true as unknown as void);
    await openTripcomHotel({ name: '호텔 나루', queryOverride: null, tripcomBookingUrl: '   ' });
    expect((openSpy.mock.calls[0][0] as string)).toContain('keyword=');
  });

  it('Linking 실패 시 Alert.alert가 호출된다', async () => {
    vi.spyOn(Linking, 'openURL').mockRejectedValue(new Error('cannot open'));
    const alertSpy = vi.spyOn(Alert, 'alert').mockImplementation(() => {});
    await openTripcomHotel({ name: '호텔 나루', queryOverride: null, tripcomBookingUrl: null });
    expect(alertSpy).toHaveBeenCalledTimes(1);
    expect(alertSpy.mock.calls[0][0]).toContain('예약');
  });
});
```

- [ ] **Step 2: 테스트 실패 확인**

Run: `cd apps/mobile && npx vitest run src/features/stays/lib/affiliateHotel.test.ts`
Expected: FAIL (`buildTripcomHotelSearchUrl`/`openTripcomHotel` 미정의)

- [ ] **Step 3: affiliateHotel.ts 전체 교체**

`affiliateHotel.ts` 전체를 아래로 **교체**:

```ts
import { Alert, Linking } from 'react-native';

// trip.com 제휴 예약 링크.
// 호텔별 tripcom_booking_url(전체 제휴 URL)이 있으면 그대로 열고,
// 없으면 kr.trip.com 호텔명 검색으로 fallback (검색은 제휴 추적 없음).
const TRIPCOM_HOTEL_SEARCH_BASE = 'https://kr.trip.com/hotels/list';

function encode(value: string): string {
  return encodeURIComponent(value);
}

export function resolveBookingQuery(name: string, override: string | null): string {
  const trimmed = (override ?? '').trim();
  if (trimmed.length > 0) return trimmed;
  return name;
}

/** 호텔명으로 trip.com 호텔 검색 페이지 진입 */
export function buildTripcomHotelSearchUrl(query: string): string {
  const parts = [`keyword=${encode(query)}`, 'locale=ko-KR', 'curr=KRW'];
  return `${TRIPCOM_HOTEL_SEARCH_BASE}?${parts.join('&')}`;
}

async function copyToClipboardSilent(text: string): Promise<void> {
  try {
    const mod = (await import('expo-clipboard' as string)) as {
      setStringAsync?: (value: string) => Promise<unknown>;
    };
    await mod.setStringAsync?.(text);
  } catch {
    // expo-clipboard 미설치 등 — silent fail. 사용자에게는 Alert로 호텔명 안내.
  }
}

export async function openTripcomHotel(opts: {
  name: string;
  queryOverride: string | null;
  tripcomBookingUrl: string | null;
}): Promise<void> {
  const direct = (opts.tripcomBookingUrl ?? '').trim();
  const url =
    direct.length > 0
      ? direct
      : buildTripcomHotelSearchUrl(resolveBookingQuery(opts.name, opts.queryOverride));

  try {
    await Linking.openURL(url);
  } catch {
    const query = resolveBookingQuery(opts.name, opts.queryOverride);
    await copyToClipboardSilent(query);
    Alert.alert(
      '예약 페이지를 열 수 없어요',
      `호텔명을 복사했어요. 직접 검색해 주세요.\n\n${query}`,
      [{ text: '확인' }],
    );
  }
}
```

- [ ] **Step 4: 테스트 통과 확인**

Run: `cd apps/mobile && npx vitest run src/features/stays/lib/affiliateHotel.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add apps/mobile/src/features/stays/lib/affiliateHotel.ts apps/mobile/src/features/stays/lib/affiliateHotel.test.ts
git commit -m "feat(mobile): affiliateHotel을 trip.com URL/검색 방식으로 재작성

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 12: 모바일 호출부 4곳 + 상세 문구 교체

**Files:**
- Modify: `StayDetailScreen.tsx:26,114-119,204,206`, `StayListScreen.tsx:13,62-66`, `HocanceTop5Section.tsx:11,47-51`, `NearbyStaysSection.tsx:11,63-67`

- [ ] **Step 1: StayListScreen 교체**

`import { openAgodaHotelSearch } from '../lib/affiliateHotel';` → `import { openTripcomHotel } from '../lib/affiliateHotel';`
호출부:
```tsx
                openTripcomHotel({
                  name: stay.name,
                  queryOverride: stay.bookingQueryOverride,
                  tripcomBookingUrl: stay.tripcomBookingUrl,
                });
```

- [ ] **Step 2: HocanceTop5Section 교체**

`import { openAgodaHotelSearch } from '../../stays/lib/affiliateHotel';` → `import { openTripcomHotel } from '../../stays/lib/affiliateHotel';`
호출부:
```tsx
                openTripcomHotel({
                  name: stay.name,
                  queryOverride: stay.bookingQueryOverride,
                  tripcomBookingUrl: stay.tripcomBookingUrl,
                });
```

- [ ] **Step 3: NearbyStaysSection 교체**

`import { openAgodaHotelSearch } from '../../stays/lib/affiliateHotel';` → `import { openTripcomHotel } from '../../stays/lib/affiliateHotel';`
호출부:
```tsx
              openTripcomHotel({
                name: stay.name,
                queryOverride: stay.bookingQueryOverride,
                tripcomBookingUrl: stay.tripcomBookingUrl,
              });
```

- [ ] **Step 4: StayDetailScreen 교체 (import·호출·문구)**

import: `import { openAgodaHotelSearch, resolveBookingQuery } from '../lib/affiliateHotel';` → `import { openTripcomHotel, resolveBookingQuery } from '../lib/affiliateHotel';`

`handleBook` 내부:
```tsx
    openTripcomHotel({
      name: stay.name,
      queryOverride: stay.bookingQueryOverride,
      tripcomBookingUrl: stay.tripcomBookingUrl,
    });
```

문구(204, 206줄):
- `아고다 검색어: "{bookingQuery}"` → `trip.com 검색어: "{bookingQuery}"`
- `아고다에서 호텔 예약하기 →` → `trip.com에서 호텔 예약하기 →`

- [ ] **Step 5: 타입체크**

Run: `cd apps/mobile && npx tsc --noEmit`
Expected: FAIL — 테스트 픽스처들이 아직 `agodaHotelId` 사용(다음 Task). 호출부/화면 에러는 0이어야 함.

- [ ] **Step 6: Commit**

```bash
git add apps/mobile/src/features/stays/screens apps/mobile/src/features/home/components/HocanceTop5Section.tsx apps/mobile/src/features/spot/components/NearbyStaysSection.tsx
git commit -m "feat(mobile): 예약 버튼 4개 화면을 openTripcomHotel로 전환 + 문구 trip.com화

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 13: 모바일 테스트 픽스처 스윕 (`agodaHotelId` → `tripcomBookingUrl`)

**Files:**
- Modify: `agodaHotelId`를 참조하는 모든 모바일 테스트 픽스처

- [ ] **Step 1: 잔여 참조 목록 확인**

Run: `grep -rn "agodaHotelId\|agoda_hotel_id\|openAgodaHotelSearch\|EXPO_PUBLIC_AGODA_CID" apps/mobile/src`
Expected: 테스트 픽스처들(StayCard.test, HocanceTop5Section.test, NearbyStaysSection.test, stayRepository.test, rankStays.test, findClosestSpot.test, findNearbyStays.test 등)의 mock Stay 객체 내 `agodaHotelId: <값>` 줄들.

- [ ] **Step 2: 기계적 치환**

위 목록의 각 파일에서 `agodaHotelId:` → `tripcomBookingUrl:`로 치환한다. 값은 그대로 둔다(둘 다 `string | null`). 예: `agodaHotelId: null,` → `tripcomBookingUrl: null,`, `agodaHotelId: '123',` → `tripcomBookingUrl: '123',`.

- [ ] **Step 3: 타입체크 (전체 통과 기대)**

Run: `cd apps/mobile && npx tsc --noEmit`
Expected: PASS (모든 agoda 참조 제거)

- [ ] **Step 4: 잔여 참조 재확인**

Run: `grep -rn "agoda" apps/mobile/src`
Expected: 결과 없음

- [ ] **Step 5: 모바일 전체 테스트**

Run: `cd apps/mobile && npx vitest run`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add apps/mobile/src
git commit -m "test(mobile): 픽스처 agodaHotelId를 tripcomBookingUrl로 치환

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 14: 모바일 환경변수 정리

**Files:**
- Modify: `apps/mobile/.env.local` (및 `.env.example`가 있으면 동일)

- [ ] **Step 1: 잔여 참조 확인**

Run: `grep -rn "EXPO_PUBLIC_AGODA_CID" apps/mobile`
Expected: `.env.local`에만 존재(코드 참조는 Task 11에서 제거됨).

- [ ] **Step 2: 환경변수 라인 제거**

`apps/mobile/.env.local`에서 `EXPO_PUBLIC_AGODA_CID=...` 줄 삭제. (`.env`는 git 추적 대상이 아닐 수 있으므로 커밋은 추적되는 파일만.)

- [ ] **Step 3: Commit (추적 파일이 있을 때만)**

```bash
git add -A apps/mobile
git commit -m "chore(mobile): 사용하지 않는 EXPO_PUBLIC_AGODA_CID 제거

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>" || echo "추적 변경 없음 — 커밋 생략"
```

---

## Task 15: 통합 검증

- [ ] **Step 1: 전체 타입체크**

Run: `cd apps/web && npx tsc --noEmit` / `cd apps/mobile && npx tsc --noEmit`
Expected: 둘 다 PASS

- [ ] **Step 2: 전체 테스트**

Run: `cd apps/web && npx vitest run` / `cd apps/mobile && npx vitest run`
Expected: 둘 다 PASS

- [ ] **Step 3: 토스 미니앱 무영향 확인**

Run: `grep -rn "tripcom\|agoda" apps/toss-mini/src 2>/dev/null`
Expected: 결과 없음 (변경이 toss-mini로 새지 않았음)

- [ ] **Step 4: web 빌드(선택)**

Run: `cd apps/web && npm run build`
Expected: 빌드 성공

---

## 테스트 전략

**자동 테스트 (TDD 신규/수정):**
- `staySchema.test.ts` — `tripcom_booking_url` http(s) 검증 (FR-6, NFR-1)
- `affiliateHotel.test.ts` — URL 우선 / 검색 fallback / 실패 Alert (FR-2, FR-3, FR-4)
- `stayMappers.test.ts` — `tripcom_booking_url → tripcomBookingUrl` 매핑 (NFR-4)

**수동 회귀 체크리스트:**
- [ ] (FR-5) 어드민 stay 상세에서 trip.com URL 저장 → 새로고침 후 "직링크 활성" 배지·링크 노출
- [ ] (FR-5) 빈 값 저장 → "검색 fallback" 배지
- [ ] (NFR-1) `javascript:alert(1)` 입력 → 저장 거부 에러 메시지
- [ ] (FR-2) 모바일 상세에서 URL 있는 호텔 → 그 URL로 진입 / 없는 호텔 → trip.com 검색
- [ ] (FR-7) 홈 Top5·리스트·명소 근처 예약 버튼도 동일 동작
- [ ] (FR-8) 상세화면 "trip.com 검색어 / trip.com에서 호텔 예약하기" 문구 확인
- [ ] (FR-6) `{ stay: { …, tripcom_booking_url } }` 및 `{ stays: [...] }` import 성공

---

## 전환·배포 절차 (스펙 외 — 운영)

검토 결과(구버전 앱 노출 창) 반영:
1. **운영 DB에 Task 1 마이그레이션 적용** (컬럼만 추가, 기존 데이터 무손상).
2. **어드민에서 26개 호텔의 trip.com URL 입력** (Task 6 배포 후). 입력 전까진 신버전 앱이 trip.com 검색 fallback.
3. **모바일 변경을 OTA(EAS Update)로 배포** — 순수 JS/TS 변경이라 OTA 대상. `runtimeVersion: appVersion(1.0.5)` 매칭 바이너리에 다음 실행 1~2회 내 도달. 1.0.5 미만 바이너리는 스토어 업데이트 또는 해당 runtime 대상 별도 OTA 필요.
4. **agoda 제휴 계정은 OTA 보급률이 충분해질 때까지 유지** 후 종료(구버전 앱 탭 수익 보전).
5. **후속(이번 PR 제외)**: OTA 보급 후 `agoda_hotel_id` 컬럼 drop 마이그레이션 + 모바일/웹 `StayRow.agoda_hotel_id` 타입 정리.

---

## 완료 보고 항목 (스펙 ID 기준)

- FR-1: `tripcom_booking_url` 컬럼/타입 (Task 1,2,9)
- FR-2/3/4: `openTripcomHotel`/`buildTripcomHotelSearchUrl` (Task 11)
- FR-5: 어드민 URL 카드 (Task 6)
- FR-6: import 스키마/안내 (Task 3,7)
- FR-7: 호출부 4곳 (Task 12)
- FR-8: 상세 문구 (Task 12)
- NFR-1: http(s) 검증 (Task 3,5)
- NFR-3: toss-mini 무영향 (Task 15-3)
- NFR-4: `select('*')` 유지 (변경 없음 — 검증만)
- NFR-5: 전역 CID 제거 (Task 11,14)
