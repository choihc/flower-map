import { describe, expect, it } from 'vitest';

import { CACHE_BUSTER, PERSIST_MAX_AGE, persistOptions } from './queryPersister';

describe('persistOptions', () => {
  it('maxAge는 24h (FR-9)', () => {
    expect(PERSIST_MAX_AGE).toBe(1000 * 60 * 60 * 24);
    expect(persistOptions.maxAge).toBe(1000 * 60 * 60 * 24);
  });

  it('buster는 앱 버전을 포함한다 (FR-10)', () => {
    expect(CACHE_BUSTER).toContain('1.0.5');
  });

  it('success 쿼리만 영속한다 (FR-11)', () => {
    const shouldDehydrate = persistOptions.dehydrateOptions.shouldDehydrateQuery;
    expect(shouldDehydrate({ state: { status: 'success' } } as never)).toBe(true);
    expect(shouldDehydrate({ state: { status: 'error' } } as never)).toBe(false);
    expect(shouldDehydrate({ state: { status: 'pending' } } as never)).toBe(false);
  });

  it('persister가 정의되어 있다', () => {
    expect(persistOptions.persister).toBeDefined();
  });
});
