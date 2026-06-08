---
문서: 스펙 (결과물 명세)
대상: 호캉스(stays) 예약 제휴 링크 — trip.com + Agoda (두 provider 공존)
연관 플랜: docs/plans/2026-06-08-stays-revive-agoda-booking.md
최초 작성: 2026-06-02 (trip.com 단일 provider)
최종 수정: 2026-06-08 (Agoda 부활 — 두 provider 공존)
---

# 호캉스 예약 제휴 링크 스펙 (trip.com + Agoda)

## 1. 개요

호캉스(`stays`) 도메인의 **"예약하기" 액션**이 사용하는 제휴 링크 기능의 명세다. 각 호텔(stay)은 **두 개의 예약 provider** 목적지를 데이터로 보유한다.

- **trip.com** — 호텔별 **제휴 예약 URL 전체**(`tripcom_booking_url`)를 데이터로 보유하며, 앱은 이 URL을 가공 없이 그대로 연다. URL이 없으면 **trip.com 호텔명 검색 페이지**로 이동한다.
- **Agoda** — 호텔별 **Agoda 호텔 식별자 hid**(`agoda_hotel_id`)를 데이터로 보유하며, 앱은 전역 제휴 ID(`EXPO_PUBLIC_AGODA_CID`)와 hid로 **Agoda Partner Search 호텔 페이지 URL을 조립**해 연다. hid가 없으면 **호텔명 검색 URL**로 이동한다.

도메인 책임은 다음 한 줄로 요약된다:

> **호텔 → (provider별) 예약 목적지 URL 결정(직링크 데이터 우선, 없으면 검색) → 외부 브라우저 오픈**

두 provider는 **항상 함께 제공**된다. 두 provider 모두 직링크 데이터가 없어도 검색 fallback이 동작하므로, 예약 진입점은 호텔별 직링크 유무와 무관하게 **항상 두 provider를 노출**한다.

노출 방식은 화면 성격에 따라 둘로 나뉜다(FR-7):

- **콤팩트 진입점**(홈 호캉스 Top5 카드, 호캉스 리스트 카드, 꽃 명소 상세의 "근처 호캉스" 카드, 호캉스 상세 hero) — 단일 "예약" 진입점을 탭하면 **provider 선택 바텀시트**(trip.com / Agoda)를 띄운다.
- **호캉스 상세 예약 섹션** — **두 개의 전체폭 버튼**(trip.com / Agoda)을 동시 노출한다.

이 기능의 데이터 입력 경로는 두 가지다: ① 웹 어드민의 stay 상세 폼(provider별 카드 2개), ② JSON import(단건/일괄).

## 2. 기능 요구사항 (FR)

- **FR-1 (trip.com 호텔별 예약 URL 보유)** — 각 stay는 선택적 필드 `tripcom_booking_url`(전체 trip.com 제휴 URL)을 가진다. 값이 없으면 `null`.
- **FR-1A (Agoda 호텔별 hid 보유)** — 각 stay는 선택적 필드 `agoda_hotel_id`(Agoda hid)를 가진다. 값이 없으면 `null`.
- **FR-2 (모바일 오픈 규칙)** — provider별로 다음과 같이 동작한다.
  - **trip.com** (`openTripcomHotel`): `tripcom_booking_url`이 http(s) URL이면 **그 URL을 그대로** 외부 오픈. 아니면 `buildTripcomHotelSearchUrl(resolveBookingQuery(name, override))`를 오픈.
  - **Agoda** (`openAgodaHotel`): `agoda_hotel_id`가 있으면 `buildAgodaHotelDeepLink(hid)`(직링크)를, 없으면 `buildAgodaHotelSearchUrl(resolveBookingQuery(name, override))`(검색)를 오픈.
