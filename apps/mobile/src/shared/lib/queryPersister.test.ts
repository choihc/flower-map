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

  const shouldDehydrate = persistOptions.dehydrateOptions.shouldDehydrateQuery;
  const q = (queryKey: unknown[], status: string) =>
    ({ queryKey, state: { status } }) as never;

  it('success 상태의 홈 쿼리만 영속한다 (FR-11)', () => {
    expect(shouldDehydrate(q(['spots'], 'success'))).toBe(true);
    expect(shouldDehydrate(q(['spots', 'top', 10], 'success'))).toBe(true);
    expect(shouldDehydrate(q(['stays'], 'success'))).toBe(true);
    expect(shouldDehydrate(q(['homeCuration', 'active'], 'success'))).toBe(true);
  });

  it('success가 아니면 영속하지 않는다 (FR-11)', () => {
    expect(shouldDehydrate(q(['spots'], 'error'))).toBe(false);
    expect(shouldDehydrate(q(['spots'], 'pending'))).toBe(false);
  });

  it('Date를 담은 content 쿼리는 영속하지 않는다(복원 시 문자열화 크래시 방지)', () => {
    expect(shouldDehydrate(q(['spots', 'content', 'slug-1'], 'success'))).toBe(false);
    expect(shouldDehydrate(q(['stays', 'content', 'slug-1'], 'success'))).toBe(false);
  });

  it('상세 등 홈 외 쿼리는 영속하지 않는다', () => {
    expect(shouldDehydrate(q(['spots', 'detail', 'slug-1'], 'success'))).toBe(false);
    expect(shouldDehydrate(q(['unknown'], 'success'))).toBe(false);
  });

  it('persister가 정의되어 있다', () => {
    expect(persistOptions.persister).toBeDefined();
  });
});
