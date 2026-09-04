import { describe, expect, it } from 'vitest';

import {
  averageAtWeeks,
  newestWeekStarts,
  oldestWeekStarts,
  weekAlignedTrendWindow,
} from './trendWindow';

const WINDOW = { startDate: '2025-08-18', endDate: '2026-08-30' };

const dayDiff = (a: string, b: string) =>
  (Date.parse(a) - Date.parse(b)) / 86400000;

describe('newestWeekStarts', () => {
  it('종료일이 속한 주의 월요일부터 거꾸로 센다', () => {
    // 창의 종료일은 일요일이므로 그 주의 월요일은 6일 앞이다.
    expect(newestWeekStarts(WINDOW, 2)).toEqual(['2026-08-24', '2026-08-17']);
  });

  it('개수를 지정할 수 있다', () => {
    expect(newestWeekStarts(WINDOW, 3)).toEqual([
      '2026-08-24',
      '2026-08-17',
      '2026-08-10',
    ]);
  });

  it('개수가 1 미만이면 거부한다', () => {
    // slice 기반 구현에서 count=0이 배열 전체를 뜻하게 되던 함정을 막는다.
    expect(() => newestWeekStarts(WINDOW, 0)).toThrow();
    expect(() => newestWeekStarts(WINDOW, -1)).toThrow();
  });
});

describe('oldestWeekStarts', () => {
  it('시작일부터 앞으로 센다', () => {
    expect(oldestWeekStarts(WINDOW, 2)).toEqual(['2025-08-18', '2025-08-25']);
  });

  it('개수가 1 미만이면 거부한다', () => {
    expect(() => oldestWeekStarts(WINDOW, 0)).toThrow();
  });
});

describe('최신 주와 가장 오래된 주의 달력 정렬', () => {
  it('대응하는 주끼리 정확히 364일(=52주) 떨어져 있다', () => {
    // yoy가 "작년 같은 주"와 비교되려면 이 간격이 52주여야 한다.
    const newest = newestWeekStarts(WINDOW, 2);
    const oldest = oldestWeekStarts(WINDOW, 2);
    expect(dayDiff(newest[1], oldest[0])).toBe(364);
    expect(dayDiff(newest[0], oldest[1])).toBe(364);
  });
});

describe('averageAtWeeks', () => {
  it('지정한 주의 값만 평균한다', () => {
    const data = [
      { period: '2026-08-17', ratio: 10 },
      { period: '2026-08-24', ratio: 20 },
    ];
    expect(averageAtWeeks(data, ['2026-08-24', '2026-08-17'])).toBe(15);
  });

  it('응답에 없는 주는 검색량 0으로 본다', () => {
    // 데이터랩은 검색량이 기준 미달인 주를 버킷째로 생략한다.
    // 생략은 "값을 모른다"가 아니라 "검색량이 사실상 0"이라는 뜻이다.
    const data = [{ period: '2026-08-24', ratio: 20 }];
    expect(averageAtWeeks(data, ['2026-08-24', '2026-08-17'])).toBe(10);
  });

  it('창 전체에 데이터가 없으면 null로 판단을 보류한다', () => {
    expect(averageAtWeeks([], ['2026-08-24', '2026-08-17'])).toBeNull();
  });

  it('개화기에만 데이터가 있는 희소 응답은 비수기에 0을 낸다', () => {
    // 실측: '여좌천 벚꽃'은 54주 창에서 3~4월 5개 버킷만 돌아왔다.
    // 배열 위치로 뽑으면 2026년 9월에 지난 봄 피크(62.3/5.06)를 최신값으로
    // 집어 trend 33.68, yoy 100이 되어 없애려던 역신호가 되살아난다.
    const sparse = [
      { period: '2026-03-09', ratio: 6.46 },
      { period: '2026-03-16', ratio: 15.01 },
      { period: '2026-03-23', ratio: 100 },
      { period: '2026-03-30', ratio: 62.3 },
      { period: '2026-04-06', ratio: 5.06 },
    ];
    expect(averageAtWeeks(sparse, newestWeekStarts(WINDOW, 2))).toBe(0);
    expect(averageAtWeeks(sparse, oldestWeekStarts(WINDOW, 2))).toBe(0);
  });

  it('중간에 구멍이 뚫린 응답도 달력 위치를 유지한다', () => {
    // 실측: '정선 민둥산 억새'는 2025-11-17 다음이 2026-08-10으로 건너뛴다.
    const holed = [
      { period: '2025-08-18', ratio: 30 },
      { period: '2025-11-17', ratio: 100 },
      { period: '2026-08-24', ratio: 12 },
    ];
    expect(averageAtWeeks(holed, newestWeekStarts(WINDOW, 2))).toBe(6);
    expect(averageAtWeeks(holed, oldestWeekStarts(WINDOW, 2))).toBe(15);
  });
});

