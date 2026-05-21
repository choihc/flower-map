import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { PanelCanvas } from './PanelCanvas';
import { PANELS } from './panels';

describe('PanelCanvas', () => {
  const newPanel = PANELS.find((p) => p.isNew)!;
  const ordinaryPanel = PANELS.find((p) => !p.isNew)!;

  it('iOS 플랫폼에서 1242×2688 사이즈로 렌더한다', () => {
    const { container } = render(
      <PanelCanvas panel={ordinaryPanel} platform="ios" screenshotDataUrl={null} />,
    );
    const root = container.firstChild as HTMLElement;
    expect(root.style.width).toBe('1242px');
    expect(root.style.height).toBe('2688px');
  });

  it('Android 플랫폼에서 1080×1920 사이즈로 렌더한다', () => {
    const { container } = render(
      <PanelCanvas panel={ordinaryPanel} platform="android" screenshotDataUrl={null} />,
    );
    const root = container.firstChild as HTMLElement;
    expect(root.style.width).toBe('1080px');
    expect(root.style.height).toBe('1920px');
  });

  it('NEW 패널은 보라색 NEW 배지를 렌더한다', () => {
    const { getByTestId } = render(
      <PanelCanvas panel={newPanel} platform="ios" screenshotDataUrl={null} />,
    );
    const badge = getByTestId('new-badge');
    expect(badge.textContent).toBe('NEW');
  });

  it('일반 패널은 NEW 배지를 렌더하지 않는다', () => {
    const { queryByTestId } = render(
      <PanelCanvas panel={ordinaryPanel} platform="ios" screenshotDataUrl={null} />,
    );
    expect(queryByTestId('new-badge')).toBeNull();
  });

  it('헤드라인과 서브헤드를 렌더한다', () => {
    const { getByText } = render(
      <PanelCanvas panel={ordinaryPanel} platform="ios" screenshotDataUrl={null} />,
    );
    expect(getByText(ordinaryPanel.headline.replace(/\n/g, ' '))).toBeDefined();
    expect(getByText(ordinaryPanel.subhead)).toBeDefined();
  });

  it('모든 패널이 PhoneFrame을 렌더한다(단일 레이아웃)', () => {
    PANELS.forEach((panel) => {
      const { getByTestId, unmount } = render(
        <PanelCanvas panel={panel} platform="ios" screenshotDataUrl={null} />,
      );
      expect(getByTestId('phone-frame')).toBeDefined();
      unmount();
    });
  });

  it('폰에 다이내믹 아일랜드가 있다', () => {
    const { getByTestId } = render(
      <PanelCanvas panel={ordinaryPanel} platform="ios" screenshotDataUrl={null} />,
    );
    expect(getByTestId('dynamic-island')).toBeDefined();
  });

  it('우상단에 페이지 번호("NN / 총수")를 렌더한다', () => {
    const { getByTestId } = render(
      <PanelCanvas panel={ordinaryPanel} platform="ios" screenshotDataUrl={null} />,
    );
    const text = getByTestId('page-number').textContent ?? '';
    expect(text).toMatch(/\d{2}\s*\/\s*\d{2}/);
    expect(text).toContain(String(ordinaryPanel.index).padStart(2, '0'));
  });

  it('좌하단에 푸터 라벨(SEASON · footerLabel + screenshot.png)을 렌더한다', () => {
    const { getByTestId } = render(
      <PanelCanvas panel={ordinaryPanel} platform="ios" screenshotDataUrl={null} />,
    );
    const text = getByTestId('footer-label').textContent ?? '';
    expect(text).toContain(ordinaryPanel.footerLabel);
    expect(text).toContain('screenshot.png');
  });
});
