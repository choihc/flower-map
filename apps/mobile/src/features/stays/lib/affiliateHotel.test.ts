import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { Alert, Linking } from 'react-native';

import {
  buildAgodaHotelSearchUrl,
  openAgodaHotelSearch,
  resolveBookingQuery,
} from './affiliateHotel';

describe('resolveBookingQuery', () => {
  it('override가 null이면 호텔명을 그대로 반환한다', () => {
    expect(resolveBookingQuery('호텔 나루', null)).toBe('호텔 나루');
  });

  it('override가 공백만 있으면 호텔명으로 폴백한다', () => {
    expect(resolveBookingQuery('호텔 나루', '   ')).toBe('호텔 나루');
  });

  it('override가 빈 문자열이면 호텔명으로 폴백한다', () => {
    expect(resolveBookingQuery('호텔 나루', '')).toBe('호텔 나루');
  });

  it('override가 유효하면 그대로 사용한다', () => {
    expect(resolveBookingQuery('호텔 나루', '호텔 나루 인천')).toBe('호텔 나루 인천');
  });
});

describe('buildAgodaHotelSearchUrl', () => {
  const originalCid = process.env.EXPO_PUBLIC_AGODA_CID;

  afterEach(() => {
    process.env.EXPO_PUBLIC_AGODA_CID = originalCid;
  });

  it('Agoda partnersearch 도메인 + hl=ko-kr + hname 파라미터를 포함한다', () => {
    process.env.EXPO_PUBLIC_AGODA_CID = '';
    const url = buildAgodaHotelSearchUrl('호텔 나루');
    expect(url.startsWith('https://www.agoda.com/partners/partnersearch.aspx')).toBe(true);
    expect(url).toContain('hl=ko-kr');
    expect(url).toContain(`hname=${encodeURIComponent('호텔 나루')}`);
  });

  it('cid 환경변수가 설정되어 있으면 URL에 포함한다', () => {
    process.env.EXPO_PUBLIC_AGODA_CID = '1234567';
    const url = buildAgodaHotelSearchUrl('호텔 나루');
    expect(url).toContain('cid=1234567');
  });

  it('cid 환경변수가 비어있으면 cid 파라미터를 포함하지 않는다', () => {
    process.env.EXPO_PUBLIC_AGODA_CID = '';
    const url = buildAgodaHotelSearchUrl('호텔 나루');
    expect(url).not.toContain('cid=');
  });

  it('cid가 공백으로만 채워져 있으면 cid 파라미터를 포함하지 않는다', () => {
    process.env.EXPO_PUBLIC_AGODA_CID = '   ';
    const url = buildAgodaHotelSearchUrl('호텔 나루');
    expect(url).not.toContain('cid=');
  });

  it('한글 호텔명은 percent-encoded 된다', () => {
    process.env.EXPO_PUBLIC_AGODA_CID = '';
    const url = buildAgodaHotelSearchUrl('호텔 나루');
    expect(url).toContain(encodeURIComponent('호텔 나루'));
    expect(url).not.toContain('호텔');
  });
});

describe('openAgodaHotelSearch', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('성공 시 Linking.openURL이 Agoda URL로 호출된다', async () => {
    const openSpy = vi.spyOn(Linking, 'openURL').mockResolvedValue(true as unknown as void);
    await openAgodaHotelSearch({ name: '호텔 나루', queryOverride: null });
    expect(openSpy).toHaveBeenCalledTimes(1);
    const calledUrl = openSpy.mock.calls[0][0];
    expect(calledUrl).toContain('agoda.com/partners/partnersearch.aspx');
    expect(calledUrl).toContain(encodeURIComponent('호텔 나루'));
  });

  it('Linking 실패 시 Alert.alert가 호출된다', async () => {
    vi.spyOn(Linking, 'openURL').mockRejectedValue(new Error('cannot open'));
    const alertSpy = vi.spyOn(Alert, 'alert').mockImplementation(() => {});
    await openAgodaHotelSearch({ name: '호텔 나루', queryOverride: null });
    expect(alertSpy).toHaveBeenCalledTimes(1);
    expect(alertSpy.mock.calls[0][0]).toContain('예약');
  });
});
