import { describe, it, expect } from 'vitest';
import { calcNowScore } from './aggregate';

describe('calcNowScore', () => {
  it('bloom/trend/content 모두 null이면 null 반환', () => {
    expect(calcNowScore({ bloom: null, trend: null, content: null, yoy: null })).toBeNull();
  });

  it('모두 100이면 100 (가중합 1.0)', () => {
    expect(
      calcNowScore({ bloom: 100, trend: 100, content: 100, yoy: 100 })
    ).toBeCloseTo(100, 2);
  });

  it('bloom만 100, 나머지 null이면 가용 가중치 재정규화로 100', () => {
    expect(
      calcNowScore({ bloom: 100, trend: null, content: null, yoy: null })
    ).toBeCloseTo(100, 2);
  });

  it('trend=100, content=100, 나머지 null이면 100 (두 subscore만으로 재정규화)', () => {
    expect(
      calcNowScore({ bloom: null, trend: 100, content: 100, yoy: null })
    ).toBeCloseTo(100, 2);
  });

  it('yoy만 있어도 bloom/trend/content 모두 null이면 null (주요 subscore 부재)', () => {
    expect(
      calcNowScore({ bloom: null, trend: null, content: null, yoy: 100 })
    ).toBeNull();
  });

  it('bloom=50, trend=100, content=null, yoy=null → (50*0.47 + 100*0.29) / (0.47 + 0.29)', () => {
    const expected =
      Math.round(((50 * 0.47 + 100 * 0.29) / (0.47 + 0.29)) * 100) / 100;
    expect(
      calcNowScore({ bloom: 50, trend: 100, content: null, yoy: null }),
    ).toBeCloseTo(expected, 2);
  });
});
