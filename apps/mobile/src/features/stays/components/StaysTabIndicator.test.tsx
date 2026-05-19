import { describe, expect, it, vi } from 'vitest';
import { render } from '@testing-library/react-native';

import { StaysTabIndicator } from './StaysTabIndicator';

describe('StaysTabIndicator', () => {
  it('seen=false 이면 도트가 렌더된다', () => {
    const { getByTestId } = render(<StaysTabIndicator seen={false} />);
    expect(getByTestId('stays-tab-new-dot')).toBeTruthy();
  });

  it('seen=true 이면 도트가 렌더되지 않는다', () => {
    const { queryByTestId } = render(<StaysTabIndicator seen={true} />);
    expect(queryByTestId('stays-tab-new-dot')).toBeNull();
  });

  it('seen=undefined (read 보류)이면 도트가 렌더되지 않는다', () => {
    const { queryByTestId } = render(<StaysTabIndicator seen={undefined} />);
    expect(queryByTestId('stays-tab-new-dot')).toBeNull();
  });
});
