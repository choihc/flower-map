import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import TestRenderer, { act } from 'react-test-renderer';
import { Button } from '@toss/tds-react-native';
import { FlowerFilterChips } from '../FlowerFilterChips';

const FILTERS = [
  { label: '벚꽃', value: '벚꽃' },
  { label: '진달래', value: '진달래' },
];

describe('FlowerFilterChips', () => {
  it('전체 칩과 꽃 필터를 렌더링합니다', () => {
    let tree: any;
    act(() => {
      tree = TestRenderer.create(
        <FlowerFilterChips
          filters={FILTERS}
          selected={null}
          onSelect={vi.fn()}
        />,
      );
    });
    const buttons = tree.root.findAllByType(Button);
    expect(buttons.length).toBe(3); // 전체 + 2개
  });

  it('선택된 꽃 필터를 onSelect로 전달합니다', () => {
    const onSelect = vi.fn();
    let tree: any;
    act(() => {
      tree = TestRenderer.create(
        <FlowerFilterChips
          filters={FILTERS}
          selected={null}
          onSelect={onSelect}
        />,
      );
    });
    const buttons = tree.root.findAllByType(Button);
    act(() => {
      buttons[1].props.onPress(); // 벚꽃 버튼
    });
    expect(onSelect).toHaveBeenCalledWith('벚꽃');
  });

  it('이미 선택된 필터를 다시 누르면 null을 전달합니다', () => {
    const onSelect = vi.fn();
    let tree: any;
    act(() => {
      tree = TestRenderer.create(
        <FlowerFilterChips
          filters={FILTERS}
          selected="벚꽃"
          onSelect={onSelect}
        />,
      );
    });
    const buttons = tree.root.findAllByType(Button);
    act(() => {
      buttons[1].props.onPress(); // 벚꽃 버튼 (이미 선택)
    });
    expect(onSelect).toHaveBeenCalledWith(null);
  });
});
