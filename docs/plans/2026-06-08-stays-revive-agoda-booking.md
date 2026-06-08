# 호캉스 Agoda 예약 부활 (trip.com + Agoda 공존) 구현 플랜

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**연관 스펙:** `docs/specs/2026-06-02-hocance-booking-affiliate-link-spec.md`

**Goal:** 호캉스 예약 액션이 trip.com과 Agoda 두 provider를 동시 제공하도록, 과거 Agoda(hid + 전역 CID) 경로를 부활시키고 provider 선택 바텀시트를 추가한다.

**Architecture:** `agoda_hotel_id` 컬럼·웹 타입은 trip.com 전환 시 보존되어 있어 **DB 마이그레이션 불필요**. 모바일은 `openAgodaHotel`(hid 있으면 `partnersearch.aspx?cid=&hid=` 직링크, 없으면 `&hname=` 검색)을 부활시키고, `Stay.agodaHotelId`를 재추가한다. 콤팩트 진입점(홈 Top5·리스트·근처 카드·상세 hero)은 공용 `BookingProviderSheet`(RN Modal 바텀시트)를 띄우고, 상세 예약 섹션은 두 버튼을 동시 노출한다. 웹 어드민은 trip.com URL 카드와 Agoda 호텔 ID 카드를 함께 둔다.

**Tech Stack:** React Native/Expo, React, zod, Next.js(App Router, server actions), vitest, @testing-library/react-native.

**테스트 실행 규칙:** 각 앱 디렉터리에서 `npx vitest run <path>`. 타입체크는 각 앱에서 `npx tsc --noEmit`.

---

## 파일 구조 (변경/생성)

| 구분 | 파일 | 책임 |
|------|------|------|
| 수정 | `apps/mobile/src/shared/data/types.ts` | `Stay.agodaHotelId`, `StayRow.agoda_hotel_id` 재추가 |
| 수정 | `apps/mobile/src/shared/data/stayMappers.ts` (+`.test.ts`) | `agoda_hotel_id → agodaHotelId` 매핑 |
| 수정 | `apps/mobile/src/features/stays/lib/affiliateHotel.ts` (+`.test.ts`) | `openAgodaHotel`·Agoda 빌더 부활 |
| 생성 | `apps/mobile/src/features/stays/components/BookingProviderSheet.tsx` (+`.test.tsx`) | provider 선택 바텀시트 |
| 수정 | `apps/mobile/src/features/stays/screens/StayDetailScreen.tsx` | 두 버튼 + hero 시트 |
| 수정 | `apps/mobile/src/features/stays/screens/StayListScreen.tsx` | 카드 예약 → 시트 |
| 수정 | `apps/mobile/src/features/home/components/HocanceTop5Section.tsx` (+`.test.tsx`) | 카드 예약 → 시트 |
| 수정 | `apps/mobile/src/features/spot/components/NearbyStaysSection.tsx` (+`.test.tsx`) | 카드 예약 → 시트 |
| 수정 | 모바일 픽스처 6종 | `agodaHotelId`/`agoda_hotel_id` 추가 |
| 수정 | `apps/mobile/.env.local` | `EXPO_PUBLIC_AGODA_CID` 재도입 |
| 생성 | `apps/web/src/features/stays/agodaHidParser.ts` (+`.test.ts`) | hid 추출/검증 복원 |
| 수정 | `apps/web/src/features/stays/staySchema.ts` (+`.test.ts`) | `agoda_hotel_id` 필드 |
| 수정 | `apps/web/src/lib/data/stays.ts` | `buildStayWriteInput`, `updateStayAgodaHotelId` |
| 수정 | `apps/web/src/features/stays/actions.ts` | `updateStayAgodaHotelIdAction` |
| 수정 | `apps/web/src/features/stays/StayDetailForm.tsx` | Agoda 호텔 ID 카드 |
| 수정 | `apps/web/src/features/import/ImportFormatGuide.tsx` | `agoda_hotel_id` 안내·예시 |

---

## Task 0: 작업 브랜치 생성

- [ ] **Step 1: feature 브랜치 분기**

```bash
git checkout -b feat/stays-revive-agoda-booking
```

---

## Task 1: 모바일 타입 — `agodaHotelId` / `agoda_hotel_id` 재추가

**Files:**
- Modify: `apps/mobile/src/shared/data/types.ts:102` (Stay), `:128` (StayRow)

- [ ] **Step 1: `Stay`에 필드 추가**

`types.ts`의 `tripcomBookingUrl: string | null;`(102) 줄 **바로 아래**에 추가:

```ts
  tripcomBookingUrl: string | null;
  agodaHotelId: string | null;
```

- [ ] **Step 2: `StayRow`에 필드 추가**

`StayRow`의 `tripcom_booking_url: string | null;`(128) 줄 **바로 아래**에 추가:

```ts
  tripcom_booking_url: string | null;
  agoda_hotel_id: string | null;
```

- [ ] **Step 3: 타입체크 (실패 예상)**

Run: `cd apps/mobile && npx tsc --noEmit`
Expected: FAIL — 매퍼·픽스처가 아직 `agodaHotelId`를 채우지 않음(Task 2~3에서 해결). 예상된 에러.

- [ ] **Step 4: Commit**

```bash
git add apps/mobile/src/shared/data/types.ts
git commit -m "feat(mobile): Stay/StayRow에 agodaHotelId 재추가

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 2: 모바일 매퍼 — `toStay` agoda 매핑 (TDD)

**Files:**
- Modify: `apps/mobile/src/shared/data/stayMappers.ts:33`
- Test: `apps/mobile/src/shared/data/stayMappers.test.ts:22` (baseStayRow), `:179` 뒤(신규 테스트)

- [ ] **Step 1: 픽스처에 `agoda_hotel_id` 추가**

`stayMappers.test.ts`의 `baseStayRow`에서 `tripcom_booking_url: null,`(22) 줄 **바로 아래**에 추가:

```ts
  tripcom_booking_url: null,
  agoda_hotel_id: null,
```

- [ ] **Step 2: 실패 테스트 추가**

`stayMappers.test.ts`의 tripcom 매핑 테스트(175~179줄) **바로 아래**, `returns naverRating null when score is NaN ...` 테스트 **앞**에 추가:

```ts
  it('agoda_hotel_id가 null이면 agodaHotelId를 null로 매핑한다', () => {
    const stay = toStay({ ...baseStayRow, agoda_hotel_id: null });
    expect(stay.agodaHotelId).toBeNull();
  });

  it('agoda_hotel_id가 있으면 agodaHotelId로 그대로 매핑한다', () => {
    const stay = toStay({ ...baseStayRow, agoda_hotel_id: '24180119' });
    expect(stay.agodaHotelId).toBe('24180119');
  });
