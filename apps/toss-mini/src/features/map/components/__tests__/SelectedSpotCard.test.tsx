import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import TestRenderer, { act } from 'react-test-renderer';
import { Pressable, Text } from 'react-native';

import { SelectedSpotCard } from '../SelectedSpotCard';

describe('SelectedSpotCard', () => {
  it('선택된 명소의 이름과 상세 버튼을 렌더링합니다', () => {
    let tree: any;
    act(() => {
      tree = TestRenderer.create(
        <SelectedSpotCard
          spot={{
            id: 'spot-1',
            place: '여의도 한강공원',
            helper: '한강 산책',
            flower: '벚꽃',
          }}
          onPressDetail={() => {}}
        />,
      );
    });

    const texts = tree!.root
      .findAllByType(Text)
      .map((node: { props: { children: unknown } }) => node.props.children);
    expect(texts).toContain('여의도 한강공원');
    expect(texts).toContain('벚꽃');
    expect(texts).toContain('상세 보기');
  });

  it('상세 보기 버튼을 누르면 콜백을 호출합니다', () => {
    const onPressDetail = vi.fn();
    let tree: any;
    act(() => {
      tree = TestRenderer.create(
        <SelectedSpotCard
          spot={{
            id: 'spot-1',
            place: '여의도 한강공원',
            helper: '한강 산책',
            flower: '벚꽃',
          }}
          onPressDetail={onPressDetail}
        />,
      );
    });

    const button = tree!.root.findByType(Pressable);
    act(() => {
      button.props.onPress();
    });
    expect(onPressDetail).toHaveBeenCalledTimes(1);
  });
});
