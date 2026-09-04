import { describe, expect, it } from 'vitest';

import {
  averageNewest,
  averageOldest,
  weekAlignedTrendWindow,
} from './trendWindow';

const P = (ratio: number) => ({ period: 'x', ratio });

describe('averageNewest', () => {
  it('마지막 2개 포인트를 평균한다', () => {
    // 1년 주단위 응답에서 최근 2주를 뽑는다. 마지막 한 주는 진행 중일 수
    // 있어 값이 낮게 나오므로 2개를 평균해 완화한다.
    expect(averageNewest([P(10), P(20), P(30), P(40)])).toBe(35);
  });

  it('포인트가 2개면 둘을 평균한다', () => {
    expect(averageNewest([P(10), P(20)])).toBe(15);
  });

  it('포인트가 1개면 그 값을 쓴다', () => {
    expect(averageNewest([P(42)])).toBe(42);
  });

  it('포인트가 없으면 null', () => {
    expect(averageNewest([])).toBeNull();
  });

  it('개수를 지정할 수 있다', () => {
    expect(averageNewest([P(10), P(20), P(30)], 3)).toBe(20);
  });
});

describe('averageOldest', () => {
  it('처음 2개 포인트를 평균한다', () => {
    // 1년 창의 앞부분이 작년 동기다. 첫 주가 부분 주일 수 있어 2개를 평균한다.
    expect(averageOldest([P(10), P(20), P(30), P(40)])).toBe(15);
  });

  it('포인트가 1개면 그 값을 쓴다', () => {
    expect(averageOldest([P(42)])).toBe(42);
  });

  it('포인트가 없으면 null', () => {
    expect(averageOldest([])).toBeNull();
  });
});

describe('weekAlignedTrendWindow', () => {
  it('종료일을 직전 일요일로 맞춘다 (부분 주를 배제)', () => {
    // 데이터랩 주단위 버킷은 월요일에 시작한다. 창 끝이 주 중간이면
    // 마지막 버킷이 부분 주가 되어 값이 낮게 나오고, cron이 도는 요일에
    // 따라 점수가 달라진다.
    const now = new Date('2026-09-04T00:00:00Z'); // 금요일
    expect(weekAlignedTrendWindow(now).endDate).toBe('2026-08-30'); // 일요일
  });

  it('오늘이 월요일이면 바로 전날 일요일이 종료일', () => {
    const now = new Date('2026-08-31T00:00:00Z'); // 월요일
    expect(weekAlignedTrendWindow(now).endDate).toBe('2026-08-30');
  });

  it('오늘이 일요일이면 그 주는 아직 끝나지 않았으므로 한 주 전 일요일', () => {
    const now = new Date('2026-08-30T00:00:00Z'); // 일요일
    expect(weekAlignedTrendWindow(now).endDate).toBe('2026-08-23');
  });

  it('시작일은 월요일이며 54주 구간을 만든다', () => {
    // 54주여야 최신 2개 버킷과 최초 2개 버킷이 정확히 364일(=52주) 차이가
    // 나서 yoy 비교의 달력 위치가 맞는다.
    const w = weekAlignedTrendWindow(new Date('2026-09-04T00:00:00Z'));
    expect(w.startDate).toBe('2025-08-18'); // 월요일
    const days =
      (Date.parse(w.endDate) - Date.parse(w.startDate)) / 86400000 + 1;
    expect(days).toBe(54 * 7);
  });
});
