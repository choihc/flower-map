import { describe, expect, it } from 'vitest';
import { render } from '@testing-library/react-native';
import { StyleSheet } from 'react-native';

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

  it('전달한 height·borderRadius·width를 스타일에 반영한다', () => {
    const { getByTestId } = render(
      <SkeletonBox testID="skeleton-box" height={120} borderRadius={20} width={220} />,
    );
    const flat = StyleSheet.flatten(getByTestId('skeleton-box').props.style as never) as Record<
      string,
      unknown
    >;
    expect(flat.height).toBe(120);
    expect(flat.borderRadius).toBe(20);
    expect(flat.width).toBe(220);
  });

  it('세로 여백(marginBottom)을 스스로 강제하지 않는다 — 간격은 부모가 관리', () => {
    // 카드 안에 넣었을 때 박스 하단에 빈 여백이 남던 회귀를 막는다(FR-4).
    const { getByTestId } = render(<SkeletonBox testID="skeleton-box" height={40} />);
    const flat = StyleSheet.flatten(getByTestId('skeleton-box').props.style as never) as Record<
      string,
      unknown
    >;
    expect(flat.marginBottom).toBeUndefined();
  });

  it('전달한 style을 병합해 레이아웃을 외부에서 제어할 수 있다', () => {
    const { getByTestId } = render(
      <SkeletonBox testID="skeleton-box" height={40} style={{ marginRight: 12 }} />,
    );
    const flat = StyleSheet.flatten(getByTestId('skeleton-box').props.style as never) as Record<
      string,
      unknown
    >;
    expect(flat.marginRight).toBe(12);
  });
});
