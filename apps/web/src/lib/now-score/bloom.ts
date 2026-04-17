export interface BloomInput {
  now: Date;
  startAt: Date;
  endAt: Date;
  recentTempC: number | null;
  recent7dRainMm: number;
}

const DAY = 86400000;

export function calcBloomScore(input: BloomInput): number {
  const { now, startAt, endAt, recent7dRainMm } = input;
  const t = now.getTime();
  const start = startAt.getTime();
  const end = endAt.getTime();
  const mid = (start + end) / 2;

  let base = 0;
  if (t < start - 30 * DAY) {
    base = 0;
  } else if (t < start) {
    base = 30 * (1 - (start - t) / (30 * DAY));
  } else if (t < mid) {
    base = 30 + 70 * ((t - start) / (mid - start));
  } else if (t < end) {
    base = 100 - 70 * ((t - mid) / (end - mid));
  } else if (t < end + 14 * DAY) {
    base = 30 * (1 - (t - end) / (14 * DAY));
  }

  if (recent7dRainMm > 80) base *= 0.9;

  return Math.max(0, Math.min(100, Math.round(base * 100) / 100));
}
