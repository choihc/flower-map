import React from 'react';
import { render, screen } from '@testing-library/react';
import { within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { AdminSidebar } from './AdminSidebar';

describe('AdminSidebar', () => {
  it('renders the main navigation group including notifications menu', () => {
    render(<AdminSidebar />);

    expect(screen.getByText('꽃 어디 Admin')).toBeInTheDocument();
    const mainNav = screen.getByRole('navigation', { name: '관리 메뉴' });

    expect(within(mainNav).getByRole('link', { name: '대시보드' })).toHaveAttribute('href', '/');
    expect(within(mainNav).getByRole('link', { name: '꽃 관리' })).toHaveAttribute('href', '/flowers');
    expect(within(mainNav).getByRole('link', { name: '명소 관리' })).toHaveAttribute('href', '/spots');
    expect(within(mainNav).getByRole('link', { name: 'JSON 등록' })).toHaveAttribute('href', '/spots/import');
    expect(within(mainNav).getByRole('link', { name: '알림 발송' })).toHaveAttribute('href', '/notifications');
    expect(within(mainNav).getByRole('link', { name: '설정' })).toHaveAttribute('href', '/settings');
    expect(screen.queryByRole('navigation', { name: '환경' })).not.toBeInTheDocument();
  });
});
