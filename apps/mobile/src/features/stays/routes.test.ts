import { describe, expect, it } from 'vitest';

import { STAYS_ROUTE, isStaysRoute, staysDetailPath } from './routes';

describe('stays routes', () => {
  it('STAYS_ROUTE 상수는 "/stays"', () => {
    expect(STAYS_ROUTE).toBe('/stays');
  });

  describe('isStaysRoute', () => {
    it('"/stays" 자체는 true', () => {
      expect(isStaysRoute('/stays')).toBe(true);
    });

    it('"/stays/foo" 와 같은 하위 경로는 true', () => {
      expect(isStaysRoute('/stays/foo')).toBe(true);
    });

    it('"/staysfoo" 처럼 prefix만 겹치는 경로는 false', () => {
      expect(isStaysRoute('/staysfoo')).toBe(false);
    });

    it('"/stays-foo" 처럼 prefix만 겹치는 경로는 false', () => {
      expect(isStaysRoute('/stays-foo')).toBe(false);
    });
  });

  it('staysDetailPath은 slug를 prefix와 결합한다', () => {
    expect(staysDetailPath('lotte')).toBe('/stays/lotte');
  });
});
