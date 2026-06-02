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
    // expo-clipboard는 선택 의존성. 'expo-clipboard' as string 캐스트로 TS 정적 모듈 존재 체크를
    // 우회하고, 미설치 시 아래 catch에서 silent fail 처리한다.
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
