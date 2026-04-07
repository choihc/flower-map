import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import TestRenderer, { act } from 'react-test-renderer';
import { Pressable, Text } from 'react-native';
import { SpotCard } from '../SpotCard';

const MOCK_SPOT = {
  id: 'spot-1',
  slug: 'yeouido-hangang',
  place: '여의도 한강공원',
  flower: '벚꽃',
  location: '서울',
  badge: '지금 방문 추천',
  thumbnailUrl: null,
  flowerThumbnailUrl: null,
  bloomStatus: '개화 중',
  bloomStartAt: '2026-03-20',
  bloomEndAt: '2026-04-10',
  description: '한강을 따라 벚꽃이 만발합니다.',
  helper: '',
  fee: '무료',
  festivalDate: '',
  parking: '주차 가능',
  latitude: 37.52,
  longitude: 126.93,
  tone: 'pink' as const,
};

describe('SpotCard', () => {
  it('명소 이름과 꽃 종류를 렌더링합니다', () => {
    let tree: any;
    act(() => {
      tree = TestRenderer.create(
        <SpotCard spot={MOCK_SPOT} onPress={vi.fn()} />,
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
      tree = TestRenderer.create(<SpotCard spot={MOCK_SPOT} onPress={onPress} />);
    });
    const card = tree.root.findByType(Pressable);
    act(() => {
      card.props.onPress();
    });
    expect(onPress).toHaveBeenCalledWith(MOCK_SPOT);
  });
});
