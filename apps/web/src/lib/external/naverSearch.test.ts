import { afterEach, describe, expect, it, vi } from 'vitest';

import { searchBlogs } from './naverSearch';

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('searchBlogs', () => {
  it('title/description의 <b> 태그를 제거하고 결과를 매핑한다', async () => {
    const payload = {
      lastBuildDate: 'Fri, 17 Apr 2026 09:00:00 +0900',
      total: 1,
      start: 1,
      display: 1,
      items: [
        {
          title: '<b>벚꽃</b> 명소 추천',
          link: 'https://blog.naver.com/example/1',
          description:
            '이번 주말 <b>벚꽃</b> 보러 가기 좋은 곳 <b>베스트</b>',
          bloggername: '꽃여행러',
          bloggerlink: 'https://blog.naver.com/example',
          postdate: '20260414',
        },
      ],
    };

    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => payload,
    });
    vi.stubGlobal('fetch', fetchMock);

    const result = await searchBlogs({
      clientId: 'CID',
      clientSecret: 'CSECRET',
      query: '벚꽃',
      sort: 'date',
      display: 10,
    });

    expect(result).toHaveLength(1);
    expect(result[0].title).toBe('벚꽃 명소 추천');
    expect(result[0].description).toBe('이번 주말 벚꽃 보러 가기 좋은 곳 베스트');
    expect(result[0].bloggerName).toBe('꽃여행러');
    expect(result[0].link).toBe('https://blog.naver.com/example/1');

    const [calledUrl, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(calledUrl).toContain('https://openapi.naver.com/v1/search/blog.json');
    expect(calledUrl).toContain('query=%EB%B2%9A%EA%BD%83');
    expect(calledUrl).toContain('display=10');
    expect(calledUrl).toContain('sort=date');

    const headers = init.headers as Record<string, string>;
    expect(headers['X-Naver-Client-Id']).toBe('CID');
    expect(headers['X-Naver-Client-Secret']).toBe('CSECRET');
  });

  it('postdate(YYYYMMDD) 문자열을 UTC 자정 Date 객체로 변환한다', async () => {
    const payload = {
      items: [
        {
          title: 'x',
          link: 'https://example.com',
          description: 'x',
          bloggername: 'x',
          bloggerlink: 'https://example.com',
          postdate: '20260414',
        },
      ],
    };

    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => payload,
      }),
    );

    const result = await searchBlogs({
      clientId: 'CID',
      clientSecret: 'CSECRET',
      query: '벚꽃',
    });

    expect(result[0].postedAt).toBeInstanceOf(Date);
    expect(result[0].postedAt.toISOString()).toBe('2026-04-14T00:00:00.000Z');
  });

  it('items가 없으면 빈 배열을 반환한다', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ items: [] }),
      }),
    );

    const result = await searchBlogs({
      clientId: 'CID',
      clientSecret: 'CSECRET',
      query: '튤립',
    });

    expect(result).toEqual([]);
  });

  it('4xx 응답이 오면 예외를 throw 한다', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 400,
        statusText: 'Bad Request',
        text: async () => 'bad',
      }),
    );

    await expect(
      searchBlogs({ clientId: 'CID', clientSecret: 'CSECRET', query: '튤립' }),
    ).rejects.toThrow(/Naver blog/);
  });
});
