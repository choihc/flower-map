import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { PanelCanvas } from './PanelCanvas';
import { PANELS } from './panels';

describe('PanelCanvas', () => {
  const panel = PANELS[0]!;

  it('iOS 플랫폼에서 1242×2688 사이즈로 렌더한다', () => {
    const { container } = render(
      <PanelCanvas panel={panel} platform="ios" screenshotDataUrl={null} />,
    );
    const root = container.firstChild as HTMLElement;
    expect(root.style.width).toBe('1242px');
    expect(root.style.height).toBe('2688px');
  });

  it('Android 플랫폼에서 1080×1920 사이즈로 렌더한다', () => {
    const { container } = render(
      <PanelCanvas panel={panel} platform="android" screenshotDataUrl={null} />,
    );
    const root = container.firstChild as HTMLElement;
    expect(root.style.width).toBe('1080px');
    expect(root.style.height).toBe('1920px');
  });

  it('NEW 패널은 NEW 배지를 렌더한다', () => {
    const { getByTestId } = render(
      <PanelCanvas panel={panel} platform="ios" screenshotDataUrl={null} />,
    );
    expect(getByTestId('new-badge').textContent).toBe('NEW');
  });

  it('헤드라인과 서브헤드를 렌더한다', () => {
    const { getByText } = render(
      <PanelCanvas panel={panel} platform="ios" screenshotDataUrl={null} />,
    );
    expect(getByText(panel.headline)).toBeDefined();
    expect(getByText(panel.subhead)).toBeDefined();
  });
});
