import { describe, expect, it } from 'vitest';

import { isInternalAppRoute } from './internalRoute';

describe('isInternalAppRoute', () => {
  it('단일 세그먼트 내부 라우트는 허용', () => {
    expect(isInternalAppRoute('/stays')).toBe(true);
    expect(isInternalAppRoute('/map')).toBe(true);
  });

  it('다중 세그먼트 내부 라우트는 허용', () => {
    expect(isInternalAppRoute('/spot/cherry-blossom-yeouido')).toBe(true);
    expect(isInternalAppRoute('/stays/hotel_naru')).toBe(true);
    expect(isInternalAppRoute('/a/b/c')).toBe(true);
  });

  it('루트 "/" 단독은 차단 (expo-router 진입 비결정적)', () => {
    expect(isInternalAppRoute('/')).toBe(false);
  });

  it('트레일링 슬래시 / 더블 슬래시 / 유니코드 RTL 차단', () => {
    expect(isInternalAppRoute('/stays/')).toBe(false);
    expect(isInternalAppRoute('/stays//x')).toBe(false);
    expect(isInternalAppRoute('/stays‮')).toBe(false);
  });

  it('외부 URL은 차단', () => {
    expect(isInternalAppRoute('https://evil.com')).toBe(false);
    expect(isInternalAppRoute('http://localhost')).toBe(false);
  });

  it('스킴 인젝션 차단', () => {
    expect(isInternalAppRoute('javascript:alert(1)')).toBe(false);
    expect(isInternalAppRoute('file:///etc/passwd')).toBe(false);
    expect(isInternalAppRoute('data:text/html,<script>')).toBe(false);
  });

  it('프로토콜 상대 URL 차단', () => {
    expect(isInternalAppRoute('//evil.com/x')).toBe(false);
  });

  it('경로 트래버설 문자 차단', () => {
    expect(isInternalAppRoute('/foo/../bar')).toBe(false);
    expect(isInternalAppRoute('/foo/.')).toBe(false);
  });

  it('쿼리 파라미터/공백/특수문자 차단 (단순 path만 허용)', () => {
    expect(isInternalAppRoute('/stays?id=1')).toBe(false);
    expect(isInternalAppRoute('/stays hotel')).toBe(false);
    expect(isInternalAppRoute('/stays#hash')).toBe(false);
  });

  it('"/"로 시작하지 않는 경로 차단', () => {
    expect(isInternalAppRoute('stays')).toBe(false);
    expect(isInternalAppRoute('')).toBe(false);
  });

  it('비문자열은 false', () => {
    expect(isInternalAppRoute(undefined)).toBe(false);
    expect(isInternalAppRoute(null)).toBe(false);
    expect(isInternalAppRoute(123)).toBe(false);
    expect(isInternalAppRoute({})).toBe(false);
  });
});