- **FR-3 (검색 URL 빌더)**
  - `buildTripcomHotelSearchUrl(query)` — 한국어 로케일 trip.com 호텔 검색 URL. 형식: `https://kr.trip.com/hotels/list?keyword=<URL인코딩 query>&locale=ko-KR&curr=KRW`.
  - `buildAgodaHotelSearchUrl(query)` — Agoda Partner Search 호텔명 검색 URL. 형식: `https://www.agoda.com/partners/partnersearch.aspx?cid=<CID>&hl=ko-kr&hname=<URL인코딩 query>` (CID 미설정 시 `cid` 파라미터 생략).
  - `buildAgodaHotelDeepLink(hotelId)` — Agoda 호텔 페이지 직링크. 형식: `https://www.agoda.com/partners/partnersearch.aspx?cid=<CID>&hl=ko-kr&hid=<hotelId>` (CID 미설정 시 `cid` 생략).
- **FR-4 (오픈 실패 처리)** — `Linking.openURL` 실패 시 검색 키워드를 클립보드에 복사하고, 호텔명을 안내하는 Alert를 띄운다(두 provider 공통).
- **FR-5 (어드민 입력)** — 웹 어드민 stay 상세는 **provider별 카드 2개**를 가진다.
  - **trip.com 예약 URL 카드** — 전체 URL을 붙여넣어 저장/수정/제거. 빈 입력은 `null`(검색 fallback). http(s) 스킴 검증. 상태 배지(직링크 활성 / 검색 fallback)·결과 메시지.
  - **Agoda 호텔 ID 카드** — 전체 Agoda URL을 붙여넣으면 hid를 추출하거나, 숫자 hid를 직접 입력해 저장/수정/제거. 빈 입력은 `null`(검색 fallback). 유효하지 않은 입력은 저장 거부(에러 메시지). 상태 배지·결과 메시지.
- **FR-6 (JSON import)** — stay import JSON에 `tripcom_booking_url`과 `agoda_hotel_id`를 **각각 옵션 필드**로 포함한다(stay import 경로, 단건·일괄 모두).
- **FR-7 (예약 진입점 노출 지점)** — 예약 액션의 진입점은 다음과 같다.
  - **콤팩트 진입점**(홈 호캉스 Top5 카드, 호캉스 리스트 카드, 꽃 명소 "근처 호캉스" 카드, 호캉스 상세 hero): 단일 "예약" 버튼 → **provider 선택 바텀시트** 오픈.
  - **호캉스 상세 예약 섹션**: trip.com / Agoda **두 버튼 동시 노출**.
- **FR-8 (상세화면 문구)** — 호캉스 상세화면 예약 섹션:
  - 검색어 라벨은 provider 공통이므로 일반화: `검색어: "<bookingQuery>"`.
  - 버튼 라벨: "trip.com에서 예약하기 →", "Agoda에서 예약하기 →".
  - hero 주 버튼 라벨 "예약하기 →"는 유지(탭 시 선택 시트).
- **FR-9 (provider 선택 바텀시트)** — 공용 컴포넌트 `BookingProviderSheet`(RN `Modal` 기반 바텀시트)는 두 행("trip.com에서 예약하기", "Agoda에서 예약하기")을 노출한다. 행 선택 시 해당 provider의 오픈 함수를 호출하고 시트를 닫는다. 두 provider 모두 검색 fallback이 있어 **항상 두 행 모두 노출**한다(호텔별 직링크 유무로 행을 숨기지 않는다).

## 3. 비기능 요구사항 (NFR)

- **NFR-1 (URL 스킴 안전성)**
  - `tripcom_booking_url` 저장·import 시 **http(s) 스킴만 허용**한다(`httpsOnlyUrlSchema` 규칙, XSS 방어). 특정 도메인은 강제하지 않는다(제휴 추적/리다이렉트 도메인 허용). 모바일 읽기 경로(`openTripcomHotel`)도 동일 방어선: 저장된 값이 http(s)가 아니면 검색으로 fallback.
  - `agoda_hotel_id`는 **숫자(hid)만 허용**한다(어드민 파서·import 스키마). 모바일은 hid를 알려진 `agoda.com` 템플릿에 끼워 URL을 조립하므로 임의 스킴이 끼어들 수 없다.
