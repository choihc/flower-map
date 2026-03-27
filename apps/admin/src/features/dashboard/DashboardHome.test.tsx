import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { DashboardHome } from './DashboardHome';

describe('DashboardHome', () => {
  it('renders KPI values, quick actions, and recent spot rows', () => {
    render(
      <DashboardHome
        metrics={{
          flowers: 12,
          spots: 48,
          draftSpots: 7,
          publishedSpots: 41,
        }}
        recentSpots={[
          {
            id: '1',
            name: '여의도 윤중로',
            flowerName: '벚꽃',
            status: 'draft',
            region: '서울 영등포구',
          },
          {
            id: '2',
            name: '제주 녹산로',
            flowerName: '유채꽃',
            status: 'published',
            region: '제주 서귀포시',
          },
        ]}
      />,
    );

    expect(screen.getByText('12')).toBeInTheDocument();
    expect(screen.getByText('48')).toBeInTheDocument();
    expect(screen.getByText('7')).toBeInTheDocument();
    expect(screen.getByText('41')).toBeInTheDocument();

    expect(screen.getByRole('link', { name: /꽃 관리/ })).toHaveAttribute('href', '/flowers');
    expect(screen.getByRole('link', { name: /명소 관리/ })).toHaveAttribute('href', '/spots');
    expect(screen.getByRole('link', { name: /JSON 등록/ })).toHaveAttribute('href', '/spots/import');

    expect(screen.getByRole('row', { name: /여의도 윤중로.*검토 중/ })).toBeInTheDocument();
    expect(screen.getByRole('row', { name: /제주 녹산로.*게시됨/ })).toBeInTheDocument();
  });
});
