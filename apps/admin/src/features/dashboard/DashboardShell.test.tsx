import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { DashboardShell } from '@/features/dashboard/DashboardShell';

describe('DashboardShell', () => {
  it('renders the admin shell title area and shared navigation labels', () => {
    render(
      <DashboardShell
        title="대시보드"
        description="운영 상태를 확인합니다."
        actions={<button type="button">새 명소</button>}
      >
        <div>body</div>
      </DashboardShell>,
    );

    expect(screen.getByText('꽃 어디 Admin')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: '대시보드' })).toBeInTheDocument();
    expect(screen.getByText('운영 상태를 확인합니다.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '새 명소' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: '대시보드' })).toHaveAttribute('href', '/');
    expect(screen.getByRole('link', { name: '꽃 관리' })).toHaveAttribute('href', '/flowers');
    expect(screen.getByRole('link', { name: '명소 관리' })).toHaveAttribute('href', '/spots');
    expect(screen.getByRole('link', { name: 'JSON 등록' })).toHaveAttribute('href', '/spots/import');
  });
});
