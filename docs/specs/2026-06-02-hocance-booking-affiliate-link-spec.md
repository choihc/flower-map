---
문서: 스펙 (결과물 명세)
대상: 호캉스(stays) 예약 제휴 링크 — trip.com
연관 플랜: docs/plans/2026-06-02-agoda-to-tripcom-affiliate.md
최종 수정: 2026-06-02
---

# 호캉스 예약 제휴 링크 스펙 (trip.com)

## 1. 개요

호캉스(`stays`) 도메인의 **"예약하기" 액션**이 사용하는 제휴 링크 기능의 명세다. 각 호텔(stay)은 자신의 **trip.com 제휴 예약 URL** 전체를 데이터로 보유하며, 모바일 앱의 예약 버튼은 이 URL로 외부 브라우저를 연다. URL이 없는 호텔은 **trip.com 호텔명 검색 페이지**로 이동한다.

도메인 책임은 다음 한 줄로 요약된다:

> **호텔 → 예약 목적지 URL 결정(저장된 제휴 URL 우선, 없으면 검색) → 외부 브라우저 오픈**

예약 목적지 URL은 **DB에 저장된 값**이며, 모바일 앱은 이를 가공 없이 그대로 연다(전역 제휴 ID로 URL을 조립하지 않는다). 따라서 신버전 앱은 **앱 업데이트 없이 DB 변경만으로** 예약 목적지를 갱신할 수 있다.

이 기능의 데이터 입력 경로는 두 가지다: ① 웹 어드민의 stay 상세 폼, ② JSON import(단건/일괄).

## 2. 기능 요구사항 (FR)

- **FR-1 (호텔별 예약 URL 보유)** — 각 stay는 선택적 필드 `tripcom_booking_url`(전체 trip.com 제휴 URL)을 가진다. 값이 없으면 `null`.
- **FR-2 (모바일 오픈 규칙)** — 예약 버튼 탭 시:
  - `tripcom_booking_url`이 있으면 → **그 URL을 그대로** 외부 오픈.
  - 없으면 → `resolveBookingQuery(name, override)`로 만든 키워드로 **trip.com 호텔 검색 URL**을 오픈.
- **FR-3 (검색 URL 빌더)** — `buildTripcomHotelSearchUrl(query)`는 한국어 로케일 trip.com 호텔 검색 URL을 반환한다.
  - 형식: `https://kr.trip.com/hotels/list?keyword=<URL인코딩된 query>&locale=ko-KR&curr=KRW`
- **FR-4 (오픈 실패 처리)** — `Linking.openURL` 실패 시 검색 키워드를 클립보드에 복사하고, 호텔명을 안내하는 Alert를 띄운다(기존 동작 보존).
- **FR-5 (어드민 입력)** — 웹 어드민 stay 상세에서 trip.com 예약 URL을 붙여넣어 **저장/수정/제거**할 수 있다.
  - 입력은 전체 URL. 빈 입력은 `null`로 정규화(검색 fallback).
  - 현재 상태 배지: URL 있음 = "직링크 활성", 없음 = "검색 fallback".
  - 저장 결과(성공/오류) 메시지를 표시한다.
- **FR-6 (JSON import)** — stay import JSON에 `tripcom_booking_url`을 **옵션 필드**로 포함한다(단건 `{ flower_slug, spot }`형이 아닌 stay import 경로, 단건·일괄 모두).
- **FR-7 (예약 버튼 노출 지점)** — 예약 액션은 모바일 4개 지점에서 **공통 오픈 함수**로 호출된다: 홈 호캉스 Top5, 호캉스 리스트, 호캉스 상세, 꽃 명소 상세의 "근처 호캉스".
- **FR-8 (상세화면 문구)** — 호캉스 상세화면의 예약 관련 카피는 trip.com을 지칭한다: 검색어 라벨 "trip.com 검색어: …", 버튼 "trip.com에서 호텔 예약하기 →". hero 영역 주 버튼 라벨 "예약하기 →"는 유지.

## 3. 비기능 요구사항 (NFR)

