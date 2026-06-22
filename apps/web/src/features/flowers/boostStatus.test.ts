import { describe, expect, it } from 'vitest';

import { boostStatus } from './boostStatus';

// 테스트 헬퍼: 날짜 문자열로 Date 객체 생성 (자정 KST 기준 UTC)
function d(dateStr: string): Date {
  return new Date(`${dateStr}T00:00:00+09:00`);
}

describe('boostStatus', () => {
  const base = {
    slug: 'cherry-blossom',
    name_ko: '벚꽃',
    color_hex: '#F6B7C1',
    season_start_month: 3,
    season_end_month: 4,
    sort_order: 0,
    is_active: true,
    thumbnail_url: null,
    aliases: [] as string[],
    boost_start_at: null as string | null,
    boost_end_at: null as string | null,
  };

  describe('none — boost 미설정', () => {
    it('둘 다 null이면 kind=none, label 빈 문자열', () => {
      const result = boostStatus({ ...base, boost_start_at: null, boost_end_at: null }, d('2026-06-22'));
      expect(result.kind).toBe('none');
      expect(result.label).toBe('');
    });
  });

  describe('active — 오늘이 기간 안에 있음', () => {
    it('오늘이 시작일과 종료일 사이이면 kind=active', () => {
      const result = boostStatus(
        { ...base, boost_start_at: '2026-06-20', boost_end_at: '2026-06-30' },
        d('2026-06-22'),
      );
      expect(result.kind).toBe('active');
    });

    it('active 레이블에 D-n 형식 포함 (종료일까지 남은 일수)', () => {
      // 2026-06-22 ~ 2026-06-30: 오늘이 2026-06-22 → 남은 일수 = 8
      const result = boostStatus(
        { ...base, boost_start_at: '2026-06-22', boost_end_at: '2026-06-30' },
        d('2026-06-22'),
      );
      expect(result.kind).toBe('active');
      expect(result.label).toContain('D-8');
    });

    it('경계: 오늘 == 시작일이면 active', () => {
      const result = boostStatus(
        { ...base, boost_start_at: '2026-06-22', boost_end_at: '2026-06-25' },
        d('2026-06-22'),
      );
      expect(result.kind).toBe('active');
    });

    it('경계: 오늘 == 종료일이면 active (D-0)', () => {
      const result = boostStatus(
        { ...base, boost_start_at: '2026-06-20', boost_end_at: '2026-06-22' },
        d('2026-06-22'),
      );
      expect(result.kind).toBe('active');
      expect(result.label).toContain('D-0');
    });
  });

  describe('scheduled — 시작일이 아직 오지 않음', () => {
    it('오늘이 시작일 이전이면 kind=scheduled', () => {
      const result = boostStatus(
        { ...base, boost_start_at: '2026-07-01', boost_end_at: '2026-07-31' },
        d('2026-06-22'),
      );
      expect(result.kind).toBe('scheduled');
    });

    it('scheduled 레이블에 시작일 MM.DD 포함', () => {
      const result = boostStatus(
        { ...base, boost_start_at: '2026-07-01', boost_end_at: '2026-07-31' },
        d('2026-06-22'),
      );
      expect(result.kind).toBe('scheduled');
      expect(result.label).toContain('07.01');
    });

    it('경계: 오늘 == 시작일 - 1이면 scheduled', () => {
      const result = boostStatus(
        { ...base, boost_start_at: '2026-06-23', boost_end_at: '2026-06-30' },
        d('2026-06-22'),
      );
      expect(result.kind).toBe('scheduled');
    });
  });

  describe('expired — 종료일이 지남', () => {
    it('오늘이 종료일 이후이면 kind=expired', () => {
      const result = boostStatus(
        { ...base, boost_start_at: '2026-06-01', boost_end_at: '2026-06-10' },
        d('2026-06-22'),
      );
      expect(result.kind).toBe('expired');
    });

    it('expired 레이블은 "만료"', () => {
      const result = boostStatus(
        { ...base, boost_start_at: '2026-06-01', boost_end_at: '2026-06-10' },
        d('2026-06-22'),
      );
      expect(result.label).toBe('만료');
    });

    it('경계: 오늘 == 종료일 + 1이면 expired', () => {
      const result = boostStatus(
        { ...base, boost_start_at: '2026-06-01', boost_end_at: '2026-06-21' },
        d('2026-06-22'),
      );
      expect(result.kind).toBe('expired');
    });
  });
});
