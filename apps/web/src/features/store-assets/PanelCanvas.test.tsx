import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { PanelCanvas } from './PanelCanvas';
import { PANELS } from './panels';

describe('PanelCanvas', () => {
  const impactPanel = PANELS.find((p) => p.layout === 'impact')!;
  const closeupPanel = PANELS.find((p) => p.layout === 'closeup')!;

  it('iOS 플랫폼에서 1242×2688 사이즈로 렌더한다', () => {
    const { container } = render(
      <PanelCanvas panel={closeupPanel} platform="ios" screenshotDataUrl={null} />,
    );
    const root = container.firstChild as HTMLElement;
    expect(root.style.width).toBe('1242px');
    expect(root.style.height).toBe('2688px');
  });

  it('Android 플랫폼에서 1080×1920 사이즈로 렌더한다', () => {
    const { container } = render(
      <PanelCanvas panel={closeupPanel} platform="android" screenshotDataUrl={null} />,
    );
    const root = container.firstChild as HTMLElement;
    expect(root.style.width).toBe('1080px');
    expect(root.style.height).toBe('1920px');
  });

  it('NEW 패널은 NEW 배지를 렌더한다', () => {
    const { getByTestId } = render(
      <PanelCanvas panel={impactPanel} platform="ios" screenshotDataUrl={null} />,
    );
    expect(getByTestId('new-badge').textContent).toBe('NEW');
  });

  it('헤드라인과 서브헤드를 렌더한다', () => {
    const { getByText } = render(
      <PanelCanvas panel={closeupPanel} platform="ios" screenshotDataUrl={null} />,
    );
    // headline은 줄바꿈(\n)을 whitespace 정규화한 형태로 매칭한다.
    expect(getByText(closeupPanel.headline.replace(/\n/g, ' '))).toBeDefined();
    expect(getByText(closeupPanel.subhead)).toBeDefined();
  });

  it('closeup 레이아웃은 PhoneFrame을 렌더한다', () => {
    const { getByTestId } = render(
      <PanelCanvas panel={closeupPanel} platform="ios" screenshotDataUrl={null} />,
    );
    expect(getByTestId('phone-frame')).toBeDefined();
  });

  it('impact 레이아웃은 PhoneFrame을 렌더하지 않는다', () => {
    const { queryByTestId } = render(
      <PanelCanvas panel={impactPanel} platform="ios" screenshotDataUrl={null} />,
    );
    expect(queryByTestId('phone-frame')).toBeNull();
  });

  it('impact 레이아웃은 태그 칩 행을 렌더한다', () => {
    const { getByTestId } = render(
      <PanelCanvas panel={impactPanel} platform="ios" screenshotDataUrl={null} />,
    );
    const row = getByTestId('tag-row');
    expect(row.childElementCount).toBe(impactPanel.tags?.length);
  });
});
