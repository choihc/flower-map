export interface YouTubeVideo {
  videoId: string;
  title: string;
  description: string;
  channelTitle: string;
  channelId: string;
  thumbnailUrl: string;
  publishedAt: Date;
}

interface YouTubeSearchItem {
  id?: { videoId?: string };
  snippet?: {
    publishedAt?: string;
    channelId?: string;
    channelTitle?: string;
    title?: string;
    description?: string;
    thumbnails?: {
      default?: { url?: string };
      medium?: { url?: string };
      high?: { url?: string };
    };
  };
}

interface YouTubeSearchResponse {
  items?: YouTubeSearchItem[];
}

interface YouTubeVideoStatsItem {
  id?: string;
  statistics?: { viewCount?: string };
}

interface YouTubeVideoStatsResponse {
  items?: YouTubeVideoStatsItem[];
}

const SEARCH_ENDPOINT = 'https://www.googleapis.com/youtube/v3/search';
const VIDEOS_ENDPOINT = 'https://www.googleapis.com/youtube/v3/videos';
const MAX_VIDEO_IDS_PER_REQUEST = 50;

function pickThumbnailUrl(item: YouTubeSearchItem): string {
  const thumbnails = item.snippet?.thumbnails;
  return (
    thumbnails?.medium?.url ??
    thumbnails?.high?.url ??
    thumbnails?.default?.url ??
    ''
  );
}

export async function searchYouTube(args: {
  apiKey: string;
  query: string;
  publishedAfter: Date;
  maxResults?: number;
}): Promise<YouTubeVideo[]> {
  const { apiKey, query, publishedAfter, maxResults = 20 } = args;

  const params = new URLSearchParams({
    part: 'snippet',
    type: 'video',
    order: 'relevance',
    regionCode: 'KR',
    relevanceLanguage: 'ko',
    videoDuration: 'medium',
    q: query,
    publishedAfter: publishedAfter.toISOString(),
    maxResults: maxResults.toString(),
    key: apiKey,
  });

  const response = await fetch(`${SEARCH_ENDPOINT}?${params.toString()}`);

  if (!response.ok) {
    throw new Error(
      `YouTube search request failed with status ${response.status}`,
    );
  }

  const payload = (await response.json()) as YouTubeSearchResponse;
  const items = payload.items ?? [];

  const videos: YouTubeVideo[] = [];
  for (const item of items) {
    const videoId = item.id?.videoId;
    if (!videoId) {
      continue;
    }
    const snippet = item.snippet ?? {};
    if (!snippet.publishedAt) {
      continue;
    }
    videos.push({
      videoId,
      title: snippet.title ?? '',
      description: snippet.description ?? '',
      channelTitle: snippet.channelTitle ?? '',
      channelId: snippet.channelId ?? '',
      thumbnailUrl: pickThumbnailUrl(item),
      publishedAt: new Date(snippet.publishedAt),
    });
  }

  return videos;
}

export async function getVideoStats(args: {
  apiKey: string;
  videoIds: string[];
}): Promise<Map<string, number>> {
  const { apiKey, videoIds } = args;

  if (videoIds.length > MAX_VIDEO_IDS_PER_REQUEST) {
    throw new Error(
      `YouTube video stats는 한 번에 최대 ${MAX_VIDEO_IDS_PER_REQUEST}개의 videoId만 조회할 수 있습니다.`,
    );
  }

  const result = new Map<string, number>();
  if (videoIds.length === 0) {
    return result;
  }

  const params = new URLSearchParams({
    part: 'statistics',
    id: videoIds.join(','),
    key: apiKey,
  });

  const response = await fetch(`${VIDEOS_ENDPOINT}?${params.toString()}`);

  if (!response.ok) {
    throw new Error(
      `YouTube video stats request failed with status ${response.status}`,
    );
  }

  const payload = (await response.json()) as YouTubeVideoStatsResponse;
  const items = payload.items ?? [];

  const responseMap = new Map<string, number>();
  for (const item of items) {
    if (!item.id) {
      continue;
    }
    const raw = item.statistics?.viewCount;
    const parsed = raw !== undefined ? Number.parseInt(raw, 10) : Number.NaN;
    responseMap.set(item.id, Number.isFinite(parsed) ? parsed : 0);
  }

  for (const id of videoIds) {
    result.set(id, responseMap.get(id) ?? 0);
  }

  return result;
}
