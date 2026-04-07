import { describe, expect, it } from 'vitest';

import { compareAppVersions, isInlineAdSupported } from '../tossAppVersion';

describe('tossAppVersion', () => {
  it('버전 문자열을 숫자 기준으로 비교합니다', () => {
    expect(compareAppVersions('5.241.0', '5.241.0')).toBe(0);
    expect(compareAppVersions('5.241.1', '5.241.0')).toBeGreaterThan(0);
    expect(compareAppVersions('5.240.9', '5.241.0')).toBeLessThan(0);
  });

  it('배너 광고 지원 최소 버전 이상에서만 true를 반환합니다', () => {
    expect(isInlineAdSupported('5.240.9')).toBe(false);
    expect(isInlineAdSupported('5.241.0')).toBe(true);
    expect(isInlineAdSupported('5.300.1')).toBe(true);
  });

  it('버전 정보를 알 수 없으면 안전하게 false를 반환합니다', () => {
    expect(isInlineAdSupported('')).toBe(false);
    expect(isInlineAdSupported(undefined)).toBe(false);
  });
});