- **NFR-1 (URL 스킴 안전성)** — `tripcom_booking_url` 저장·import 시 **http(s) 스킴만 허용**한다(XSS 방어, 기존 `httpsOnlyUrlSchema`와 동일 규칙). 특정 도메인(trip.com 등)은 **강제하지 않는다** — 제휴 링크가 추적/리다이렉트 도메인을 거칠 수 있기 때문이다. 모바일 읽기 경로(`openTripcomHotel`)도 동일 규칙으로 **방어선**을 둔다: 저장된 값이 http(s)가 아니면(레거시·오염 데이터 등) `Linking.openURL`에 넘기지 않고 호텔명 검색으로 fallback한다.
- **NFR-2 (앱 업데이트 없는 목적지 갱신)** — 예약 목적지는 DB에 저장된 URL이므로, 신버전 앱은 앱 재배포 없이 DB 값 변경만으로 목적지를 바꿀 수 있어야 한다(앱 바이너리에는 "어떤 필드를 읽고 어떻게 fallback 하는지"만 박힌다).
- **NFR-3 (두 앱 격리)** — 본 기능은 `apps/web`(어드민)과 `apps/mobile`에만 존재한다. **토스 미니앱(`apps/toss-mini`)과 공유 패키지는 무관**하며 영향이 없어야 한다.
- **NFR-4 (쿼리 견고성)** — 모바일 stays 조회는 `select('*')`를 사용한다. 컬럼 구성이 바뀌어도 조회가 깨지지 않고, 매퍼는 없는 필드를 안전하게 `null`로 처리한다.
- **NFR-5 (전역 제휴 ID 비의존)** — 본 기능은 전역 제휴 ID(예: Agoda CID류) 환경변수에 의존하지 않는다. 검색 fallback은 제휴 추적 파라미터가 없으며(수익 미인정), 이는 허용된 동작이다.

## 4. 구조

### 4.1 데이터 흐름

```
[어드민 폼] ──┐
              ├─→ tripcom_booking_url 검증(http(s)) ─→ stays.tripcom_booking_url (DB)
[JSON import]─┘                                              │
                                                            │ select('*')
                                          ┌─────────────────┘
                                          ▼
                            [모바일 stayMappers.toStay] → Stay.tripcomBookingUrl
                                          │
                            예약 버튼 탭 → openTripcomHotel({ name, queryOverride, tripcomBookingUrl })
                                          │
                       ┌──────────────────┴───────────────────┐
                  URL 있음                                 URL 없음
                       │                                       │
            그 URL 그대로 오픈              buildTripcomHotelSearchUrl(resolveBookingQuery(name, override))
                       │                                       │
                       └──────────→ Linking.openURL ←──────────┘
                                          │ 실패 시
                                  키워드 클립보드 복사 + Alert
```

### 4.2 영향 표면 (디렉터리)

| 영역 | 파일 | 책임 |
|------|------|------|
| DB | `supabase/migrations/*.sql` | `stays.tripcom_booking_url text` 컬럼 |
| mobile | `src/features/stays/lib/affiliateHotel.ts` | URL 결정·검색 빌더·오픈 |
| mobile | `src/shared/data/types.ts` | `Stay.tripcomBookingUrl`, `StayRow.tripcom_booking_url` |
| mobile | `src/shared/data/stayMappers.ts` | row→Stay 매핑 |
| mobile | `src/features/stays/screens/StayDetailScreen.tsx` | 예약 버튼·문구 |
| mobile | `src/features/stays/screens/StayListScreen.tsx` | 예약 버튼 |
| mobile | `src/features/home/components/HocanceTop5Section.tsx` | 예약 버튼 |
| mobile | `src/features/spot/components/NearbyStaysSection.tsx` | 예약 버튼 |
| web | `src/features/stays/StayDetailForm.tsx` | URL 입력 카드 |
| web | `src/features/stays/actions.ts` | `updateStayTripcomUrlAction` |
| web | `src/lib/data/stays.ts` | `updateStayTripcomUrl`, `buildStayWriteInput` |
| web | `src/features/stays/staySchema.ts` | `tripcom_booking_url` 필드 |
| web | `src/features/import/ImportFormatGuide.tsx` | import 안내·예시 |
| web | `src/lib/types.ts` | `StayRow`/`StayInsert`/`StayUpdate` |

## 5. 구성 요소별 책임과 계약

### 5.1 모바일 — `affiliateHotel.ts`

