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
