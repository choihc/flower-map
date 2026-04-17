import { afterEach, describe, expect, it, vi } from 'vitest';

import { verifyCronAuth } from './auth';

afterEach(() => {
  vi.unstubAllEnvs();
});

function buildRequest(authHeader?: string): Request {
  const headers = new Headers();
  if (authHeader !== undefined) {
    headers.set('authorization', authHeader);
  }
  return new Request('https://example.com/api/cron/x', {
    method: 'POST',
    headers,
  });
}

describe('verifyCronAuth', () => {
  it('올바른 Bearer 토큰이면 true를 반환한다', () => {
    vi.stubEnv('CRON_SECRET', 'super-secret');
    const req = buildRequest('Bearer super-secret');

    expect(verifyCronAuth(req)).toBe(true);
  });

  it('토큰이 다르면 false를 반환한다', () => {
    vi.stubEnv('CRON_SECRET', 'super-secret');
    const req = buildRequest('Bearer wrong-token');

    expect(verifyCronAuth(req)).toBe(false);
  });

  it('CRON_SECRET 환경변수가 없으면 false를 반환한다', () => {
    vi.stubEnv('CRON_SECRET', '');
    const req = buildRequest('Bearer anything');

    expect(verifyCronAuth(req)).toBe(false);
  });

  it('Authorization 헤더가 없으면 false를 반환한다', () => {
    vi.stubEnv('CRON_SECRET', 'super-secret');
    const req = buildRequest(undefined);

    expect(verifyCronAuth(req)).toBe(false);
  });
});
