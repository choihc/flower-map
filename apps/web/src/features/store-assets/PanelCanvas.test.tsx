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

  it('NEW 패널은 NEW 배지를 렌더한다', () => {
    const { getByTestId } = render(
      <PanelCanvas panel={newPanel} platform="ios" screenshotDataUrl={null} />,
    );
    expect(getByTestId('new-badge').textContent).toBe('NEW');
  });

  it('일반 패널은 NEW 배지를 렌더하지 않는다', () => {
    const { queryByTestId } = render(
      <PanelCanvas panel={ordinaryPanel} platform="ios" screenshotDataUrl={null} />,
    );
    expect(queryByTestId('new-badge')).toBeNull();
  });

  it('헤드라인 두 줄과 서브헤드를 렌더한다', () => {
    const { getByText } = render(
      <PanelCanvas panel={ordinaryPanel} platform="ios" screenshotDataUrl={null} />,
    );
    expect(getByText(ordinaryPanel.title[0])).toBeDefined();
    expect(getByText(ordinaryPanel.title[1])).toBeDefined();
    expect(getByText(ordinaryPanel.subtitle)).toBeDefined();
  });

  it('모든 패널이 PhoneFrame을 렌더한다', () => {
    PANELS.forEach((panel) => {
      const { getByTestId, unmount } = render(
        <PanelCanvas panel={panel} platform="ios" screenshotDataUrl={null} />,
      );
      expect(getByTestId('phone-frame')).toBeDefined();
      unmount();
    });
  });

  it('폰에 홈 인디케이터가 있다 (다이내믹 아일랜드는 표시하지 않음)', () => {
    const { getByTestId, queryByTestId } = render(
      <PanelCanvas panel={ordinaryPanel} platform="ios" screenshotDataUrl={null} />,
    );
    expect(getByTestId('home-indicator')).toBeDefined();
    expect(queryByTestId('dynamic-island')).toBeNull();
  });

  it('우상단에 페이지 번호("NN / 06")를 렌더한다', () => {
    const { getByTestId } = render(
      <PanelCanvas panel={ordinaryPanel} platform="ios" screenshotDataUrl={null} />,
    );
    const text = getByTestId('page-number').textContent ?? '';
    expect(text).toMatch(/\d{2}\s*\/\s*06/);
    expect(text).toContain(String(ordinaryPanel.index).padStart(2, '0'));
  });

  it('SPRING 브랜드 서명은 표시하지 않는다', () => {
    const { queryByTestId } = render(
      <PanelCanvas panel={ordinaryPanel} platform="ios" screenshotDataUrl={null} />,
    );
    expect(queryByTestId('brand-signature')).toBeNull();
  });

  it('스크린샷이 없을 때 폰 내부에 phoneNote와 screenshot.png를 렌더한다', () => {
    const { getByText } = render(
      <PanelCanvas panel={ordinaryPanel} platform="ios" screenshotDataUrl={null} />,
    );
    expect(getByText(ordinaryPanel.phoneNote)).toBeDefined();
    expect(getByText('screenshot.png')).toBeDefined();
  });
});
