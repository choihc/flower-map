import { fetchWithRetry } from './fetchWithRetry';

export interface ShortForecastResult {
  tempC: number | null;
  precipitationMm: number | null;
}

interface KmaForecastItem {
  category: string;
  fcstValue: string;
}

interface KmaForecastResponse {
  response?: {
    body?: {
      items?: {
        item?: KmaForecastItem[];
      };
    };
  };
}

const KMA_ENDPOINT =
  'https://apis.data.go.kr/1360000/VilageFcstInfoService_2.0/getVilageFcst';

function formatBaseDate(date: Date): string {
  const year = date.getFullYear().toString().padStart(4, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  return `${year}${month}${day}`;
}

function parsePrecipitation(fcstValue: string): number | null {
  const trimmed = fcstValue.trim();
  if (trimmed === '' || trimmed === '강수없음') {
    return 0;
  }

  const parsed = Number.parseFloat(trimmed);
  if (Number.isNaN(parsed)) {
    return null;
  }
  return parsed;
}

function parseTemperature(fcstValue: string): number | null {
  const parsed = Number.parseFloat(fcstValue);
  return Number.isNaN(parsed) ? null : parsed;
}

export async function fetchShortForecast(args: {
  nx: number;
  ny: number;
  serviceKey: string;
  now?: Date;
}): Promise<ShortForecastResult> {
  const { nx, ny, serviceKey, now = new Date() } = args;

  const params = new URLSearchParams({
    serviceKey,
    pageNo: '1',
    numOfRows: '100',
    dataType: 'JSON',
    base_date: formatBaseDate(now),
    base_time: '0500',
    nx: nx.toString(),
    ny: ny.toString(),
  });

  const url = `${KMA_ENDPOINT}?${params.toString()}`;
  const response = await fetchWithRetry(url);

  if (!response.ok) {
    throw new Error(
      `KMA short forecast request failed with status ${response.status}`,
    );
  }

  const payload = (await response.json()) as KmaForecastResponse;
  const items = payload.response?.body?.items?.item ?? [];

  if (items.length === 0) {
    return { tempC: null, precipitationMm: null };
  }

  let tempC: number | null = null;
  let precipitationMm: number | null = null;

  for (const item of items) {
    if (item.category === 'TMP' && tempC === null) {
      tempC = parseTemperature(item.fcstValue);
    } else if (item.category === 'PCP' && precipitationMm === null) {
      precipitationMm = parsePrecipitation(item.fcstValue);
    }
  }

  return { tempC, precipitationMm };
}