```

- [ ] **Step 3: 테스트 실패 확인**

Run: `cd apps/mobile && npx vitest run src/shared/data/stayMappers.test.ts`
Expected: FAIL (`toStay`가 `agodaHotelId`를 반환하지 않음 → `undefined`)

- [ ] **Step 4: 매퍼 구현**

`stayMappers.ts`의 `tripcomBookingUrl: row.tripcom_booking_url ?? null,`(33) 줄 **바로 아래**에 추가:

```ts
    tripcomBookingUrl: row.tripcom_booking_url ?? null,
    agodaHotelId: row.agoda_hotel_id ?? null,
```

- [ ] **Step 5: 테스트 통과 확인**

Run: `cd apps/mobile && npx vitest run src/shared/data/stayMappers.test.ts`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add apps/mobile/src/shared/data/stayMappers.ts apps/mobile/src/shared/data/stayMappers.test.ts
git commit -m "feat(mobile): stayMappers에 agodaHotelId 매핑 추가

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 3: 모바일 픽스처 스윕 — Stay/StayRow 리터럴에 agoda 필드 추가

**Files (각 파일에서 1곳씩):**
- `apps/mobile/src/features/stays/components/StayCard.test.tsx:27`
- `apps/mobile/src/features/home/components/HocanceTop5Section.test.tsx:39`
- `apps/mobile/src/features/spot/lib/findNearbyStays.test.ts:15`
- `apps/mobile/src/features/home/lib/rankStays.test.ts:18`
- `apps/mobile/src/features/stays/lib/findClosestSpot.test.ts:15`
- `apps/mobile/src/features/spot/components/NearbyStaysSection.test.tsx:33`
- `apps/mobile/src/shared/data/stayRepository.test.ts:21`

- [ ] **Step 1: Stay 리터럴 6곳에 `agodaHotelId: null` 추가**

각 파일에서 `tripcomBookingUrl: null,`이 있는 Stay 리터럴(또는 `makeStay` base)에 `agodaHotelId: null,`를 인접 추가한다.

예 — `StayCard.test.tsx`(27줄):
```ts
  tripcomBookingUrl: null,
  agodaHotelId: null,
```

예 — `findNearbyStays.test.ts`(15줄, makeStay base):
```ts
    tripcomBookingUrl: null,
    agodaHotelId: null,
```

예 — `HocanceTop5Section.test.tsx`(39줄, 한 줄에 여러 필드):
```ts
    tripcomBookingUrl: null, agodaHotelId: null, bookingQueryOverride: null, naverRating: { score: 4.5, url: '' },
```

`rankStays.test.ts`(18), `findClosestSpot.test.ts`(15), `NearbyStaysSection.test.tsx`(33)도 동일하게 `tripcomBookingUrl: null,` 인접에 `agodaHotelId: null,`를 추가한다.

- [ ] **Step 2: StayRow 리터럴에 `agoda_hotel_id: null` 추가**

`stayRepository.test.ts`의 `stayRow`(21줄)에서:
```ts
  tripcom_booking_url: null,
  agoda_hotel_id: null,
```
(`stayRows`는 `stayRow`를 스프레드하므로 추가 편집 불필요.)

- [ ] **Step 3: 타입체크 (전체 통과 기대)**

Run: `cd apps/mobile && npx tsc --noEmit`
Expected: PASS (모든 Stay/StayRow 리터럴이 새 필드를 채움)

- [ ] **Step 4: 모바일 전체 테스트**

Run: `cd apps/mobile && npx vitest run`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add apps/mobile/src
git commit -m "test(mobile): Stay/StayRow 픽스처에 agodaHotelId 추가

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 4: 모바일 affiliateHotel — `openAgodaHotel` + Agoda 빌더 부활 (TDD)

**Files:**
- Modify: `apps/mobile/src/features/stays/lib/affiliateHotel.ts`
- Test: `apps/mobile/src/features/stays/lib/affiliateHotel.test.ts`

- [ ] **Step 1: 실패 테스트 추가**

`affiliateHotel.test.ts` 상단 import에 Agoda 심볼을 추가한다:

```ts
import {
  buildAgodaHotelDeepLink,
  buildAgodaHotelSearchUrl,
  buildTripcomHotelSearchUrl,
  openAgodaHotel,
  openTripcomHotel,
  resolveBookingQuery,
} from './affiliateHotel';
```

파일 **맨 끝**에 아래 describe 블록을 추가한다:

```ts
describe('buildAgodaHotelSearchUrl', () => {
  it('partnersearch + hname + hl 파라미터를 포함한다', () => {
    const url = buildAgodaHotelSearchUrl('호텔 나루');
    expect(url.startsWith('https://www.agoda.com/partners/partnersearch.aspx')).toBe(true);
    expect(url).toContain(`hname=${encodeURIComponent('호텔 나루')}`);
    expect(url).toContain('hl=ko-kr');
  });
});

describe('buildAgodaHotelDeepLink', () => {
  it('hid 파라미터로 호텔 페이지 직링크를 만든다', () => {
    const url = buildAgodaHotelDeepLink('24180119');
    expect(url.startsWith('https://www.agoda.com/partners/partnersearch.aspx')).toBe(true);
    expect(url).toContain('hid=24180119');
    expect(url).toContain('hl=ko-kr');
  });

  it('EXPO_PUBLIC_AGODA_CID가 설정되면 cid 파라미터를 포함한다', () => {
    const prev = process.env.EXPO_PUBLIC_AGODA_CID;
    process.env.EXPO_PUBLIC_AGODA_CID = '1965770';
    try {
      expect(buildAgodaHotelDeepLink('24180119')).toContain('cid=1965770');
    } finally {
      if (prev === undefined) delete process.env.EXPO_PUBLIC_AGODA_CID;
      else process.env.EXPO_PUBLIC_AGODA_CID = prev;
    }
  });
});

