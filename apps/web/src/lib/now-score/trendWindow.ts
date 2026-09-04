import type { TrendDataPoint } from '../external/naverDatalab';

export interface TrendWindow {
  startDate: string;
  endDate: string;
}

/**
 * 54주여야 최신 주와 가장 오래된 주가 정확히 364일(=52주) 차이가 난다.
 * 그래야 yoy가 "작년 같은 주"와 비교된다. 52주나 53주면 한두 주 어긋난다.
 */
const TREND_WINDOW_WEEKS = 54;
const DAY_MS = 86400000;
/**
 * 데이터랩은 한국 서비스라 버킷 경계가 한국 시간 달력이다. cron은 18:00 UTC
 * (= KST 03:00)에 도므로 UTC 요일로 판정하면 하루 밀려, 창이 전진하는 요일이
 * cron 스케줄에 따라 달라진다. KST는 서머타임이 없어 고정 +9h 시프트로 맞춘다.
 */
const KST_OFFSET_MS = 9 * 60 * 60 * 1000;
/**
 * 데이터랩 일 단위 게시 지연은 실측 1일이다. 주간 버킷 값은 게시된 일수에
 * 비례하는 합계라서, 주가 끝난 직후에 그 주를 요청하면 값이 깎인다.
 * (실측: 3.7일치만 게시된 주는 직전 온전한 주의 0.535배)
 * 하루의 여유를 더해 이틀로 둔다.
 */
const PUBLISH_LAG_DAYS = 2;

function formatUtcDate(date: Date): string {
  const y = date.getUTCFullYear().toString().padStart(4, '0');
  const m = (date.getUTCMonth() + 1).toString().padStart(2, '0');
  const d = date.getUTCDate().toString().padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function assertPositiveCount(count: number): void {
  if (!Number.isInteger(count) || count < 1) {
    throw new Error(`주 개수는 1 이상의 정수여야 합니다: ${count}`);
  }
}

/**
 * 데이터랩 주단위 조회 구간을 주 경계(월요일 시작 · 일요일 종료)에 맞춘다.
 *
 * 종료일은 게시 지연을 감안한 직전 일요일이다. 진행 중인 주는 물론이고,
 * 끝난 지 이틀이 안 된 주도 아직 다 게시되지 않았을 수 있어 배제한다.
 * 판정은 한국 시간 달력 기준이며, 반환하는 날짜도 한국 시간 날짜다.
 */
export function weekAlignedTrendWindow(now: Date): TrendWindow {
  // +9h 밀어두면 이후 UTC 게터로 읽을 때 한국 시간 달력이 나온다.
  const kst = new Date(now.getTime() + KST_OFFSET_MS);
  const base =
    Date.UTC(kst.getUTCFullYear(), kst.getUTCMonth(), kst.getUTCDate()) -
    PUBLISH_LAG_DAYS * DAY_MS;
  // getUTCDay(): 일=0 … 토=6. base 이하의 가장 가까운 일요일까지 되돌린다.
  const end = new Date(base - new Date(base).getUTCDay() * DAY_MS);
  const start = new Date(end.getTime() - (TREND_WINDOW_WEEKS * 7 - 1) * DAY_MS);

  return { startDate: formatUtcDate(start), endDate: formatUtcDate(end) };
}

/**
 * 창의 최신 `count`개 주의 시작일(월요일)을 최신순으로 돌려준다.
 *
 * 데이터랩 주간 버킷의 `period`는 그 주의 월요일이다. 창의 종료일은
 * 일요일이므로 마지막 버킷의 월요일은 6일 앞이다.
 */
export function newestWeekStarts(
  window: TrendWindow,
  count: number,
): string[] {
  assertPositiveCount(count);
  const lastMonday = Date.parse(window.endDate) - 6 * DAY_MS;
  return Array.from({ length: count }, (_, i) =>
    formatUtcDate(new Date(lastMonday - i * 7 * DAY_MS)),
  );
}

/** 창의 가장 오래된 `count`개 주의 시작일(월요일)을 오래된 순으로 돌려준다. */
export function oldestWeekStarts(
  window: TrendWindow,
  count: number,
): string[] {
  assertPositiveCount(count);
  const firstMonday = Date.parse(window.startDate);
  return Array.from({ length: count }, (_, i) =>
    formatUtcDate(new Date(firstMonday + i * 7 * DAY_MS)),
  );
}

/**
 * 지정한 주들의 검색량 비율 평균.
 *
 * 배열 위치가 아니라 `period`(주 시작일)로 값을 집는다. 데이터랩은 검색량이
 * 기준 미달인 주를 **버킷째로 생략**하므로, 위치로 뽑으면 희소한 키워드에서
 * 엉뚱한 달력 위치를 최신값으로 집는다. (실측: '여좌천 벚꽃'은 54주 창에서
 * 3~4월 5개 버킷만 돌아와, 9월에 지난 봄 피크가 최신값으로 잡혔다.)
 *
 * 생략된 주는 "값을 모른다"가 아니라 "검색량이 사실상 0"이라는 뜻이므로 0으로
 * 본다. 다만 창 전체가 비었으면 키워드 자체를 판단할 근거가 없어 `null`이다.
 *
 * 여러 주를 평균하는 이유는 주 단위 변동을 완화(스무딩)하는 것 하나다.
 * 대신 개화 급상승 구간에서 신호가 그만큼(2주면 약 1주) 늦게 반영된다.
 */
export function averageAtWeeks(
  data: readonly TrendDataPoint[],
  weekStarts: readonly string[],
): number | null {
  if (data.length === 0 || weekStarts.length === 0) return null;
  const byPeriod = new Map(data.map((p) => [p.period, p.ratio]));
  const sum = weekStarts.reduce((acc, k) => acc + (byPeriod.get(k) ?? 0), 0);
  return sum / weekStarts.length;
}
