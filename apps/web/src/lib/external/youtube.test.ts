import { afterEach, describe, expect, it, vi } from 'vitest';

import { getVideoStats, searchYouTube } from './youtube';

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('searchYouTube', () => {
  it('search 응답을 YouTubeVideo 배열로 매핑한다', async () => {
    const publishedIso = '2026-04-10T05:30:00Z';
    const payload = {
      kind: 'youtube#searchListResponse',
      items: [
        {
          id: { kind: 'youtube#video', videoId: 'abc123' },
          snippet: {
            publishedAt: publishedIso,
            channelId: 'ch1',
            channelTitle: '꽃채널',
            title: '벚꽃 명소 10선',
            description: '올해 가볼 만한 벚꽃 명소',
            thumbnails: {
              default: { url: 'https://img.example/default.jpg' },
              medium: { url: 'https://img.example/medium.jpg' },
              high: { url: 'https://img.example/high.jpg' },
            },
          },
        },
      ],
    };

    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => payload,
    });
    vi.stubGlobal('fetch', fetchMock);

    const publishedAfter = new Date('2026-04-01T00:00:00Z');
    const result = await searchYouTube({
      apiKey: 'YT_KEY',
      query: '벚꽃 명소',
      publishedAfter,
      maxResults: 20,
    });

    expect(result).toEqual([
      {
        videoId: 'abc123',
        title: '벚꽃 명소 10선',
        description: '올해 가볼 만한 벚꽃 명소',
        channelTitle: '꽃채널',
        channelId: 'ch1',
        thumbnailUrl: 'https://img.example/medium.jpg',
        publishedAt: new Date(publishedIso),
      },
    ]);

    const [calledUrl] = fetchMock.mock.calls[0] as [string];
    expect(calledUrl).toContain('https://www.googleapis.com/youtube/v3/search');
    expect(calledUrl).toContain('part=snippet');
    expect(calledUrl).toContain('type=video');
    expect(calledUrl).toContain('order=relevance');
    expect(calledUrl).toContain('regionCode=KR');
    expect(calledUrl).toContain('relevanceLanguage=ko');
    expect(calledUrl).toContain('videoDuration=medium');
    expect(calledUrl).toContain('maxResults=20');
    expect(calledUrl).toContain('key=YT_KEY');
    expect(calledUrl).toContain(
      `publishedAfter=${encodeURIComponent(publishedAfter.toISOString())}`,
    );
  });

  it('4xx 응답이 오면 예외를 throw 한다', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 403,
        statusText: 'Forbidden',
        text: async () => 'forbidden',
      }),
    );

    await expect(
      searchYouTube({
        apiKey: 'YT_KEY',
        query: '벚꽃',
        publishedAfter: new Date('2026-04-01T00:00:00Z'),
      }),
    ).rejects.toThrow(/YouTube/);
  });
});

describe('getVideoStats', () => {
  it('videoIds에 대한 viewCount Map을 반환한다', async () => {
    const payload = {
      items: [
        { id: 'abc123', statistics: { viewCount: '12345' } },
        { id: 'def456', statistics: { viewCount: '7' } },
      ],
    };

    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => payload,
    });
    vi.stubGlobal('fetch', fetchMock);

    const result = await getVideoStats({
      apiKey: 'YT_KEY',
      videoIds: ['abc123', 'def456'],
    });

    expect(result).toBeInstanceOf(Map);
    expect(result.get('abc123')).toBe(12345);
    expect(result.get('def456')).toBe(7);

    const [calledUrl] = fetchMock.mock.calls[0] as [string];
    expect(calledUrl).toContain(
      'https://www.googleapis.com/youtube/v3/videos',
    );
    expect(calledUrl).toContain('part=statistics');
    expect(calledUrl).toContain('id=abc123%2Cdef456');
    expect(calledUrl).toContain('key=YT_KEY');
  });

  it('viewCount가 누락되거나 숫자가 아니면 0으로 처리한다', async () => {
    const payload = {
      items: [
        { id: 'a', statistics: {} },
        { id: 'b', statistics: { viewCount: 'not-a-number' } },
        { id: 'c' },
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

    const result = await getVideoStats({
      apiKey: 'YT_KEY',
      videoIds: ['a', 'b', 'c'],
    });

    expect(result.get('a')).toBe(0);
    expect(result.get('b')).toBe(0);
    expect(result.get('c')).toBe(0);
  });

  it('videoIds 길이가 50을 초과하면 사전 검증에서 throw 한다', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    const tooMany = Array.from({ length: 51 }, (_, i) => `v${i}`);

    await expect(
      getVideoStats({ apiKey: 'YT_KEY', videoIds: tooMany }),
    ).rejects.toThrow(/최대 50/);

    expect(fetchMock).not.toHaveBeenCalled();
  });
});
