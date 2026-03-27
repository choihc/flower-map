import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import HomePage from './page';

describe('HomePage', () => {
  it('renders the admin dashboard landing page', () => {
    render(<HomePage />);

    expect(screen.getByRole('heading', { name: '대시보드' })).toBeInTheDocument();
    expect(screen.getByText('관리 도구를 시작합니다.')).toBeInTheDocument();
  });
});
