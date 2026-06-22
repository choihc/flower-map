import { describe, expect, it } from 'vitest';

import { boostFirst, isActiveBoost, kstToday } from './boost';

// ──────────────────────────────────────────────
// kstToday
// ──────────────────────────────────────────────
describe('kstToday', () => {
  it('KST UTC+9 기준 YYYY-MM-DD 문자열을 반환한다', () => {
    // UTC 2026-06-21 15:00 == KST 2026-06-22 00:00
    const utcDate = new Date('2026-06-21T15:00:00Z');
    expect(kstToday(utcDate)).toBe('2026-06-22');
  });

  it('UTC 자정 직전(23:59)은 KST 익일로 계산된다', () => {
    // UTC 2026-06-21 23:59 == KST 2026-06-22 08:59
    const utcDate = new Date('2026-06-21T23:59:00Z');
    expect(kstToday(utcDate)).toBe('2026-06-22');
  });

  it('UTC 자정 직후(00:01)이 KST 당일 오전으로 계산된다', () => {
    // UTC 2026-06-22 00:01 == KST 2026-06-22 09:01
    const utcDate = new Date('2026-06-22T00:01:00Z');
    expect(kstToday(utcDate)).toBe('2026-06-22');
  });
});

// ──────────────────────────────────────────────
// isActiveBoost
// ──────────────────────────────────────────────
describe('isActiveBoost', () => {
  const flower = (start: string | null, end: string | null) => ({
    boost_start_at: start,
    boost_end_at: end,
  });

  // KST 2026-06-15
  const now = new Date('2026-06-15T00:00:00+09:00');

  it('시작일·종료일이 둘 다 null이면 false', () => {
    expect(isActiveBoost(flower(null, null), now)).toBe(false);
  });

  it('시작일만 null이면 false', () => {
    expect(isActiveBoost(flower(null, '2026-06-20'), now)).toBe(false);
  });

  it('종료일만 null이면 false', () => {
    expect(isActiveBoost(flower('2026-06-10', null), now)).toBe(false);
  });

  it('today가 시작일 이전이면 false(예약 상태)', () => {
    // today = 2026-06-15, start = 2026-06-20
    expect(isActiveBoost(flower('2026-06-20', '2026-06-25'), now)).toBe(false);
  });

  it('today가 종료일 이후이면 false(만료 상태)', () => {
    // today = 2026-06-15, end = 2026-06-10
    expect(isActiveBoost(flower('2026-06-01', '2026-06-10'), now)).toBe(false);
  });

  it('today가 시작일과 같으면 true(시작 경계)', () => {
    expect(isActiveBoost(flower('2026-06-15', '2026-06-20'), now)).toBe(true);
  });

  it('today가 종료일과 같으면 true(종료 경계)', () => {
    expect(isActiveBoost(flower('2026-06-10', '2026-06-15'), now)).toBe(true);
  });

  it('today가 기간 내부에 있으면 true', () => {
    expect(isActiveBoost(flower('2026-06-10', '2026-06-20'), now)).toBe(true);
  });
});

// ──────────────────────────────────────────────
// boostFirst
// ──────────────────────────────────────────────
describe('boostFirst', () => {
  const makeSpot = (id: string, isBoosted: boolean, nowScore?: number) => ({
    id,
    isBoosted,
    nowScore,
    // FlowerSpot의 나머지 필드는 테스트에서 불필요하므로 stub
    slug: id,
    badge: '',
    bloomEndAt: '',
    bloomStartAt: '',
    bloomStatus: '',
    description: '',
    fee: '',
    festivalDate: '',
    flower: '',
    flowerIsActive: true,
    flowerThumbnailUrl: null,
    helper: '',
    latitude: 0,
    longitude: 0,
    location: '',
    parking: '',
    place: id,
    thumbnailUrl: null,
    tone: 'green' as const,
  });

  const byScore = (a: { isBoosted: boolean; nowScore?: number }, b: { isBoosted: boolean; nowScore?: number }) =>
    (b.nowScore ?? -1) - (a.nowScore ?? -1);

  it('부스트 명소가 비부스트 명소보다 앞에 온다', () => {
    const a = makeSpot('a', false, 90);
    const b = makeSpot('b', true, 50);
    const comparator = boostFirst(byScore);
    expect(comparator(a, b)).toBeGreaterThan(0); // b가 앞
    expect(comparator(b, a)).toBeLessThan(0); // b가 앞
  });

  it('둘 다 부스트이면 base 비교자(nowScore desc)를 따른다', () => {
    const high = makeSpot('high', true, 90);
    const low = makeSpot('low', true, 50);
    const comparator = boostFirst(byScore);
    expect(comparator(high, low)).toBeLessThan(0); // high 먼저
    expect(comparator(low, high)).toBeGreaterThan(0);
  });

  it('둘 다 비부스트이면 base 비교자를 따른다', () => {
    const high = makeSpot('high', false, 90);
    const low = makeSpot('low', false, 50);
    const comparator = boostFirst(byScore);
    expect(comparator(high, low)).toBeLessThan(0);
    expect(comparator(low, high)).toBeGreaterThan(0);
  });

  it('안정 정렬: 같은 isBoosted·nowScore이면 base가 0 반환 → 0 반환', () => {
    const a = makeSpot('a', true, 80);
    const b = makeSpot('b', true, 80);
    const comparator = boostFirst(byScore);
    expect(comparator(a, b)).toBe(0);
  });

  it('sort 전체 시나리오: 부스트 명소가 상위에 오고 그룹 내 nowScore 순', () => {
    const spots = [
      makeSpot('non-high', false, 95),
      makeSpot('boost-low', true, 30),
      makeSpot('non-mid', false, 70),
      makeSpot('boost-high', true, 80),
    ];
    const sorted = [...spots].sort(boostFirst(byScore));
    expect(sorted[0]?.id).toBe('boost-high');
    expect(sorted[1]?.id).toBe('boost-low');
    expect(sorted[2]?.id).toBe('non-high');
    expect(sorted[3]?.id).toBe('non-mid');
  });
});
