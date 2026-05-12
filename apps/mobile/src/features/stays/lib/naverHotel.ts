import { Alert, Linking } from 'react-native';

const NAVER_SEARCH_BASE = 'https://m.search.naver.com/search.naver';

function encode(value: string): string {
  return encodeURIComponent(value);
}

export function buildNaverHotelSearchUrl(query: string): string {
  return `${NAVER_SEARCH_BASE}?where=m&query=${encode(query)}`;
}

export function resolveBookingQuery(name: string, override: string | null): string {
  const trimmed = (override ?? '').trim();
  if (trimmed.length > 0) return trimmed;
  return `${name} 숙박`;
}

async function copyToClipboardSilent(text: string): Promise<void> {
  try {
    const mod = (await import('expo-clipboard' as string)) as {
      setStringAsync?: (value: string) => Promise<unknown>;
    };
    await mod.setStringAsync?.(text);
  } catch {
    // expo-clipboard 미설치 등 — silent fail. 사용자에게는 Alert로 검색어 안내.
  }
}

export async function openNaverHotelSearch(opts: {
  name: string;
  queryOverride: string | null;
}): Promise<void> {
  const query = resolveBookingQuery(opts.name, opts.queryOverride);
  const url = buildNaverHotelSearchUrl(query);
  try {
    await Linking.openURL(url);
  } catch {
    await copyToClipboardSilent(query);
    Alert.alert(
      '예약 페이지를 열 수 없어요',
      `검색어를 복사했어요. 직접 붙여넣어 주세요.\n\n${query}`,
      [{ text: '확인' }],
    );
  }
}
