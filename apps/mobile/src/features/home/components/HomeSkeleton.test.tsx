import { describe, expect, it } from 'vitest';
import { render } from '@testing-library/react-native';

import { HomeSkeleton } from './HomeSkeleton';

describe('HomeSkeleton', () => {
  it('home-skeleton 루트와 가로 카드 3개를 렌더한다', () => {
    const { getByTestId, getAllByTestId } = render(<HomeSkeleton />);
    expect(getByTestId('home-skeleton')).toBeTruthy();
    expect(getAllByTestId('home-skeleton-card').length).toBe(3);
  });
});
