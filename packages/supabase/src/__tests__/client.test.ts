import { beforeEach, describe, expect, it, vi } from 'vitest';

const { createClientMock } = vi.hoisted(() => ({
  createClientMock: vi.fn(() => ({ from: vi.fn() })),
}));

vi.mock('@supabase/supabase-js', () => ({
  createClient: createClientMock,
}));

describe('supabase client', () => {
  beforeEach(() => {
    createClientMock.mockClear();
    vi.resetModules();
  });

  it('앱인토스 환경에 맞게 auth 세션 기능을 비활성화합니다', async () => {
    await import('../client');

    expect(createClientMock).toHaveBeenCalledWith(
      expect.any(String),
      expect.any(String),
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
          detectSessionInUrl: false,
        },
      },
    );
  });
});
