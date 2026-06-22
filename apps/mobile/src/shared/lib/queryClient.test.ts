import { describe, expect, it } from 'vitest';

import { queryClient } from './queryClient';

describe('queryClient 기본 옵션', () => {
  it('gcTime이 영속 maxAge(24h) 이상이어야 한다', () => {
    expect(queryClient.getDefaultOptions().queries?.gcTime).toBe(1000 * 60 * 60 * 24);
  });

  it('staleTime은 30분', () => {
    expect(queryClient.getDefaultOptions().queries?.staleTime).toBe(1000 * 60 * 30);
  });

  it('retry는 2', () => {
    expect(queryClient.getDefaultOptions().queries?.retry).toBe(2);
  });
});
