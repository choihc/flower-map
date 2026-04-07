import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import LoginPage from './page';
import { createServerSupabaseClient } from '@/lib/supabase/server';

const { redirect } = vi.hoisted(() => ({
  redirect: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  redirect: redirect,
}));

vi.mock('@/features/auth/LoginForm', () => ({
  LoginForm: () => null,
}));

vi.mock('@/lib/supabase/server', () => ({
  createServerSupabaseClient: vi.fn(),
}));

describe('LoginPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the two-column auth surface for signed-out users', async () => {
    vi.mocked(createServerSupabaseClient).mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: null },
        }),
      },
    } as never);

    render(await LoginPage({ searchParams: Promise.resolve({ redirectTo: '/admin/flowers' }) }));

    expect(screen.getByText('Flower Map Admin')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: '관리자 로그인' })).toBeInTheDocument();
    expect(screen.getByText('redirectTo를 유지한 안전한 이동')).toBeInTheDocument();
  });

  it('redirects signed-in users to the sanitized target', async () => {
    const maybeSingle = vi.fn().mockResolvedValue({
      data: { user_id: 'user-1' },
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

    await LoginPage({ searchParams: Promise.resolve({ redirectTo: 'https://example.com' }) });

    expect(redirect).toHaveBeenCalledWith('/admin/spots');
  });

  it('does not redirect signed-in non-admin users', async () => {
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
          data: { user: { id: 'user-2' } },
        }),
      },
      from,
    } as never);

    render(await LoginPage({ searchParams: Promise.resolve({ redirectTo: '/admin/flowers' }) }));

    expect(redirect).not.toHaveBeenCalled();
    expect(screen.getByRole('heading', { name: '관리자 로그인' })).toBeInTheDocument();
  });
});
