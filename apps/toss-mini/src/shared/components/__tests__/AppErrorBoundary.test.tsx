import React from 'react';
import { describe, expect, it } from 'vitest';
import TestRenderer, { act } from 'react-test-renderer';
import { Text } from 'react-native';

import { AppErrorBoundary } from '../AppErrorBoundary';

function Boom(): never {
  throw new Error('boom');
}

describe('AppErrorBoundary', () => {
  it('자식 렌더링 에러를 잡고 폴백 화면을 보여줍니다', () => {
    let tree: any;

    act(() => {
      tree = TestRenderer.create(
        <AppErrorBoundary>
          <Boom />
        </AppErrorBoundary>,
      );
    });

    const texts = tree!.root.findAllByType(Text).map((node: any) => node.props.children);
    expect(texts).toContain('앱을 불러오는 중 문제가 발생했어요');
    expect(texts).toContain('boom');
  });
});
