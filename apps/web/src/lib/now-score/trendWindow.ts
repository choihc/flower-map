import type { TrendDataPoint } from '../external/naverDatalab';

function average(points: readonly TrendDataPoint[]): number | null {
  if (points.length === 0) return null;
  const sum = points.reduce((acc, p) => acc + p.ratio, 0);
  return sum / points.length;
}

/**
 * 최신 `count`개 포인트의 평균.
 *
 * 1년 주단위 응답에서 "현재 검색량이 연중 최고 대비 어디쯤인가"를 뽑는 데 쓴다.
 * 마지막 한 주는 아직 진행 중일 수 있어 값이 낮게 나오므로 2개를 평균해 완화한다.
 */
export function averageNewest(
  data: readonly TrendDataPoint[],
  count = 2,
): number | null {
  return average(data.slice(-count));
}

/**
 * 가장 오래된 `count`개 포인트의 평균.
 *
 * 1년 창의 앞부분이 작년 동기이므로 yoy 비교의 기준값이 된다.
 * 첫 주가 부분 주일 수 있어 2개를 평균한다.
 */
export function averageOldest(
  data: readonly TrendDataPoint[],
  count = 2,
): number | null {
  return average(data.slice(0, count));
}

export interface TrendWindow {
  startDate: string;
  endDate: string;
}

/**
 * 54주여야 최신 2개 버킷과 최초 2개 버킷이 정확히 364일(=52주) 차이가 난다.
 * 그래야 yoy가 "작년 같은 주"와 비교된다. 52주나 53주면 한두 주 어긋난다.
 */
const TREND_WINDOW_WEEKS = 54;
const DAY_MS = 86400000;

function formatUtcDate(date: Date): string {
  const y = date.getUTCFullYear().toString().padStart(4, '0');
  const m = (date.getUTCMonth() + 1).toString().padStart(2, '0');
  const d = date.getUTCDate().toString().padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * 데이터랩 주단위 조회 구간을 주 경계(월요일 시작 · 일요일 종료)에 맞춘다.
 *
 * 주 경계에 맞추지 않으면 양 끝 버킷이 부분 주가 되어 값이 낮게 나오고,
 * cron이 도는 요일에 따라 같은 명소의 점수가 달라진다.
 */
export function weekAlignedTrendWindow(now: Date): TrendWindow {
  // 진행 중인 주를 배제하고 직전 일요일을 종료일로 삼는다.
  // getUTCDay(): 일=0 … 토=6. 일요일이면 그 주가 아직 끝나지 않았으므로 7일 전.
  const day = now.getUTCDay();
  const end = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()) -
      (day === 0 ? 7 : day) * DAY_MS,
  );
  const start = new Date(end.getTime() - (TREND_WINDOW_WEEKS * 7 - 1) * DAY_MS);

  return { startDate: formatUtcDate(start), endDate: formatUtcDate(end) };
}
