import { describe, expect, it } from 'vitest';

import { resolveMarkerStyle } from './markerStyle';

describe('resolveMarkerStyle', () => {
  it('nowScore >= 80이면 large 단계를 반환한다', () => {
    expect(resolveMarkerStyle(80).tier).toBe('large');
    expect(resolveMarkerStyle(95).tier).toBe('large');
    expect(resolveMarkerStyle(100).tier).toBe('large');
  });

  it('50 <= nowScore < 80이면 medium 단계를 반환한다', () => {
    expect(resolveMarkerStyle(50).tier).toBe('medium');
    expect(resolveMarkerStyle(65).tier).toBe('medium');
    expect(resolveMarkerStyle(79).tier).toBe('medium');
  });

  it('nowScore < 50이면 small 단계를 반환한다', () => {
    expect(resolveMarkerStyle(49).tier).toBe('small');
    expect(resolveMarkerStyle(0).tier).toBe('small');
  });

  it('nowScore가 undefined/null이면 small 단계를 반환한다', () => {
    expect(resolveMarkerStyle(undefined).tier).toBe('small');
    expect(resolveMarkerStyle(null).tier).toBe('small');
  });

  it('tier별로 width/height가 단조 증가한다 (small < medium < large)', () => {
    const small = resolveMarkerStyle(10);
    const medium = resolveMarkerStyle(60);
    const large = resolveMarkerStyle(90);

    expect(small.width).toBeLessThan(medium.width);
    expect(medium.width).toBeLessThan(large.width);
    expect(small.height).toBeLessThan(medium.height);
    expect(medium.height).toBeLessThan(large.height);
  });
});