```ts
// 검색어 결정: override가 있으면 우선, 없으면 호텔명 (기존 유지)
export function resolveBookingQuery(name: string, override: string | null): string;

// trip.com 한국어 호텔 검색 URL 생성
export function buildTripcomHotelSearchUrl(query: string): string;

// 예약 목적지 결정 + 외부 오픈 (+ 실패 시 클립보드/Alert)
export function openTripcomHotel(opts: {
  name: string;
  queryOverride: string | null;
  tripcomBookingUrl: string | null;
}): Promise<void>;
```

계약:
- `openTripcomHotel`은 `tripcomBookingUrl`이 **http(s) URL이면**(trim 후 `^https?://`) 그 값을, 아니면(비어있거나 비-http(s)) `buildTripcomHotelSearchUrl(resolveBookingQuery(name, queryOverride))`를 오픈한다(NFR-1 방어선).
- 전역 제휴 ID(환경변수)를 읽지 않는다.

### 5.2 모바일 — 타입 / 매퍼

```ts
// types.ts
type Stay   = { …; tripcomBookingUrl: string | null; … };
type StayRow = { …; tripcom_booking_url: string | null; … };
```
- `stayMappers.toStay(row)`는 `tripcomBookingUrl: row.tripcom_booking_url ?? null`로 매핑한다.

### 5.3 모바일 — 호출 지점

4개 화면은 모두 다음 형태로 호출한다:
```ts
openTripcomHotel({ name: stay.name, queryOverride: stay.bookingQueryOverride, tripcomBookingUrl: stay.tripcomBookingUrl });
```

### 5.4 웹 — 서버 액션 / 데이터

```ts
// actions.ts
export async function updateStayTripcomUrlAction(id: string, rawUrl: string): Promise<void>;
// lib/data/stays.ts
export async function updateStayTripcomUrl(client, id: string, url: string | null): Promise<void>;
```
계약(`updateStayTripcomUrlAction`):
- `rawUrl` trim → 빈 문자열이면 `null`.
- 값이 있으면 http(s) 스킴 검증 실패 시 `Error` throw(폼이 메시지 표시).
- `revalidatePath('/admin/stays')` 및 `/admin/stays/${id}`.

### 5.5 웹 — import 스키마

`staySchema`는 다음 옵션 필드를 가진다:
```ts
tripcom_booking_url: httpsOnlyUrlSchema.nullable().optional(),
```
`buildStayWriteInput`은 `tripcom_booking_url`을 `emptyToNull`로 정규화한다.

### 5.6 웹 — 어드민 폼 카드

stay 상세 폼의 카드 제목 "trip.com 예약 URL". 입력 필드 1개(전체 URL), 저장 버튼, 상태 배지(직링크/검색 fallback), 결과 메시지.

## 6. 타입 정의

| 키 | 타입 | 위치 | 비고 |
|----|------|------|------|
| `tripcom_booking_url` | `text` (nullable) | DB `stays` | 전체 trip.com 제휴 URL |
| `Stay.tripcomBookingUrl` | `string \| null` | mobile | camelCase |
| `StayRow.tripcom_booking_url` | `string \| null` | mobile/web | snake_case |
| `tripcom_booking_url` | `string \| null` (http(s)) | web staySchema/types | import·저장 검증 |

## 7. 외부 의존성

- **trip.com 한국어 호텔 검색**: `https://kr.trip.com/hotels/list?keyword=<query>&locale=ko-KR&curr=KRW`
  - 2026-06-02 기준 `keyword` 파라미터로 호텔 검색 UI 진입 확인. 구현 단계에서 최종 재확인하며, 빌더 함수에 캡슐화되어 손쉽게 조정 가능.
- **trip.com 제휴 URL**: 사용자가 어드민/import로 제공. 앱은 가공 없이 그대로 오픈.
- `react-native` `Linking`, `Alert`; `expo-clipboard`(선택, 실패 시 silent).
- `@supabase/supabase-js`.

## 8. 명시적 가정

- 사용자가 입력하는 `tripcom_booking_url`에는 **제휴 추적 파라미터가 이미 포함**되어 있다(앱은 파라미터를 덧붙이지 않는다).
- **검색 fallback은 제휴 추적이 없다**(수익 미인정). 이는 의도된 허용 동작이다(NFR-5).
- `kr.trip.com` 호텔 검색의 `keyword` 파라미터가 유효하다(FR-3, §7에서 확인·재검증 대상).
- 예약 목적지 URL의 외부 오픈은 기기 기본 브라우저/앱 처리에 위임한다.
