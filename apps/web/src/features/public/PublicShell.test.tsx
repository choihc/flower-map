import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { PublicShell } from './PublicShell';

describe('PublicShell', () => {
  it('renders public content without admin navigation chrome', () => {
    render(
      <PublicShell>
        <div>공개 콘텐츠</div>
      </PublicShell>,
    );

    expect(screen.getByText('공개 콘텐츠')).toBeInTheDocument();
    expect(screen.queryByText('꽃 어디 Admin')).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: '꽃 어디' })).toHaveAttribute('href', '/');
    expect(screen.getAllByRole('link', { name: '지도' })[0]).toHaveAttribute('href', '/map');
    expect(screen.getAllByRole('link', { name: '검색' })[0]).toHaveAttribute('href', '/search');
    expect(screen.getByRole('link', { name: '홈' })).toHaveAttribute('href', '/');
  });
});
