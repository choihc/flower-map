import { describe, expect, it } from 'vitest';

import type { StayType } from '../../../shared/data/types';
import { formatStayTypeBadge, getStayTypeLabel } from './stayType';

describe('getStayTypeLabel', () => {
  it('city 타입은 도심으로 매핑된다', () => {
    expect(getStayTypeLabel('city')).toEqual({ ko: '도심' });
  });

  it('resort 타입은 리조트로 매핑된다', () => {
    expect(getStayTypeLabel('resort')).toEqual({ ko: '리조트' });
  });

  it('poolvilla 타입은 풀빌라로 매핑된다', () => {
    expect(getStayTypeLabel('poolvilla')).toEqual({ ko: '풀빌라' });
  });

  it('onsen 타입은 온천으로 매핑된다', () => {
    expect(getStayTypeLabel('onsen')).toEqual({ ko: '온천' });
  });

  it('kids 타입은 키즈로 매핑된다', () => {
    expect(getStayTypeLabel('kids')).toEqual({ ko: '키즈' });
  });

  it('알 수 없는 타입은 fallback(호텔)을 반환한다', () => {
    const unknown = 'mystery' as unknown as StayType;
    expect(getStayTypeLabel(unknown)).toEqual({ ko: '호텔' });
  });
});

describe('formatStayTypeBadge', () => {
  it('한글 라벨 문자열을 반환한다', () => {
    expect(formatStayTypeBadge('city')).toBe('도심');
  });

  it('fallback 타입도 동일한 포맷으로 반환된다', () => {
    const unknown = 'mystery' as unknown as StayType;
    expect(formatStayTypeBadge(unknown)).toBe('호텔');
  });
});
