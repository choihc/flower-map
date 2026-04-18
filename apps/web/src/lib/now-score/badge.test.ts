import { describe, it, expect } from 'vitest';
import { pickBadges } from './badge';

describe('pickBadges', () => {
  it('모든 점수가 임계값 미만이면 빈 배열', () => {
    expect(pickBadges({ bloom: 50, trend: 50, yoy: 50 })).toEqual([]);
  });

  it('bloom 80이면 bloom-peak 배지', () => {
    expect(pickBadges({ bloom: 80, trend: 0, yoy: 0 })).toEqual(['bloom-peak']);
  });

  it('bloom 79면 배지 없음', () => {
    expect(pickBadges({ bloom: 79, trend: 0, yoy: 0 })).toEqual([]);
  });

  it('셋 다 임계값 이상이면 3개 배지', () => {
    expect(pickBadges({ bloom: 90, trend: 80, yoy: 85 })).toEqual([
      'bloom-peak',
      'trending',
      'yoy-rising',
    ]);
  });

  it('bloom null이고 trend 70이면 trending만', () => {
    expect(pickBadges({ bloom: null, trend: 70, yoy: null })).toEqual(['trending']);
  });

  it('trend 69면 배지 없음 (경계값)', () => {
    expect(pickBadges({ bloom: 0, trend: 69, yoy: 0 })).toEqual([]);
  });

  it('yoy 70이면 yoy-rising 배지', () => {
    expect(pickBadges({ bloom: null, trend: null, yoy: 70 })).toEqual(['yoy-rising']);
  });

  it('모두 null이면 빈 배열', () => {
    expect(pickBadges({ bloom: null, trend: null, yoy: null })).toEqual([]);
  });
});
