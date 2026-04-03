import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import TestRenderer, { act } from 'react-test-renderer';
import { Text, Pressable } from 'react-native';
import { SpotListItem } from '../SpotListItem';

const MOCK_SPOT = {
  id: 'spot-1',
  place: '여의도 한강공원',
  flower: '벚꽃',
  location: '서울',
  badge: '지금 방문 추천',
  thumbnailUrl: null,
  bloomStatus: '개화 중',
  description: '벚꽃이 만발합니다.',
  helper: null,
  latitude: 37.52,
  longitude: 126.93,
  tone: 'pink' as const,
};

describe('SpotListItem', () => {
  it('명소 이름, 꽃 종류, 지역을 렌더링합니다', () => {
    let tree: any;
    act(() => {
      tree = TestRenderer.create(
        <SpotListItem spot={MOCK_SPOT} onPress={vi.fn()} />,
      );
    });
    const texts = tree.root
      .findAllByType(Text)
      .map((n: any) => n.props.children);
    expect(texts).toContain('여의도 한강공원');
    expect(texts).toContain('벚꽃');
  });

  it('onPress 콜백을 호출합니다', () => {
    const onPress = vi.fn();
    let tree: any;
    act(() => {
      tree = TestRenderer.create(<SpotListItem spot={MOCK_SPOT} onPress={onPress} />);
    });
    act(() => {
      tree.root.findByType(Pressable).props.onPress();
    });
    expect(onPress).toHaveBeenCalledWith(MOCK_SPOT);
  });
});