- **NFR-2 (앱 업데이트 없는 목적지 갱신 — provider별)**
  - **trip.com**: 예약 목적지는 DB의 `tripcom_booking_url` 전체 URL이므로, 신버전 앱은 앱 재배포 없이 DB 값 변경만으로 목적지를 바꿀 수 있다.
  - **Agoda**: 호텔별 목적지(hid)는 DB의 `agoda_hotel_id`이므로 앱 재배포 없이 호텔별 목적지를 바꿀 수 있다. 단 **URL 템플릿과 전역 CID는 앱 바이너리(빌드 시 인라인된 env)** 에 박힌다(NFR-5 참조).
- **NFR-3 (두 앱 격리)** — 본 기능은 `apps/web`(어드민)과 `apps/mobile`에만 존재한다. **토스 미니앱(`apps/toss-mini`)과 공유 패키지는 무관**하며 영향이 없어야 한다.
- **NFR-4 (쿼리 견고성)** — 모바일 stays 조회는 `select('*')`를 사용한다. 컬럼 구성이 바뀌어도 조회가 깨지지 않고, 매퍼는 없는 필드를 안전하게 `null`로 처리한다.
- **NFR-5 (전역 제휴 ID 의존 — provider별 구분)**
  - **trip.com 경로는 전역 제휴 ID에 의존하지 않는다.** 제휴 추적은 DB에 저장된 URL 자체에 포함된다.
  - **Agoda 경로는 의도적으로 전역 제휴 ID `EXPO_PUBLIC_AGODA_CID`에 의존한다.** Agoda Partner Search는 cid로 제휴를 식별하므로, 이 env로 cid를 주입한다. env 미설정 시 cid 없이 진입하며 **수익 추적이 되지 않는다**(허용된 degrade 동작).
  - 두 provider의 **검색 fallback** 중 trip.com 검색은 제휴 추적이 없고(수익 미인정), Agoda 검색은 cid가 있으면 추적된다.

> **2026-06-08 개정 메모:** 2026-06-02 최초 스펙은 trip.com 단일 provider 전제로 NFR-5를 "전역 제휴 ID 비의존"으로 두었다. Agoda 승인에 따라 Agoda 예약을 부활시키면서, 본 스펙은 두 provider 공존으로 갱신되었고 NFR-5는 provider별로 재정의되었다. `agoda_hotel_id` 컬럼은 trip.com 전환 시 drop하지 않고 보존되어 있었으므로 **DB 마이그레이션은 불필요**하다.

## 4. 구조

### 4.1 데이터 흐름

```
[어드민 trip.com URL 카드] ─┐
[JSON import tripcom]       ├─→ http(s) 검증 ─→ stays.tripcom_booking_url (DB)
                            │
[어드민 Agoda ID 카드]──────┐
[JSON import agoda]         ├─→ parseAgodaHotelId(hid 추출/검증) ─→ stays.agoda_hotel_id (DB)
                            │
                            │ select('*')
                ┌───────────┘
                ▼
   [stayMappers.toStay] → Stay.tripcomBookingUrl / Stay.agodaHotelId
                │
   ┌────────────┴───────────────────────────────────┐
   │ 콤팩트 진입점(Top5/리스트/근처/hero)            │ 상세 예약 섹션
   │   "예약" 탭 → BookingProviderSheet              │   [trip.com 버튼] [Agoda 버튼]
   │     ├ trip.com 행 → openTripcomHotel(...)        │      │             │
   │     └ Agoda 행   → openAgodaHotel(...)           │  openTripcomHotel  openAgodaHotel
   └────────────┬───────────────────────────────────┘      │             │
                ▼                                            ▼             ▼
        openTripcomHotel: url 있으면 그대로 / 없으면 kr.trip.com 검색
        openAgodaHotel:   hid 있으면 partnersearch(cid+hid) / 없으면 partnersearch(cid+hname)
                                          │ openURL 실패 시
                                  키워드 클립보드 복사 + Alert (공통)
```

