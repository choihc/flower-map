import { Linking } from 'react-native';

/**
 * https/http 외 스킴(`javascript:`, `file:` 등)을 차단하고 외부 URL을 연다.
 * 블로그 호스트 등 추가 정책이 필요한 곳은 호출 전에 별도 검증을 둘 것.
 */
export function openExternalHttpUrl(url: string | null | undefined): boolean {
  if (typeof url !== 'string' || !/^https?:\/\//i.test(url)) {
    console.warn('차단된 URL 스킴:', url);
    return false;
  }
  Linking.openURL(url).catch((err) => console.warn('openURL 실패', err));
  return true;
}
