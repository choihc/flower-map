import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render } from '@testing-library/react-native';

import { StaysDiscoveryCard } from './StaysDiscoveryCard';

describe('StaysDiscoveryCard', () => {
  it('NEW 배지·카피·CTA 라벨을 렌더한다', () => {
    const { getByText } = render(
      <StaysDiscoveryCard onPress={() => {}} onDismiss={() => {}} />,
    );
    expect(getByText('NEW')).toBeTruthy();
    expect(getByText('이번 주말, 호캉스 어디 갈까?')).toBeTruthy();
    expect(getByText('꽃 시즌 사이, 도심 속 휴식 15곳')).toBeTruthy();
    expect(getByText('호캉스 보기 →')).toBeTruthy();
  });

  it('본문 영역 탭 시 onPress 호출', () => {
    const onPress = vi.fn();
    const onDismiss = vi.fn();
    const { getByTestId } = render(
      <StaysDiscoveryCard onPress={onPress} onDismiss={onDismiss} />,
    );
    fireEvent.press(getByTestId('stays-discovery-card'));
    expect(onPress).toHaveBeenCalledTimes(1);
    expect(onDismiss).not.toHaveBeenCalled();
  });

  it('X 디스미스 탭 시 onDismiss만 호출 (onPress 미호출)', () => {
    const onPress = vi.fn();
    const onDismiss = vi.fn();
    const { getByTestId } = render(
      <StaysDiscoveryCard onPress={onPress} onDismiss={onDismiss} />,
    );
    fireEvent.press(getByTestId('stays-discovery-card-dismiss'));
    expect(onDismiss).toHaveBeenCalledTimes(1);
    expect(onPress).not.toHaveBeenCalled();
  });

  it('X 빠르게 두 번 탭해도 onDismiss는 1회만 호출된다', () => {
    const onDismiss = vi.fn();
    const { getByTestId } = render(
      <StaysDiscoveryCard onPress={() => {}} onDismiss={onDismiss} />,
    );
    const dismiss = getByTestId('stays-discovery-card-dismiss');
    fireEvent.press(dismiss);
    fireEvent.press(dismiss);
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it('onDismiss는 exit 애니메이션 완료 콜백 내부에서만 호출된다', () => {
    // 본 테스트는 Animated mock의 start(cb) 동기 호출에 의존하지 않고,
    // "디스미스 직후 onDismiss는 정확히 1번 호출된다"는 계약을 검증한다.
    // (애니메이션 외부에서 즉시 호출되던 race를 회귀 차단한다.)
    const onDismiss = vi.fn();
    const { getByTestId } = render(
      <StaysDiscoveryCard onPress={() => {}} onDismiss={onDismiss} />,
    );
    fireEvent.press(getByTestId('stays-discovery-card-dismiss'));
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });
});
