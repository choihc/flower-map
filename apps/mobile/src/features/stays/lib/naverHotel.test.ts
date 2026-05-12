import { describe, expect, it, vi, beforeEach } from 'vitest';
import { Alert, Linking } from 'react-native';

import {
  buildNaverHotelSearchUrl,
  openNaverHotelSearch,
  resolveBookingQuery,
} from './naverHotel';

describe('buildNaverHotelSearchUrl', () => {
  it('m.search.naver.com 도메인 + where=m + query 파라미터를 포함한다', () => {
    const url = buildNaverHotelSearchUrl('호텔 나루 숙박');
    expect(url.startsWith('https://m.search.naver.com/search.naver')).toBe(true);
    expect(url).toContain('where=m');
    expect(url).toContain('query=');
  });

  it('한글 검색어는 percent-encoded 된다', () => {
    const url = buildNaverHotelSearchUrl('호텔 나루 숙박');
    expect(url).toContain(encodeURIComponent('호텔 나루 숙박'));
    expect(url).not.toContain('호텔');
  });
});

describe('resolveBookingQuery', () => {
  it('override가 null이면 "<name> 숙박"을 반환한다', () => {
    expect(resolveBookingQuery('호텔 나루', null)).toBe('호텔 나루 숙박');
  });

  it('override가 공백만 있으면 기본 쿼리로 폴백한다', () => {
    expect(resolveBookingQuery('호텔 나루', '   ')).toBe('호텔 나루 숙박');
  });

  it('override가 비어있는 문자열이면 기본 쿼리로 폴백한다', () => {
    expect(resolveBookingQuery('호텔 나루', '')).toBe('호텔 나루 숙박');
  });

  it('override가 유효한 문자열이면 그대로 사용한다', () => {
    expect(resolveBookingQuery('호텔 나루', '호텔 나루 인천 숙박')).toBe('호텔 나루 인천 숙박');
  });
});

describe('openNaverHotelSearch', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('성공 시 Linking.openURL이 호출된다', async () => {
    const openSpy = vi.spyOn(Linking, 'openURL').mockResolvedValue(true as unknown as void);
    await openNaverHotelSearch({ name: '호텔 나루', queryOverride: null });
    expect(openSpy).toHaveBeenCalledTimes(1);
    const calledUrl = openSpy.mock.calls[0][0];
    expect(calledUrl).toContain('m.search.naver.com');
    expect(calledUrl).toContain(encodeURIComponent('호텔 나루 숙박'));
  });

  it('Linking 실패 시 Alert.alert가 호출된다', async () => {
    vi.spyOn(Linking, 'openURL').mockRejectedValue(new Error('cannot open'));
    const alertSpy = vi.spyOn(Alert, 'alert').mockImplementation(() => {});
    await openNaverHotelSearch({ name: '호텔 나루', queryOverride: null });
    expect(alertSpy).toHaveBeenCalledTimes(1);
    expect(alertSpy.mock.calls[0][0]).toContain('예약');
  });

  it('클립보드 모듈이 없어도 Alert는 호출된다', async () => {
    vi.spyOn(Linking, 'openURL').mockRejectedValue(new Error('cannot open'));
    const alertSpy = vi.spyOn(Alert, 'alert').mockImplementation(() => {});
    await openNaverHotelSearch({ name: '호텔 나루', queryOverride: null });
    expect(alertSpy).toHaveBeenCalledTimes(1);
  });
});
