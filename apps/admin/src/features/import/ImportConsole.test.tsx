import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { ImportConsole } from './ImportConsole';

describe('ImportConsole', () => {
  it('shows validation results after parsing a valid payload', async () => {
    const onValidate = vi.fn().mockResolvedValue({
      created: 1,
      updated: 0,
      errors: [],
    });

    render(<ImportConsole onValidate={onValidate} />);

    fireEvent.change(screen.getByLabelText('JSON 입력'), {
      target: {
        value:
          '{"flower_slug":"cherry-blossom","spot":{"slug":"yeouido-yunjung-ro","name":"여의도 윤중로","region_primary":"서울/경기","region_secondary":"서울 영등포구","address":"서울특별시 영등포구 여의서로 일대","latitude":37.5259,"longitude":126.9226,"description":"설명","short_tip":"팁","bloom_start_at":"2026-03-28","bloom_end_at":"2026-04-10"}}',
      },
    });

    fireEvent.click(screen.getByRole('button', { name: '검증' }));

    expect(await screen.findByText('신규 1건')).toBeInTheDocument();
  });
});