### 4.2 영향 표면 (디렉터리)

| 영역 | 파일 | 책임 |
|------|------|------|
| DB | (변경 없음) | `stays.tripcom_booking_url`, `stays.agoda_hotel_id` 모두 기존 컬럼 |
| mobile | `src/features/stays/lib/affiliateHotel.ts` | trip.com·Agoda URL 결정·검색·직링크·오픈 |
| mobile | `src/features/stays/components/BookingProviderSheet.tsx` | provider 선택 바텀시트 (신규) |
| mobile | `src/shared/data/types.ts` | `Stay.agodaHotelId`, `StayRow.agoda_hotel_id` (재추가) |
| mobile | `src/shared/data/stayMappers.ts` | row→Stay 매핑(agoda 추가) |
| mobile | `src/features/stays/screens/StayDetailScreen.tsx` | 두 버튼 + hero 시트 |
| mobile | `src/features/stays/screens/StayListScreen.tsx` | 카드 예약 → 시트 |
| mobile | `src/features/home/components/HocanceTop5Section.tsx` | 카드 예약 → 시트 |
| mobile | `src/features/spot/components/NearbyStaysSection.tsx` | 카드 예약 → 시트 |
| mobile | `.env.local` / 빌드 env | `EXPO_PUBLIC_AGODA_CID` (재도입) |
| web | `src/features/stays/agodaHidParser.ts` | hid 추출/검증 (복원) |
| web | `src/features/stays/StayDetailForm.tsx` | trip.com URL 카드 + Agoda ID 카드 |
| web | `src/features/stays/actions.ts` | `updateStayTripcomUrlAction` + `updateStayAgodaHotelIdAction` |
| web | `src/lib/data/stays.ts` | `updateStayTripcomUrl` + `updateStayAgodaHotelId`, `buildStayWriteInput` |
| web | `src/features/stays/staySchema.ts` | `tripcom_booking_url` + `agoda_hotel_id` 필드 |
| web | `src/features/import/ImportFormatGuide.tsx` | 두 필드 안내·예시 |
| web | `src/lib/types.ts` | `StayRow`/`StayInsert`에 두 필드 (기존 유지) |

## 5. 구성 요소별 책임과 계약

### 5.1 모바일 — `affiliateHotel.ts`

```ts
// 검색어 결정: override가 있으면 우선, 없으면 호텔명 (provider 공통)
export function resolveBookingQuery(name: string, override: string | null): string;

// trip.com 한국어 호텔 검색 URL
export function buildTripcomHotelSearchUrl(query: string): string;

// Agoda Partner Search 호텔명 검색 URL (cid+hname)
export function buildAgodaHotelSearchUrl(query: string): string;

// Agoda hid 직링크 URL (cid+hid)
export function buildAgodaHotelDeepLink(hotelId: string): string;

// trip.com 예약 목적지 결정 + 외부 오픈 (+ 실패 시 클립보드/Alert)
export function openTripcomHotel(opts: {
  name: string;
  queryOverride: string | null;
  tripcomBookingUrl: string | null;
}): Promise<void>;

// Agoda 예약 목적지 결정 + 외부 오픈 (+ 실패 시 클립보드/Alert)
export function openAgodaHotel(opts: {
  name: string;
  queryOverride: string | null;
  agodaHotelId: string | null;
}): Promise<void>;
```

계약:
- `openTripcomHotel`은 `tripcomBookingUrl`이 http(s) URL이면(trim 후 `^https?://`) 그 값을, 아니면 검색 URL을 오픈한다(NFR-1 방어선).
- `openAgodaHotel`은 `agodaHotelId`가 **숫자(trim 후 `^\d+$`)이면** `buildAgodaHotelDeepLink`를, 아니면(비어있거나 비숫자) `buildAgodaHotelSearchUrl`을 오픈한다(NFR-1 방어선 — trip.com 경로의 http(s) 방어선과 동일 취지로, 레거시·오염 hid는 검색으로 fallback).
- Agoda 빌더는 CID를 `process.env.EXPO_PUBLIC_AGODA_CID?.trim()`에서 읽는다. trip.com 경로는 전역 ID를 읽지 않는다.
- 두 함수 모두 `Linking.openURL` 실패 시 `resolveBookingQuery` 결과를 클립보드 복사(silent) 후 동일 Alert("예약 페이지를 열 수 없어요")를 띄운다.

