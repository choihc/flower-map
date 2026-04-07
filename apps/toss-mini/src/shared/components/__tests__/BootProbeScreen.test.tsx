import React from 'react';
import { describe, expect, it } from 'vitest';
import TestRenderer, { act } from 'react-test-renderer';
import { Text } from 'react-native';

import { BootProbeScreen } from '../BootProbeScreen';

describe('BootProbeScreen', () => {
  it('부트 성공 여부를 확인할 수 있는 진단 문구를 렌더링합니다', () => {
    let tree: any;

    act(() => {
      tree = TestRenderer.create(<BootProbeScreen />);
    });

    const texts = tree!.root.findAllByType(Text).map((node: any) => node.props.children);

    expect(texts).toContain('꽃어디 부트 프로브');
    expect(texts).toContain('이 화면이 보이면 앱 부트스트랩은 성공입니다.');
  });
});
