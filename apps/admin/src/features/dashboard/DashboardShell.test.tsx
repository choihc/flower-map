import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { DashboardShell } from '@/features/dashboard/DashboardShell';

describe('DashboardShell', () => {
  it('renders the shared admin navigation links', () => {
    render(
      <DashboardShell title="대시보드">
        <div>body</div>
      </DashboardShell>,
    );

    expect(screen.getByRole('heading', { name: '대시보드' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: '꽃 관리' })).toHaveAttribute('href', '/flowers');
    expect(screen.getByRole('link', { name: '명소 관리' })).toHaveAttribute('href', '/spots');
    expect(screen.getByRole('link', { name: 'JSON 등록' })).toHaveAttribute('href', '/spots/import');
  });
});