describe('openAgodaHotel', () => {
  beforeEach(() => { vi.restoreAllMocks(); });

  it('agodaHotelId가 있으면 hid 직링크를 연다', async () => {
    const openSpy = vi.spyOn(Linking, 'openURL').mockResolvedValue(true as unknown as void);
    await openAgodaHotel({ name: '호텔 나루', queryOverride: null, agodaHotelId: '24180119' });
    const calledUrl = openSpy.mock.calls[0][0] as string;
    expect(calledUrl).toContain('hid=24180119');
    expect(calledUrl).not.toContain('hname=');
  });

  it('agodaHotelId가 null이면 호텔명 검색을 연다', async () => {
    const openSpy = vi.spyOn(Linking, 'openURL').mockResolvedValue(true as unknown as void);
    await openAgodaHotel({ name: '호텔 나루', queryOverride: null, agodaHotelId: null });
    const calledUrl = openSpy.mock.calls[0][0] as string;
    expect(calledUrl).toContain('hname=');
    expect(calledUrl).not.toContain('hid=');
  });

  it('agodaHotelId가 공백이면 호텔명 검색을 연다', async () => {
    const openSpy = vi.spyOn(Linking, 'openURL').mockResolvedValue(true as unknown as void);
    await openAgodaHotel({ name: '호텔 나루', queryOverride: null, agodaHotelId: '   ' });
    expect((openSpy.mock.calls[0][0] as string)).toContain('hname=');
  });

  it('Linking 실패 시 Alert.alert가 호출된다', async () => {
    vi.spyOn(Linking, 'openURL').mockRejectedValue(new Error('cannot open'));
    const alertSpy = vi.spyOn(Alert, 'alert').mockImplementation(() => {});
    await openAgodaHotel({ name: '호텔 나루', queryOverride: null, agodaHotelId: null });
    expect(alertSpy).toHaveBeenCalledTimes(1);
    expect(alertSpy.mock.calls[0][0]).toContain('예약');
  });
});
```

- [ ] **Step 2: 테스트 실패 확인**

Run: `cd apps/mobile && npx vitest run src/features/stays/lib/affiliateHotel.test.ts`
Expected: FAIL (`buildAgodaHotelSearchUrl`/`buildAgodaHotelDeepLink`/`openAgodaHotel` 미정의)

- [ ] **Step 3: affiliateHotel.ts에 Agoda 경로 추가**

`affiliateHotel.ts`에서 `openTripcomHotel` 함수 **위**, `copyToClipboardSilent` 정의 **아래**(혹은 trip.com 빌더 근처)에 아래를 추가한다. 기존 trip.com 코드는 변경하지 않는다:

```ts
// Agoda Partners 호텔명 검색 / 호텔 직링크.
// cid는 EXPO_PUBLIC_AGODA_CID (.env.local)로 주입. 미설정 시 cid 없이 진입(수익 추적 불가).
const AGODA_PARTNER_SEARCH_BASE = 'https://www.agoda.com/partners/partnersearch.aspx';

function resolveAgodaCid(): string {
  return process.env.EXPO_PUBLIC_AGODA_CID?.trim() ?? '';
}

/** 호텔명으로 Agoda Partner Search 결과 페이지 진입 */
export function buildAgodaHotelSearchUrl(query: string): string {
  const cid = resolveAgodaCid();
  const parts = ['hl=ko-kr', `hname=${encode(query)}`];
  if (cid.length > 0) parts.unshift(`cid=${encode(cid)}`);
  return `${AGODA_PARTNER_SEARCH_BASE}?${parts.join('&')}`;
}

/** Agoda hid로 해당 호텔 페이지 직접 진입 */
export function buildAgodaHotelDeepLink(hotelId: string): string {
  const cid = resolveAgodaCid();
  const parts = ['hl=ko-kr', `hid=${encode(hotelId)}`];
  if (cid.length > 0) parts.unshift(`cid=${encode(cid)}`);
  return `${AGODA_PARTNER_SEARCH_BASE}?${parts.join('&')}`;
}

export async function openAgodaHotel(opts: {
  name: string;
  queryOverride: string | null;
  agodaHotelId: string | null;
}): Promise<void> {
  const hid = (opts.agodaHotelId ?? '').trim();
  const url =
    hid.length > 0
      ? buildAgodaHotelDeepLink(hid)
      : buildAgodaHotelSearchUrl(resolveBookingQuery(opts.name, opts.queryOverride));

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

> `encode`, `resolveBookingQuery`, `copyToClipboardSilent`는 파일에 이미 정의되어 있으므로 재사용한다.

- [ ] **Step 4: 테스트 통과 확인**

Run: `cd apps/mobile && npx vitest run src/features/stays/lib/affiliateHotel.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add apps/mobile/src/features/stays/lib/affiliateHotel.ts apps/mobile/src/features/stays/lib/affiliateHotel.test.ts
git commit -m "feat(mobile): openAgodaHotel + Agoda URL 빌더 부활

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 5: 모바일 — `BookingProviderSheet` 바텀시트 (TDD)

**Files:**
- Create: `apps/mobile/src/features/stays/components/BookingProviderSheet.tsx`
- Test: `apps/mobile/src/features/stays/components/BookingProviderSheet.test.tsx`

- [ ] **Step 1: 실패 테스트 작성**

`BookingProviderSheet.test.tsx` 생성:

```tsx
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render } from '@testing-library/react-native';

import type { Stay } from '../../../shared/data/types';
import { BookingProviderSheet } from './BookingProviderSheet';
import { openAgodaHotel, openTripcomHotel } from '../lib/affiliateHotel';

vi.mock('../lib/affiliateHotel', () => ({
  openTripcomHotel: vi.fn(),
  openAgodaHotel: vi.fn(),
}));

function asEl(node: unknown): HTMLElement {
  return node as unknown as HTMLElement;
}

const stay: Stay = {
  id: 'stay-1', slug: 'hotel-naru', name: '호텔 나루',
  regionPrimary: '인천', regionSecondary: '중구', address: '인천 중구 어디로 1',
  latitude: 37.45, longitude: 126.63, stayType: 'city', seasonTags: [],
  seasonWindowStart: null, seasonWindowEnd: null, shortTagline: '', description: '',
  recommendationPoints: [], tripcomBookingUrl: 'https://kr.trip.com/x', agodaHotelId: '24180119',
  thumbnailUrl: null, bookingQueryOverride: null, naverRating: null, googleRating: null,
  ratingCapturedAt: null, isFeatured: false, displayOrder: 0,
};

