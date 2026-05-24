import { describe, expect, it } from 'vitest';
import { render } from '@testing-library/react-native';
import { StyleSheet } from 'react-native';

import { ScreenShell } from './ScreenShell';

describe('ScreenShell', () => {
  it('titleText 미전달 시 로고 이미지(testID=screen-shell-title-image)가 렌더된다', () => {
    const { getByTestId, queryByTestId } = render(<ScreenShell />);
    expect(getByTestId('screen-shell-title-image')).toBeTruthy();
    expect(queryByTestId('screen-shell-title-text')).toBeNull();
  });

  it('titleText 전달 시 텍스트 헤더(testID=screen-shell-title-text)가 렌더되고 이미지가 사라진다', () => {
    const { getByTestId, queryByTestId } = render(
      <ScreenShell titleText="꽃 & 호캉스 어디?" />,
    );
    const text = getByTestId('screen-shell-title-text');
    expect(text.props.children).toBe('꽃 & 호캉스 어디?');
    expect(queryByTestId('screen-shell-title-image')).toBeNull();
  });

  it('titleText + titleColor 전달 시 텍스트에 color 스타일이 적용된다', () => {
    const { getByTestId } = render(
      <ScreenShell titleText="홈" titleColor="#C4778A" />,
    );
    const node = getByTestId('screen-shell-title-text');
    const flat = StyleSheet.flatten(node.props.style);
    expect(flat?.color).toBe('#C4778A');
  });

  it('hideTitleHeader=true 전달 시 로고 이미지와 타이틀 텍스트가 모두 렌더되지 않는다', () => {
    const { queryByTestId } = render(
      <ScreenShell showBack hideTitleHeader titleText="숨겨질 타이틀" subtitle="서브" />,
    );
    expect(queryByTestId('screen-shell-title-image')).toBeNull();
    expect(queryByTestId('screen-shell-title-text')).toBeNull();
  });
});
