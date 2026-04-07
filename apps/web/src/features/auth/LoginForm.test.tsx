import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { LoginForm } from './LoginForm';

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    replace: vi.fn(),
    refresh: vi.fn(),
  }),
}));

vi.mock('@/lib/supabase/browser', () => ({
  createBrowserSupabaseClient: () => ({
    auth: {
      signInWithPassword: vi.fn(),
    },
  }),
}));

describe('LoginForm', () => {
  it('renders styled admin form controls', () => {
    render(<LoginForm redirectTo="/admin/flowers" />);

    expect(screen.getByLabelText('이메일')).toHaveClass('rounded-xl', 'border-border');
    expect(screen.getByLabelText('비밀번호')).toHaveClass('rounded-xl', 'border-border');
    expect(screen.getByRole('button', { name: '로그인' })).toHaveClass(
      'bg-primary',
      'text-primary-foreground',
      'rounded-xl',
    );
  });
});