describe('weekAlignedTrendWindow', () => {
  it('종료일은 게시 지연을 감안한 직전 일요일이다', () => {
    const now = new Date('2026-09-04T00:00:00Z'); // KST 금요일
    expect(weekAlignedTrendWindow(now).endDate).toBe('2026-08-30');
  });

  it('주가 끝난 다음 날에는 그 주를 아직 쓰지 않는다', () => {
    // 데이터랩 일 단위 게시 지연은 실측 1일이다. 주가 끝난 직후에 그 주를
    // 요청하면 마지막 버킷이 게시된 일수만큼만 집계되어 값이 깎인다.
    const kstMonday = new Date('2026-08-30T18:00:00Z'); // KST 08-31 03:00 월
    expect(weekAlignedTrendWindow(kstMonday).endDate).toBe('2026-08-23');
  });

  it('주가 끝난 뒤 이틀이 지나면 그 주를 쓴다', () => {
    const kstTuesday = new Date('2026-08-31T18:00:00Z'); // KST 09-01 03:00 화
    expect(weekAlignedTrendWindow(kstTuesday).endDate).toBe('2026-08-30');
  });

  it('요일·날짜를 한국 시간으로 판정한다', () => {
    // cron은 18:00 UTC(=KST 03:00)에 돈다. UTC 요일로 판정하면 하루 밀려
    // 창이 전진하는 요일이 스케줄에 따라 달라진다. 아래 두 시각은 UTC
    // 날짜가 서로 다르지만 한국 시간으로는 같은 화요일이라 창도 같아야 한다.
    const kstTuesdayEarly = new Date('2026-08-31T18:00:00Z'); // UTC 월요일
    const kstTuesdayLate = new Date('2026-09-01T09:00:00Z'); // UTC 화요일
    expect(weekAlignedTrendWindow(kstTuesdayEarly)).toEqual(
      weekAlignedTrendWindow(kstTuesdayLate),
    );
  });

  it('진행 중인 주는 종료일이 될 수 없다', () => {
    const kstSunday = new Date('2026-08-30T00:00:00Z'); // KST 일요일
    expect(weekAlignedTrendWindow(kstSunday).endDate).toBe('2026-08-23');
  });

  const BOUNDARY_CASES = [
    '2024-02-26T00:00:00Z', // 윤년 2월
    '2024-02-29T00:00:00Z', // 윤일
    '2024-12-30T00:00:00Z', // 연말
    '2025-01-01T00:00:00Z', // 연초
    '2026-09-04T00:00:00Z',
    '2026-12-31T15:00:00Z', // KST로 해가 바뀌는 시각
    '2100-03-01T00:00:00Z', // 세기 비윤년
  ];

  it.each(BOUNDARY_CASES)(
    '%s: 시작=월요일, 종료=일요일, 구간=54주 불변식을 지킨다',
    (iso) => {
      const w = weekAlignedTrendWindow(new Date(iso));
      expect(new Date(`${w.startDate}T00:00:00Z`).getUTCDay()).toBe(1);
      expect(new Date(`${w.endDate}T00:00:00Z`).getUTCDay()).toBe(0);
      expect(dayDiff(w.endDate, w.startDate) + 1).toBe(54 * 7);
      // 최신 주와 가장 오래된 주가 항상 달력상 같은 주에 대응한다.
      expect(
        dayDiff(newestWeekStarts(w, 1)[0], oldestWeekStarts(w, 1)[0]),
      ).toBe(371);
    },
  );
});
