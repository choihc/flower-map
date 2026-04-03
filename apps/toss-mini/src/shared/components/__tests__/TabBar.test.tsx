import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import TestRenderer, { act } from 'react-test-renderer';
import { Pressable, Text } from 'react-native';
import { TabBar } from '../TabBar';

describe('TabBar', () => {
  it('4개의 탭을 렌더링합니다', () => {
    let tree: any;
    act(() => {
      tree = TestRenderer.create(
        <TabBar currentRoute="/" onNavigate={vi.fn()} />,
      );
    });
    const labels = tree.root
      .findAllByType(Text)
      .map((n: any) => n.props.children)
      .filter((t: any) => typeof t === 'string');
    expect(labels).toContain('홈');
    expect(labels).toContain('지도');
    expect(labels).toContain('검색');
    expect(labels).toContain('저장');
  });

  it('현재 탭을 onNavigate로 전달합니다', () => {
    const onNavigate = vi.fn();
    let tree: any;
    act(() => {
      tree = TestRenderer.create(
        <TabBar currentRoute="/" onNavigate={onNavigate} />,
      );
    });
    const tabs = tree.root.findAllByType(Pressable);
    act(() => {
      tabs[1].props.onPress(); // 지도 탭
    });
    expect(onNavigate).toHaveBeenCalledWith('/map');
  });
});