describe('BookingProviderSheet', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('두 provider 행을 모두 렌더링한다', () => {
    const { getByTestId } = render(<BookingProviderSheet stay={stay} onClose={vi.fn()} />);
    expect(getByTestId('booking-sheet-tripcom')).toBeTruthy();
    expect(getByTestId('booking-sheet-agoda')).toBeTruthy();
  });

  it('trip.com 행 탭 시 openTripcomHotel과 onClose가 호출된다', () => {
    const onClose = vi.fn();
    const { getByTestId } = render(<BookingProviderSheet stay={stay} onClose={onClose} />);
    asEl(getByTestId('booking-sheet-tripcom')).dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(vi.mocked(openTripcomHotel)).toHaveBeenCalledWith({
      name: '호텔 나루', queryOverride: null, tripcomBookingUrl: 'https://kr.trip.com/x',
    });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('Agoda 행 탭 시 openAgodaHotel과 onClose가 호출된다', () => {
    const onClose = vi.fn();
    const { getByTestId } = render(<BookingProviderSheet stay={stay} onClose={onClose} />);
    asEl(getByTestId('booking-sheet-agoda')).dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(vi.mocked(openAgodaHotel)).toHaveBeenCalledWith({
      name: '호텔 나루', queryOverride: null, agodaHotelId: '24180119',
    });
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
```

- [ ] **Step 2: 테스트 실패 확인**

Run: `cd apps/mobile && npx vitest run src/features/stays/components/BookingProviderSheet.test.tsx`
Expected: FAIL (`BookingProviderSheet` 미존재)

- [ ] **Step 3: 컴포넌트 구현**

`BookingProviderSheet.tsx` 생성:

```tsx
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import type { Stay } from '../../../shared/data/types';
import { colors } from '../../../shared/theme/colors';
import { openAgodaHotel, openTripcomHotel } from '../lib/affiliateHotel';

type Props = {
  stay: Stay | null;
  onClose: () => void;
};

export function BookingProviderSheet({ stay, onClose }: Props) {
  const handleTripcom = () => {
    if (stay) {
      void openTripcomHotel({
        name: stay.name,
        queryOverride: stay.bookingQueryOverride,
        tripcomBookingUrl: stay.tripcomBookingUrl,
      });
    }
    onClose();
  };

  const handleAgoda = () => {
    if (stay) {
      void openAgodaHotel({
        name: stay.name,
        queryOverride: stay.bookingQueryOverride,
        agodaHotelId: stay.agodaHotelId,
      });
    }
    onClose();
  };

  return (
    <Modal visible={stay != null} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable testID="booking-sheet-backdrop" style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={() => {}}>
          <View style={styles.handle} />
          <Text style={styles.title}>어디서 예약할까요?</Text>
          <Pressable testID="booking-sheet-tripcom" style={styles.row} onPress={handleTripcom}>
            <Text style={styles.rowText}>trip.com에서 예약하기</Text>
            <Text style={styles.rowArrow}>→</Text>
          </Pressable>
          <Pressable testID="booking-sheet-agoda" style={styles.row} onPress={handleAgoda}>
            <Text style={styles.rowText}>Agoda에서 예약하기</Text>
            <Text style={styles.rowArrow}>→</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 32,
    gap: 10,
  },
  handle: {
    alignSelf: 'center',
    backgroundColor: colors.border,
    borderRadius: 999,
    height: 4,
    marginBottom: 8,
    width: 40,
  },
  title: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 6,
  },
  row: {
    alignItems: 'center',
    backgroundColor: colors.cardAlt,
    borderRadius: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  rowText: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '700',
  },
  rowArrow: {
    color: colors.textMuted,
    fontSize: 16,
    fontWeight: '700',
  },
});
```

> `colors.cardAlt`는 기존 테마에 존재한다(StayCard에서 사용). 없으면 `colors.background` 등 인접 토큰으로 대체.

- [ ] **Step 4: 테스트 통과 확인**

Run: `cd apps/mobile && npx vitest run src/features/stays/components/BookingProviderSheet.test.tsx`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add apps/mobile/src/features/stays/components/BookingProviderSheet.tsx apps/mobile/src/features/stays/components/BookingProviderSheet.test.tsx
git commit -m "feat(mobile): provider 선택 바텀시트 BookingProviderSheet 추가

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 6: 모바일 화면 배선 — 3개 섹션 시트 + 상세 두 버튼

**Files:**
- Modify: `apps/mobile/src/features/stays/screens/StayListScreen.tsx`
- Modify: `apps/mobile/src/features/home/components/HocanceTop5Section.tsx`
- Modify: `apps/mobile/src/features/spot/components/NearbyStaysSection.tsx`
- Modify: `apps/mobile/src/features/stays/screens/StayDetailScreen.tsx`
- Modify (test mock): `apps/mobile/src/features/home/components/HocanceTop5Section.test.tsx`, `apps/mobile/src/features/spot/components/NearbyStaysSection.test.tsx`

- [ ] **Step 1: StayListScreen — 카드 예약을 시트로**

import 교체:
```tsx
import { useState } from 'react';
```
(파일 상단에 `react` import가 없으면 추가. 기존 `import { useRouter } ...` 줄들과 함께 둔다.)

```tsx
import { BookingProviderSheet } from '../components/BookingProviderSheet';
```
그리고 `import { openTripcomHotel } from '../lib/affiliateHotel';` 줄을 **삭제**한다(더 이상 직접 호출하지 않음). `import type { Stay } ...`가 없으면 추가:
```tsx
import type { Stay } from '../../../shared/data/types';
```

`StayListScreen` 함수 본문 상단(`const router = useRouter();` 아래)에 상태 추가:
```tsx
  const [bookingStay, setBookingStay] = useState<Stay | null>(null);
```

`onPressBook` 교체:
```tsx
              onPressBook={() => setBookingStay(stay)}
```

`ScreenShell` 닫는 태그 **직전**(마지막 `{stays.map(...)}` 블록 뒤)에 시트 렌더 추가:
```tsx
      <BookingProviderSheet stay={bookingStay} onClose={() => setBookingStay(null)} />
```

- [ ] **Step 2: HocanceTop5Section — 카드 예약을 시트로**

`import { openTripcomHotel } from '../../stays/lib/affiliateHotel';` → **삭제**.
추가:
```tsx
import { useMemo, useState } from 'react';
import type { Stay } from '../../../shared/data/types';
import { BookingProviderSheet } from '../../stays/components/BookingProviderSheet';
```
(기존 `import { useMemo } from 'react';`를 위 형태로 합친다.)

함수 본문에 상태 추가(`const router = useRouter();` 아래):
```tsx
  const [bookingStay, setBookingStay] = useState<Stay | null>(null);
```

`onPressBook` 교체:
```tsx
              onPressBook={() => setBookingStay(stay)}
```

최상위 `</View>` 닫기 **직전**에 시트 추가:
```tsx
      <BookingProviderSheet stay={bookingStay} onClose={() => setBookingStay(null)} />
```

- [ ] **Step 3: NearbyStaysSection — 카드 예약을 시트로**

`import { openTripcomHotel } from '../../stays/lib/affiliateHotel';` → **삭제**.
추가:
```tsx
import { useMemo, useState } from 'react';
import { BookingProviderSheet } from '../../stays/components/BookingProviderSheet';
```
(기존 `import { useMemo } from 'react';`와 합친다. `import type { FlowerSpot } ...`에 `Stay`를 추가: `import type { FlowerSpot, Stay } from '../../../shared/data/types';`)

함수 본문에 상태 추가(`const router = useRouter();` 아래):
```tsx
  const [bookingStay, setBookingStay] = useState<Stay | null>(null);
```

`onPressBook` 교체:
```tsx
            onPressBook={() => setBookingStay(stay)}
```

최상위 `</View>` 닫기 **직전**(`{showMore ? ... : null}` 뒤)에 시트 추가:
```tsx
      <BookingProviderSheet stay={bookingStay} onClose={() => setBookingStay(null)} />
```

- [ ] **Step 4: StayDetailScreen — hero 시트 + 두 버튼 + 문구**

import 수정:
```tsx
import { useState } from 'react';
```
(`react-native` import 줄 위에 추가.)

```tsx
import { openAgodaHotel, openTripcomHotel, resolveBookingQuery } from '../lib/affiliateHotel';
import { BookingProviderSheet } from '../components/BookingProviderSheet';
```
(기존 `import { openTripcomHotel, resolveBookingQuery } from '../lib/affiliateHotel';`를 위로 교체.)

`StayDetailScreen` 본문에 상태 추가(useQuery 선언들 아래, `if (isLoading)` 위):
```tsx
  const [bookingStay, setBookingStay] = useState<Stay | null>(null);
```

기존 `handleBook` 함수를 **삭제**한다(아래 두 핸들러로 대체).

`SpotHeroCard`의 `primaryButton`을 교체:
```tsx
        primaryButton={{ label: '예약하기 →', onPress: () => setBookingStay(stay) }}
```

예약 섹션(`<SectionCard title="예약·찾아가기">` 내부)의 검색어 라벨과 단일 버튼(204~207줄)을 아래로 **교체**:
```tsx
        <Text style={styles.bookingQueryLabel}>검색어: "{bookingQuery}"</Text>
        <Pressable
          testID="stay-detail-book-tripcom"
          onPress={() =>
            void openTripcomHotel({
              name: stay.name,
              queryOverride: stay.bookingQueryOverride,
              tripcomBookingUrl: stay.tripcomBookingUrl,
            })
          }
          style={styles.primaryButton}
        >
          <Text style={styles.primaryButtonText}>trip.com에서 예약하기 →</Text>
        </Pressable>
        <Pressable
          testID="stay-detail-book-agoda"
          onPress={() =>
            void openAgodaHotel({
              name: stay.name,
              queryOverride: stay.bookingQueryOverride,
              agodaHotelId: stay.agodaHotelId,
            })
          }
          style={styles.secondaryBookButton}
        >
          <Text style={styles.secondaryBookButtonText}>Agoda에서 예약하기 →</Text>
        </Pressable>
```

`ScreenShell` 닫는 태그 **직전**(마지막 `{stay.description ? ... : null}` 뒤)에 시트 추가:
```tsx
      <BookingProviderSheet stay={bookingStay} onClose={() => setBookingStay(null)} />
```

`StyleSheet.create({ ... })`에 두 스타일 추가(기존 `primaryButton`/`primaryButtonText` 근처):
```tsx
  secondaryBookButton: {
    alignItems: 'center',
    backgroundColor: colors.background,
    borderColor: colors.primary,
    borderRadius: 14,
    borderWidth: 1,
    marginTop: 8,
    paddingVertical: 14,
  },
  secondaryBookButtonText: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '700',
  },
```

- [ ] **Step 5: 섹션 테스트 mock에 openAgodaHotel 추가**

`HocanceTop5Section.test.tsx`와 `NearbyStaysSection.test.tsx`의 affiliateHotel mock을 아래로 교체(시트가 모듈을 import하므로 두 export 모두 mock):
```tsx
vi.mock('../../stays/lib/affiliateHotel', () => ({
  openTripcomHotel: vi.fn(),
  openAgodaHotel: vi.fn(),
}));
```

- [ ] **Step 6: 타입체크 + 전체 테스트**

Run: `cd apps/mobile && npx tsc --noEmit`
Expected: PASS
Run: `cd apps/mobile && npx vitest run`
Expected: PASS

- [ ] **Step 7: 잔여 직접호출 확인**

Run: `grep -rn "openTripcomHotel(" apps/mobile/src/features/stays/screens apps/mobile/src/features/home apps/mobile/src/features/spot`
Expected: `StayDetailScreen.tsx`의 trip.com 버튼 1곳만(섹션 카드 3곳은 시트 경유로 직접호출 없음).

- [ ] **Step 8: Commit**

```bash
git add apps/mobile/src/features
git commit -m "feat(mobile): 콤팩트 진입점 예약 시트화 + 상세 두 버튼(trip.com/Agoda)

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 7: 모바일 환경변수 — `EXPO_PUBLIC_AGODA_CID` 재도입

**Files:**
- Modify: `apps/mobile/.env.local`

- [ ] **Step 1: env 라인 추가**

`apps/mobile/.env.local`에 승인된 cid 값으로 추가(값은 지시자에게 확인):
```
EXPO_PUBLIC_AGODA_CID=<승인된_cid>
```

- [ ] **Step 2: 코드 참조 확인**

Run: `grep -rn "EXPO_PUBLIC_AGODA_CID" apps/mobile/src`
Expected: `affiliateHotel.ts` 1곳(Task 4에서 추가됨).

> `.env.local`은 git 비추적일 수 있다. 추적 대상이 아니면 커밋은 생략한다(빌드/OTA 시 env가 번들에 인라인됨 — 값 설정 후 EAS Update 필요).

---

## Task 8: 웹 import 스키마 — `agoda_hotel_id` 필드 (TDD)

**Files:**
- Modify: `apps/web/src/features/stays/staySchema.ts:43`
- Test: `apps/web/src/features/stays/staySchema.test.ts`

- [ ] **Step 1: 실패 테스트 추가**

`staySchema.test.ts`의 tripcom 테스트 블록(146~164줄) **뒤**에 추가:
```ts
  it('agoda_hotel_id null/생략 모두 허용', () => {
    expect(staySchema.safeParse({ ...baseStay }).success).toBe(true);
    expect(staySchema.safeParse({ ...baseStay, agoda_hotel_id: null }).success).toBe(true);
  });

  it('agoda_hotel_id 숫자 문자열 허용', () => {
    const r = staySchema.parse({ ...baseStay, agoda_hotel_id: '24180119' });
    expect(r.agoda_hotel_id).toBe('24180119');
  });

  it('agoda_hotel_id 비숫자 차단', () => {
    expect(staySchema.safeParse({ ...baseStay, agoda_hotel_id: 'abc' }).success).toBe(false);
    expect(staySchema.safeParse({ ...baseStay, agoda_hotel_id: 'https://agoda.com/x?hid=1' }).success).toBe(false);
  });
```

- [ ] **Step 2: 테스트 실패 확인**

Run: `cd apps/web && npx vitest run src/features/stays/staySchema.test.ts`
Expected: FAIL (`agoda_hotel_id` 스키마 미정의 — 숫자/비숫자 케이스 불일치)

- [ ] **Step 3: 스키마 필드 추가**

`staySchema.ts`의 `tripcom_booking_url: httpsOnlyUrlSchema.nullable().optional(),`(43) 줄 **바로 아래**에 추가:
```ts
    tripcom_booking_url: httpsOnlyUrlSchema.nullable().optional(),
    agoda_hotel_id: z.string().trim().regex(/^\d+$/, { message: 'agoda_hotel_id는 숫자만 허용됩니다' }).nullable().optional(),
```

- [ ] **Step 4: 테스트 통과 확인**

Run: `cd apps/web && npx vitest run src/features/stays/staySchema.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/features/stays/staySchema.ts apps/web/src/features/stays/staySchema.test.ts
git commit -m "feat(web): stay import 스키마에 agoda_hotel_id 재추가

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 9: 웹 — `agodaHidParser` 복원 (TDD)

**Files:**
- Create: `apps/web/src/features/stays/agodaHidParser.ts`
- Test: `apps/web/src/features/stays/agodaHidParser.test.ts`

- [ ] **Step 1: 실패 테스트 작성**

`agodaHidParser.test.ts` 생성:
```ts
import { describe, expect, it } from 'vitest';

import { parseAgodaHotelId } from './agodaHidParser';

describe('parseAgodaHotelId', () => {
  it('숫자만 입력하면 그대로 반환한다', () => {
    expect(parseAgodaHotelId('24180119')).toBe('24180119');
  });

  it('전체 Agoda URL에서 hid를 추출한다', () => {
    const url = 'https://www.agoda.com/partners/partnersearch.aspx?pcs=1&cid=1965770&hl=ko-kr&hid=24180119';
    expect(parseAgodaHotelId(url)).toBe('24180119');
  });

  it('빈 입력/공백은 null', () => {
    expect(parseAgodaHotelId('')).toBeNull();
    expect(parseAgodaHotelId('   ')).toBeNull();
    expect(parseAgodaHotelId(null)).toBeNull();
    expect(parseAgodaHotelId(undefined)).toBeNull();
  });

  it('agoda.com이 아닌 도메인은 null', () => {
    expect(parseAgodaHotelId('https://example.com/?hid=24180119')).toBeNull();
  });

  it('hid가 없거나 비숫자면 null', () => {
    expect(parseAgodaHotelId('https://www.agoda.com/partners/partnersearch.aspx?cid=1')).toBeNull();
    expect(parseAgodaHotelId('https://www.agoda.com/x?hid=abc')).toBeNull();
    expect(parseAgodaHotelId('not-a-url')).toBeNull();
  });
});
```

- [ ] **Step 2: 테스트 실패 확인**

Run: `cd apps/web && npx vitest run src/features/stays/agodaHidParser.test.ts`
Expected: FAIL (모듈 미존재)

- [ ] **Step 3: 파서 구현**

`agodaHidParser.ts` 생성:
```ts
/**
 * Agoda Partner Search 결과 URL에서 hid를 추출하거나, 숫자만 입력된 경우 그대로 반환한다.
 *
 * 허용 입력:
 * - 전체 URL: "https://www.agoda.com/partners/partnersearch.aspx?cid=1965770&hl=ko-kr&hid=24180119"
 * - 숫자 ID 직접: "24180119"
 * - 빈 문자열 / 공백 / 잘못된 형식 / hid 없는 URL → null
 */
export function parseAgodaHotelId(input: string | null | undefined): string | null {
  if (input == null) return null;
  const trimmed = input.trim();
  if (trimmed.length === 0) return null;

  // 숫자만 입력: 그대로 반환
  if (/^\d+$/.test(trimmed)) return trimmed;

  // URL 파싱 시도
  try {
    const url = new URL(trimmed);
    if (!/(^|\.)agoda\.com$/i.test(url.hostname)) return null;
    const hid = url.searchParams.get('hid');
    if (hid == null) return null;
    const cleaned = hid.trim();
    if (!/^\d+$/.test(cleaned)) return null;
    return cleaned;
  } catch {
    return null;
  }
}
```

- [ ] **Step 4: 테스트 통과 확인**

Run: `cd apps/web && npx vitest run src/features/stays/agodaHidParser.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/features/stays/agodaHidParser.ts apps/web/src/features/stays/agodaHidParser.test.ts
git commit -m "feat(web): Agoda hid 파서 복원

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 10: 웹 데이터 계층 — `buildStayWriteInput` / `updateStayAgodaHotelId`

**Files:**
- Modify: `apps/web/src/lib/data/stays.ts:20` (buildStayWriteInput), `:103` 뒤(신규 함수)

- [ ] **Step 1: buildStayWriteInput에 필드 추가**

`stays.ts`의 `tripcom_booking_url: emptyToNull(input.tripcom_booking_url),`(20) 줄 **바로 아래**에 추가:
```ts
    tripcom_booking_url: emptyToNull(input.tripcom_booking_url),
    agoda_hotel_id: emptyToNull(input.agoda_hotel_id),
```

- [ ] **Step 2: 업데이트 함수 추가**

`updateStayTripcomUrl` 함수(95~103줄) **바로 아래**에 추가:
```ts
/**
 * 호텔 Agoda hid 업데이트. null이면 컬럼을 비움 (검색 fallback).
 */
export async function updateStayAgodaHotelId(
  client: SupabaseClient<Database>,
  id: string,
  hid: string | null,
): Promise<void> {
  const update: StayUpdate = { agoda_hotel_id: hid };
  const { error } = await (client.from('stays') as any).update(update).eq('id', id);
  if (error != null) throw error;
}
```

- [ ] **Step 3: 타입체크**

Run: `cd apps/web && npx tsc --noEmit`
Expected: PASS (`StayUpdate`에 `agoda_hotel_id` 이미 존재 — types.ts)

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/lib/data/stays.ts
git commit -m "feat(web): stays 데이터 계층에 agoda_hotel_id 쓰기 복원

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 11: 웹 서버 액션 — `updateStayAgodaHotelIdAction`

**Files:**
- Modify: `apps/web/src/features/stays/actions.ts`

- [ ] **Step 1: import 추가**

`actions.ts` 상단 import를 교체:
```ts
import { bulkUpdateStayStatus, updateStayAgodaHotelId, updateStayTripcomUrl, updateStayThumbnail } from '@/lib/data/stays';
```
그리고 파서 import 추가(staySchema import 줄 근처):
```ts
import { parseAgodaHotelId } from './agodaHidParser';
```

- [ ] **Step 2: 액션 추가**

`updateStayTripcomUrlAction` 함수(48~66줄) **바로 아래**에 추가:
```ts
/**
 * 호텔 Agoda hid 업데이트.
 * 입력은 전체 Agoda URL 또는 숫자 hid 또는 빈 문자열(→ null, 검색 fallback).
 * 유효하지 않은 입력은 Error throw(폼이 메시지 표시).
 */
export async function updateStayAgodaHotelIdAction(id: string, rawInput: string): Promise<void> {
  const supabase = await createServerSupabaseClient();
  const client = supabase as unknown as SupabaseClient<Database>;

  const trimmed = rawInput.trim();
  let hid: string | null = null;
  if (trimmed.length > 0) {
    hid = parseAgodaHotelId(trimmed);
    if (hid == null) {
      throw new Error('유효한 Agoda 호텔 ID(숫자) 또는 Agoda 호텔 URL을 입력하세요.');
    }
  }

  await updateStayAgodaHotelId(client, id, hid);

  revalidatePath('/admin/stays');
  revalidatePath(`/admin/stays/${id}`);
}
```

- [ ] **Step 3: 타입체크**

Run: `cd apps/web && npx tsc --noEmit`
Expected: PASS (새 액션은 export만 된 상태 — 미사용 export는 tsc 에러가 아님. 폼 연결은 Task 12).

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/features/stays/actions.ts
git commit -m "feat(web): updateStayAgodaHotelIdAction 추가

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 12: 웹 어드민 폼 — Agoda 호텔 ID 카드

**Files:**
- Modify: `apps/web/src/features/stays/StayDetailForm.tsx`

- [ ] **Step 1: import 교체**

```tsx
import { updateStayAgodaHotelIdAction, updateStayThumbnailAction, updateStayTripcomUrlAction } from './actions';
```

- [ ] **Step 2: 상태/핸들러 추가**

`handleTripcomSubmit` 함수(31~46줄) **바로 아래**에 추가:
```tsx
  const [agodaPending, startAgodaTransition] = useTransition();
  const [agodaMessage, setAgodaMessage] = useState<{ kind: 'success' | 'error'; text: string } | null>(null);

  function handleAgodaSubmit(formData: FormData) {
    const raw = String(formData.get('agoda_hotel_id_input') ?? '');
    setAgodaMessage(null);
    startAgodaTransition(async () => {
      try {
        await updateStayAgodaHotelIdAction(stay.id, raw);
        setAgodaMessage({ kind: 'success', text: 'Agoda 호텔 ID를 저장했습니다.' });
        router.refresh();
      } catch (error) {
        setAgodaMessage({
          kind: 'error',
          text: error instanceof Error ? error.message : 'Agoda 호텔 ID 저장 중 오류가 발생했습니다.',
        });
      }
    });
  }
```

- [ ] **Step 3: Agoda 카드 JSX 추가**

trip.com 카드(`<Card className="overflow-hidden xl:col-span-full">` ... `</Card>`) **바로 아래**, 최상위 `</div>` **앞**에 추가:
```tsx
      <Card className="overflow-hidden xl:col-span-full">
        <CardHeader className="px-6 py-6">
          <CardTitle>Agoda 호텔 ID</CardTitle>
          <CardDescription>
            Agoda 호텔 페이지 URL 전체를 붙여넣거나 숫자 hid를 입력하세요. 비우면 호텔명으로 Agoda 검색이 열립니다.
          </CardDescription>
        </CardHeader>
        <CardContent className="px-6 pb-6">
          <form action={handleAgodaSubmit} className="space-y-4">
            <div className="rounded-2xl border border-border bg-background px-4 py-3">
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm font-medium text-foreground">현재 상태</span>
                {stay.agoda_hotel_id ? (
                  <Badge variant="default" className="rounded-full px-2.5 py-1">
                    직링크 활성
                  </Badge>
                ) : (
                  <Badge variant="outline" className="rounded-full px-2.5 py-1">
                    검색 fallback
                  </Badge>
                )}
              </div>
              {stay.agoda_hotel_id ? (
                <p className="mt-2 break-all text-sm text-foreground">hid: {stay.agoda_hotel_id}</p>
              ) : (
                <p className="mt-2 text-sm text-muted-foreground">
                  hid가 없어 호텔명 검색으로 fallback됩니다.
                </p>
              )}
            </div>
            <div className="space-y-2">
              <label htmlFor="agoda_hotel_id_input" className="text-sm font-medium text-foreground">
                Agoda 호텔 ID / URL 입력
              </label>
              <input
                id="agoda_hotel_id_input"
                name="agoda_hotel_id_input"
                type="text"
                defaultValue={stay.agoda_hotel_id ?? ''}
                placeholder="24180119 또는 https://www.agoda.com/partners/partnersearch.aspx?...&hid=..."
                className="w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm"
              />
            </div>
            <div className="flex items-center gap-3">
              <Button type="submit" disabled={agodaPending}>
                저장
              </Button>
              {agodaMessage ? (
                <p
                  className={
                    agodaMessage.kind === 'success'
                      ? 'text-sm text-foreground'
                      : 'text-sm text-destructive'
                  }
                  role={agodaMessage.kind === 'error' ? 'alert' : undefined}
                >
                  {agodaMessage.text}
                </p>
              ) : null}
            </div>
          </form>
        </CardContent>
      </Card>
```

- [ ] **Step 4: 타입체크 + 빌드**

Run: `cd apps/web && npx tsc --noEmit`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/features/stays/StayDetailForm.tsx
git commit -m "feat(web): 어드민 stay 상세에 Agoda 호텔 ID 카드 추가

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 13: 웹 import 안내 — ImportFormatGuide 갱신

**Files:**
- Modify: `apps/web/src/features/import/ImportFormatGuide.tsx:72,93,108,123`

- [ ] **Step 1: 예시 JSON에 agoda_hotel_id 추가 (93, 123줄)**

두 곳의 `"tripcom_booking_url": "https://kr.trip.com/hotels/detail/?hotelId=12345678&Allianceid=AAA&SID=BBB",` 줄 **바로 아래**에 추가:
```
      "agoda_hotel_id": "24180119",
```
(들여쓰기는 각 위치의 기존 줄에 맞춘다 — 93줄은 4칸+2, 123줄은 그 들여쓰기에 맞춤.)

- [ ] **Step 2: 힌트 문구 보강 (72, 108줄)**

72줄 hint 끝에 추가:
```
agoda_hotel_id는 Agoda 호텔 hid(숫자)로, 입력하면 Agoda 호텔 페이지로 직접 진입합니다. 없으면 호텔명으로 Agoda 검색 fallback됩니다.
```

108줄 hint의 옵션 필드 나열에 `tripcom_booking_url` 다음에 `agoda_hotel_id`를 추가:
```
…/thumbnail_url/tripcom_booking_url/agoda_hotel_id 등 옵션 필드는 3번 카드 예시 참고.
```

- [ ] **Step 3: 타입체크**

Run: `cd apps/web && npx tsc --noEmit`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/features/import/ImportFormatGuide.tsx
git commit -m "docs(web): import 안내에 agoda_hotel_id 추가

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 14: 통합 검증

- [ ] **Step 1: 전체 타입체크**

Run: `cd apps/web && npx tsc --noEmit` / `cd apps/mobile && npx tsc --noEmit`
Expected: 둘 다 PASS

- [ ] **Step 2: 전체 테스트**

Run: `cd apps/web && npx vitest run` / `cd apps/mobile && npx vitest run`
Expected: 둘 다 PASS

- [ ] **Step 3: 토스 미니앱 무영향 확인 (NFR-3)**

Run: `grep -rn "agoda\|tripcom\|BookingProviderSheet" apps/toss-mini/src 2>/dev/null`
Expected: 결과 없음

- [ ] **Step 4: web 빌드 (선택)**

Run: `cd apps/web && npm run build`
Expected: 빌드 성공

---

## 테스트 전략

**자동 테스트 (TDD 신규/수정):**
- `affiliateHotel.test.ts` — Agoda 직링크/검색/cid/실패 Alert (FR-2, FR-3, FR-4)
- `BookingProviderSheet.test.tsx` — 두 행 렌더·각 provider 오픈·onClose (FR-9)
- `stayMappers.test.ts` — `agoda_hotel_id → agodaHotelId` 매핑 (FR-1A, NFR-4)
- `staySchema.test.ts` — `agoda_hotel_id` 숫자 검증 (FR-6, NFR-1)
- `agodaHidParser.test.ts` — hid 추출/검증 (FR-5)

**수동 회귀 체크리스트:**
- [ ] (FR-7) 홈 Top5 / 호캉스 리스트 / 명소 근처 카드의 "예약 →" 탭 → provider 선택 바텀시트, 두 행 노출
- [ ] (FR-2) 시트에서 trip.com 행 → trip.com URL/검색, Agoda 행 → Agoda 직링크/검색
- [ ] (FR-7/FR-8) 상세 hero "예약하기 →" → 시트 / 예약 섹션 → "trip.com에서 예약하기" "Agoda에서 예약하기" 두 버튼 동시
- [ ] (FR-5) 어드민 stay 상세 — trip.com URL 카드 + Agoda 호텔 ID 카드 둘 다 노출, 저장/배지 동작
- [ ] (FR-5/NFR-1) Agoda 카드에 전체 URL 붙여넣기 → hid 추출 저장 / 비숫자 입력 → 거부 에러
- [ ] (FR-6) `{ stay: { …, tripcom_booking_url, agoda_hotel_id } }` import 성공
- [ ] (NFR-5) `EXPO_PUBLIC_AGODA_CID` 설정 빌드에서 Agoda URL에 cid 포함

---

## 전환·배포 절차 (스펙 외 — 운영)

1. **`EXPO_PUBLIC_AGODA_CID`를 빌드/OTA env에 설정** (승인된 cid).
2. **어드민에서 호텔별 `agoda_hotel_id` 입력** (Task 12 배포 후). 입력 전까진 Agoda 검색 fallback.
3. **모바일 변경을 OTA(EAS Update)로 배포** — 순수 JS/TS 변경(`EXPO_PUBLIC_AGODA_CID`는 export 시점 번들 인라인). 네이티브 변경 없음.
4. **두 provider 공존 — trip.com 데이터는 그대로 유지**.

---

## 완료 보고 항목 (스펙 ID 기준)

- FR-1: `tripcom_booking_url` (기존 유지 — 변경 없음)
- FR-1A: `agoda_hotel_id` 타입/매핑 (Task 1,2)
- FR-2/3/4: `openAgodaHotel`/Agoda 빌더 (Task 4)
- FR-5: 어드민 Agoda 카드 + hid 파서 (Task 9,11,12)
- FR-6: import 스키마/안내 (Task 8,13)
- FR-7: 콤팩트 시트 + 상세 두 버튼 (Task 5,6)
- FR-8: 상세 문구 (Task 6)
- FR-9: `BookingProviderSheet` (Task 5)
- NFR-1: agoda 숫자 검증(스키마/파서) (Task 8,9)
- NFR-3: toss-mini 무영향 (Task 14-3)
- NFR-4: `select('*')` 유지 (변경 없음 — 검증만)
- NFR-5: `EXPO_PUBLIC_AGODA_CID` 의존(provider별) (Task 4,7)
