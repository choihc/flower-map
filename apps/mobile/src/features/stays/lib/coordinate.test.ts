import { describe, expect, it } from 'vitest';

import { isValidCoordinate } from './coordinate';

describe('isValidCoordinate', () => {
  it('정상 한국 좌표는 true', () => {
    expect(isValidCoordinate(37.5665, 126.978)).toBe(true);
  });

  it('적도(0, 0) 좌표도 true', () => {
    expect(isValidCoordinate(0, 0)).toBe(true);
  });

  it('NaN은 false', () => {
    expect(isValidCoordinate(NaN, 126)).toBe(false);
    expect(isValidCoordinate(37, NaN)).toBe(false);
  });

  it('undefined/null은 false', () => {
    expect(isValidCoordinate(undefined, 126)).toBe(false);
    expect(isValidCoordinate(37, undefined)).toBe(false);
    expect(isValidCoordinate(null, 126)).toBe(false);
    expect(isValidCoordinate(37, null)).toBe(false);
  });

  it('숫자가 아닌 문자열은 false', () => {
    expect(isValidCoordinate('abc', 126)).toBe(false);
    expect(isValidCoordinate(37, 'xyz')).toBe(false);
  });

  it('빈 문자열, 문자열 숫자, boolean, 배열은 false', () => {
    expect(isValidCoordinate('', 126)).toBe(false);
    expect(isValidCoordinate(37, '')).toBe(false);
    expect(isValidCoordinate('37.5', 126)).toBe(false);
    expect(isValidCoordinate(37, '126.5')).toBe(false);
    expect(isValidCoordinate(true, 126)).toBe(false);
    expect(isValidCoordinate(37, true)).toBe(false);
    expect(isValidCoordinate([37], 126)).toBe(false);
    expect(isValidCoordinate(37, [126])).toBe(false);
  });

  it('위도 90 초과/-90 미만은 false', () => {
    expect(isValidCoordinate(90.0001, 126)).toBe(false);
    expect(isValidCoordinate(-90.0001, 126)).toBe(false);
  });

  it('경도 180 초과/-180 미만은 false', () => {
    expect(isValidCoordinate(37, 180.0001)).toBe(false);
    expect(isValidCoordinate(37, -180.0001)).toBe(false);
  });

  it('경계값 ±90 / ±180은 true', () => {
    expect(isValidCoordinate(90, 180)).toBe(true);
    expect(isValidCoordinate(-90, -180)).toBe(true);
  });
});
