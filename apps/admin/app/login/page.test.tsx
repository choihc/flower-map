import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

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
  it('renders the two-column auth surface for signed-out users', async () => {
    vi.mocked(createServerSupabaseClient).mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: null },
        }),
      },
    } as never);

    render(await LoginPage({ searchParams: Promise.resolve({ redirectTo: '/flowers' }) }));

    expect(screen.getByText('Flower Map Admin')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: '관리자 로그인' })).toBeInTheDocument();
    expect(screen.getByText('redirectTo를 유지한 안전한 이동')).toBeInTheDocument();
  });

  it('redirects signed-in users to the sanitized target', async () => {
    vi.mocked(createServerSupabaseClient).mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: 'user-1' } },
        }),
      },
    } as never);

    await LoginPage({ searchParams: Promise.resolve({ redirectTo: 'https://example.com' }) });

    expect(redirect).toHaveBeenCalledWith('/spots');
  });
});
