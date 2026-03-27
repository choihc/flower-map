import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { AdminSidebar } from './AdminSidebar';

describe('AdminSidebar', () => {
  it('renders the main navigation groups and settings link', () => {
    render(<AdminSidebar />);

    expect(screen.getByText('꽃 어디 Admin')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: '대시보드' })).toHaveAttribute('href', '/');
    expect(screen.getByRole('link', { name: '꽃 관리' })).toHaveAttribute('href', '/flowers');
    expect(screen.getByRole('link', { name: '명소 관리' })).toHaveAttribute('href', '/spots');
    expect(screen.getByRole('link', { name: 'JSON 등록' })).toHaveAttribute('href', '/spots/import');
    expect(screen.getByRole('link', { name: '설정' })).toHaveAttribute('href', '/settings');
  });
});
