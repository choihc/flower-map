import { afterEach, describe, expect, it, vi } from 'vitest';

import { fetchShortForecast } from './kma';

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

function buildKmaResponse(
  items: Array<{ category: string; fcstValue: string }>,
) {
  return {
    response: {
      header: { resultCode: '00', resultMsg: 'NORMAL_SERVICE' },
      body: {
        dataType: 'JSON',
        items: { item: items },
        pageNo: 1,
        numOfRows: 100,
        totalCount: items.length,
      },
    },
  };
}

describe('fetchShortForecast', () => {
  it('정상 응답에서 기온(TMP)과 강수량(PCP)을 파싱해 반환한다', async () => {
    const payload = buildKmaResponse([
      { category: 'TMP', fcstValue: '17' },
      { category: 'PCP', fcstValue: '1.5' },
      { category: 'SKY', fcstValue: '1' },
    ]);

    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => payload,
    });
    vi.stubGlobal('fetch', fetchMock);

    const result = await fetchShortForecast({
      nx: 60,
      ny: 127,
      serviceKey: 'TEST_KEY',
    });

    expect(result).toEqual({ tempC: 17, precipitationMm: 1.5 });
    expect(fetchMock).toHaveBeenCalledTimes(1);

    const [calledUrl] = fetchMock.mock.calls[0] as [string, unknown];
    expect(calledUrl).toContain(
      'https://apis.data.go.kr/1360000/VilageFcstInfoService_2.0/getVilageFcst',
    );
    expect(calledUrl).toContain('serviceKey=TEST_KEY');
    expect(calledUrl).toContain('pageNo=1');
    expect(calledUrl).toContain('numOfRows=100');
    expect(calledUrl).toContain('dataType=JSON');
    expect(calledUrl).toContain('base_time=0500');
    expect(calledUrl).toContain('nx=60');
    expect(calledUrl).toContain('ny=127');
    expect(calledUrl).toMatch(/base_date=\d{8}/);
  });

  it('"강수없음" 문자열이 오면 precipitationMm을 0으로 반환한다', async () => {
    const payload = buildKmaResponse([
      { category: 'TMP', fcstValue: '12' },
      { category: 'PCP', fcstValue: '강수없음' },
    ]);

    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => payload,
      }),
    );

    const result = await fetchShortForecast({
      nx: 55,
      ny: 127,
      serviceKey: 'KEY',
    });

    expect(result).toEqual({ tempC: 12, precipitationMm: 0 });
  });

  it('5xx 응답이 오면 예외를 throw 한다', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        text: async () => 'error',
      }),
    );

    await expect(
      fetchShortForecast({ nx: 60, ny: 127, serviceKey: 'KEY' }),
    ).rejects.toThrow(/KMA/);
  });

  it('items가 비어있으면 null 값을 갖는 결과를 반환한다', async () => {
    const payload = buildKmaResponse([]);

    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => payload,
      }),
    );

    const result = await fetchShortForecast({
      nx: 60,
      ny: 127,
      serviceKey: 'KEY',
    });

    expect(result).toEqual({ tempC: null, precipitationMm: null });
  });
});