### 5.2 모바일 — `BookingProviderSheet.tsx`

```ts
type BookingProviderSheetProps = {
  stay: Stay | null;     // null이면 닫힘 (Modal visible={stay != null})
  onClose: () => void;
};
export function BookingProviderSheet(props: BookingProviderSheetProps): JSX.Element;
```

계약:
- `stay`가 `null`이면 시트는 보이지 않는다. `stay`가 있으면 두 행("trip.com에서 예약하기", "Agoda에서 예약하기")을 노출한다.
- trip.com 행 → `openTripcomHotel({ name: stay.name, queryOverride: stay.bookingQueryOverride, tripcomBookingUrl: stay.tripcomBookingUrl })` 후 `onClose()`.
- Agoda 행 → `openAgodaHotel({ name: stay.name, queryOverride: stay.bookingQueryOverride, agodaHotelId: stay.agodaHotelId })` 후 `onClose()`.
- 배경(backdrop) 탭 또는 닫기 동작 시 `onClose()`.
- 소비 화면은 `const [bookingStay, setBookingStay] = useState<Stay | null>(null)`를 보유하고, 콤팩트 진입점의 예약 핸들러에서 `setBookingStay(stay)`를 호출하며, 화면당 시트 인스턴스 1개를 렌더한다.

### 5.3 모바일 — 타입 / 매퍼

```ts
// types.ts
type Stay    = { …; tripcomBookingUrl: string | null; agodaHotelId: string | null; … };
type StayRow = { …; tripcom_booking_url: string | null; agoda_hotel_id: string | null; … };
```
- `stayMappers.toStay(row)`는 `tripcomBookingUrl: row.tripcom_booking_url ?? null`, `agodaHotelId: row.agoda_hotel_id ?? null`로 매핑한다.

### 5.4 모바일 — 호출 지점

- **콤팩트 진입점 3곳**(StayListScreen, HocanceTop5Section, NearbyStaysSection): `StayCard.onPressBook`을 `() => setBookingStay(stay)`로 연결하고 `BookingProviderSheet`를 렌더한다.
- **호캉스 상세 hero**: `primaryButton.onPress`를 `() => setBookingStay(stay)`로 연결(시트 오픈).
- **호캉스 상세 예약 섹션**: 두 버튼이 각각 `openTripcomHotel(...)` / `openAgodaHotel(...)`를 직접 호출한다.

### 5.5 웹 — `agodaHidParser.ts`

```ts
// 전체 Agoda URL에서 hid 추출, 숫자 직접 입력은 그대로, 그 외 null
export function parseAgodaHotelId(input: string | null | undefined): string | null;
```
계약: 숫자만(`^\d+$`)이면 그대로. `agoda.com` 도메인 URL이면 `hid` 쿼리 파라미터(숫자) 추출. 빈 입력/비-agoda 도메인/hid 없음/비숫자 hid → `null`.

### 5.6 웹 — 서버 액션 / 데이터

```ts
// actions.ts
export async function updateStayTripcomUrlAction(id: string, rawUrl: string): Promise<void>;
export async function updateStayAgodaHotelIdAction(id: string, rawInput: string): Promise<void>;
// lib/data/stays.ts
export async function updateStayTripcomUrl(client, id: string, url: string | null): Promise<void>;
export async function updateStayAgodaHotelId(client, id: string, hid: string | null): Promise<void>;
```
계약(`updateStayAgodaHotelIdAction`):
- `rawInput` trim → 빈 문자열이면 `null`(검색 fallback).
- 비어있지 않으면 `parseAgodaHotelId`로 hid 추출. 추출 실패(`null`)면 `Error` throw(폼이 메시지 표시).
- `revalidatePath('/admin/stays')` 및 `/admin/stays/${id}`.

