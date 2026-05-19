import { Alert, Linking } from 'react-native';

// Agoda Partners 호텔명 검색 딥링크.
// cid는 EXPO_PUBLIC_AGODA_CID (.env.local)로 주입. 미설정 시 cid 없이 진입(수익 추적 불가).
const AGODA_PARTNER_SEARCH_BASE = 'https://www.agoda.com/partners/partnersearch.aspx';

function encode(value: string): string {
  return encodeURIComponent(value);
}

export function resolveBookingQuery(name: string, override: string | null): string {
  const trimmed = (override ?? '').trim();
  if (trimmed.length > 0) return trimmed;
  return name;
}

export function buildAgodaHotelSearchUrl(query: string): string {
  const cid = process.env.EXPO_PUBLIC_AGODA_CID?.trim() ?? '';
  const parts = [`hl=ko-kr`, `hname=${encode(query)}`];
  if (cid.length > 0) parts.unshift(`cid=${encode(cid)}`);
  return `${AGODA_PARTNER_SEARCH_BASE}?${parts.join('&')}`;
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

export async function openAgodaHotelSearch(opts: {
  name: string;
  queryOverride: string | null;
}): Promise<void> {
  const query = resolveBookingQuery(opts.name, opts.queryOverride);
  const url = buildAgodaHotelSearchUrl(query);
  try {
    await Linking.openURL(url);
  } catch {
    await copyToClipboardSilent(query);
    Alert.alert(
      '예약 페이지를 열 수 없어요',
      `호텔명을 복사했어요. 직접 검색해 주세요.\n\n${query}`,
      [{ text: '확인' }],
    );
  }
}
