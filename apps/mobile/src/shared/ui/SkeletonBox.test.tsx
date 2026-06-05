import { describe, expect, it } from 'vitest';
import { render } from '@testing-library/react-native';

import { SkeletonBox } from './SkeletonBox';

describe('SkeletonBox', () => {
  it('전달한 testID로 렌더된다', () => {
    const { getByTestId } = render(<SkeletonBox testID="skeleton-box" height={40} />);
    expect(getByTestId('skeleton-box')).toBeTruthy();
  });

  it('testID 없이도 깨지지 않고 렌더된다(애니메이션 graceful degrade)', () => {
    // reanimated mock의 Animated.View는 정적으로 렌더된다 — testID 없는 경로에서
    // 예외 없이 완료되면 통과. (render().container 는 실제 RNTL 타입에 없어 tsc 에러를
    // 유발하므로 사용하지 않는다. 렌더 산출물 확인은 위 testID 케이스가 담당.)
    expect(() => render(<SkeletonBox height={40} />)).not.toThrow();
  });
});