`buildStayWriteInput`은 `tripcom_booking_url`과 `agoda_hotel_id`를 각각 `emptyToNull`로 정규화한다.

### 5.7 웹 — import 스키마

`staySchema`는 다음 옵션 필드를 가진다:
```ts
tripcom_booking_url: httpsOnlyUrlSchema.nullable().optional(),
agoda_hotel_id: z.string().trim().regex(/^\d+$/).nullable().optional(), // hid는 숫자만 (NFR-1)
```

### 5.8 웹 — 어드민 폼 카드 (2개)

- **"trip.com 예약 URL" 카드** — 입력 1개(전체 URL), 저장 버튼, 상태 배지(직링크/검색 fallback), 결과 메시지.
- **"Agoda 호텔 ID" 카드** — 입력 1개(전체 Agoda URL 또는 숫자 hid), 저장 버튼, 상태 배지(직링크/검색 fallback), 결과 메시지.

## 6. 타입 정의

| 키 | 타입 | 위치 | 비고 |
|----|------|------|------|
| `tripcom_booking_url` | `text` (nullable) | DB `stays` | 전체 trip.com 제휴 URL |
| `agoda_hotel_id` | `text` (nullable) | DB `stays` | Agoda hid (숫자 문자열) |
| `Stay.tripcomBookingUrl` | `string \| null` | mobile | camelCase |
| `Stay.agodaHotelId` | `string \| null` | mobile | camelCase |
| `StayRow.tripcom_booking_url` | `string \| null` | mobile/web | snake_case |
| `StayRow.agoda_hotel_id` | `string \| null` | mobile/web | snake_case |
| `tripcom_booking_url` | `string \| null` (http(s)) | web staySchema/types | import·저장 검증 |
| `agoda_hotel_id` | `string \| null` (숫자) | web staySchema/types | import·저장 검증 |
| `BookingProvider` | `'tripcom' \| 'agoda'` | mobile | 시트 행 식별 |

## 7. 외부 의존성

- **trip.com 한국어 호텔 검색**: `https://kr.trip.com/hotels/list?keyword=<query>&locale=ko-KR&curr=KRW`.
- **trip.com 제휴 URL**: 사용자가 어드민/import로 제공. 앱은 가공 없이 그대로 오픈.
- **Agoda Partner Search**: `https://www.agoda.com/partners/partnersearch.aspx?cid=<CID>&hl=ko-kr&hid=<hid>`(직링크) / `&hname=<query>`(검색).
- **Agoda CID**: `EXPO_PUBLIC_AGODA_CID` env(빌드 시 인라인). 승인된 제휴 cid.
- `react-native` `Linking`, `Alert`, `Modal`; `expo-clipboard`(선택, 실패 시 silent).
- `@supabase/supabase-js`, `zod`.

## 8. 명시적 가정

- 사용자가 입력하는 `tripcom_booking_url`에는 **제휴 추적 파라미터가 이미 포함**되어 있다(앱은 파라미터를 덧붙이지 않는다).
- `EXPO_PUBLIC_AGODA_CID`는 **승인된 Agoda 제휴 cid**다. 설정되어 있어야 Agoda 수익이 추적된다(미설정 시 cid 없이 진입, 추적 불가 — 허용된 degrade).
- trip.com 검색 fallback은 제휴 추적이 없다(수익 미인정). 이는 의도된 허용 동작이다.
- `kr.trip.com` 호텔 검색의 `keyword` 파라미터, `agoda.com/partners/partnersearch.aspx`의 `hid`/`hname` 파라미터가 유효하다.
- 예약 목적지 URL의 외부 오픈은 기기 기본 브라우저/앱 처리에 위임한다.
- `agoda_hotel_id` 컬럼이 DB `stays`에 이미 존재한다(trip.com 전환 시 보존됨) — 신규 마이그레이션 불필요.
