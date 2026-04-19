import { fetchWithRetry } from './fetchWithRetry';

export interface TrendGroup {
  groupName: string;
  keywords: string[];
}

export interface TrendDataPoint {
  period: string;
  ratio: number;
}

export interface TrendResult {
  groupName: string;
  data: TrendDataPoint[];
}

interface DatalabApiResponseResult {
  title: string;
  keywords: string[];
  data: TrendDataPoint[];
}

interface DatalabApiResponse {
  results?: DatalabApiResponseResult[];
}

const DATALAB_ENDPOINT = 'https://openapi.naver.com/v1/datalab/search';
const MAX_GROUPS = 5;

export async function fetchSearchTrends(args: {
  clientId: string;
  clientSecret: string;
  startDate: string;
  endDate: string;
  groups: TrendGroup[];
}): Promise<TrendResult[]> {
  const { clientId, clientSecret, startDate, endDate, groups } = args;

  if (groups.length > MAX_GROUPS) {
    throw new Error(
      `Naver Datalab keyword groups는 최대 ${MAX_GROUPS}개까지 전달할 수 있습니다.`,
    );
  }

  const response = await fetchWithRetry(
    DATALAB_ENDPOINT,
    {
      method: 'POST',
      headers: {
        'X-Naver-Client-Id': clientId,
        'X-Naver-Client-Secret': clientSecret,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        startDate,
        endDate,
        timeUnit: 'date',
        keywordGroups: groups,
      }),
    },
    // Datalab은 캐시 미스/네이버 측 throttle 시 지연이 크므로 넉넉한 타임아웃 사용.
    { timeoutMs: 45_000 },
  );

  if (!response.ok) {
    throw new Error(
      `Naver Datalab request failed with status ${response.status}`,
    );
  }

  const payload = (await response.json()) as DatalabApiResponse;
  const results = payload.results ?? [];

  return results.map((entry) => ({
    groupName: entry.title,
    data: entry.data ?? [],
  }));
}
