import { describe, expect, it, vi } from 'vitest';

import DashboardLayout from './layout';
import { createServerSupabaseClient } from '@/lib/supabase/server';

const { redirect } = vi.hoisted(() => ({
  redirect: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  redirect,
}));

vi.mock('@/lib/supabase/server', () => ({
  createServerSupabaseClient: vi.fn(),
}));

describe('DashboardLayout', () => {
  it('redirects signed-out users to login', async () => {
    vi.mocked(createServerSupabaseClient).mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: null },
        }),
      },
      from: vi.fn(),
    } as never);

    await DashboardLayout({ children: 'child' });

    expect(redirect).toHaveBeenCalledWith('/login');
  });

  it('redirects signed-in non-admin users to login', async () => {
    const maybeSingle = vi.fn().mockResolvedValue({
      data: null,
      error: null,
    });
    const eq = vi.fn().mockReturnValue({ maybeSingle });
    const select = vi.fn().mockReturnValue({ eq });
    const from = vi.fn().mockReturnValue({ select });

    vi.mocked(createServerSupabaseClient).mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: 'user-1' } },
        }),
      },
      from,
    } as never);

    await DashboardLayout({ children: 'child' });

    expect(redirect).toHaveBeenCalledWith('/login');
  });
});
