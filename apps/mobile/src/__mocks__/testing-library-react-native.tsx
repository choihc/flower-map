// mock for @testing-library/react-native in vitest (jsdom environment)
import React from 'react';
import { act } from 'react';
import ReactDOM from 'react-dom/client';

type RenderResult = {
  getByText: (text: string) => HTMLElement;
  queryByText: (text: string) => HTMLElement | null;
  getByTestId: (testId: string) => HTMLElement;
  queryByTestId: (testId: string) => HTMLElement | null;
  unmount: () => void;
  container: HTMLElement;
};

export function render(ui: React.ReactElement): RenderResult {
  const container = document.createElement('div');
  document.body.appendChild(container);

  let root: ReturnType<typeof ReactDOM.createRoot>;

  act(() => {
    root = ReactDOM.createRoot(container);
    root.render(ui);
  });

  function getAllTextNodes(el: Element): Text[] {
    const texts: Text[] = [];
    const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
    let node: Text | null;
    while ((node = walker.nextNode() as Text | null)) {
      texts.push(node);
    }
    return texts;
  }

  function getByText(text: string): HTMLElement {
    // Find the closest element containing exactly this text
    const textNodes = getAllTextNodes(container);
    for (const textNode of textNodes) {
      if (textNode.textContent === text) {
        return textNode.parentElement as HTMLElement;
      }
    }
    // Fallback: search by trimmed textContent of leaf elements
    const elements = Array.from(container.querySelectorAll('*'));
    const el = elements.find((e) => {
      const children = Array.from(e.childNodes).filter((n) => n.nodeType !== Node.TEXT_NODE || (n.textContent?.trim() ?? ''));
      return e.textContent?.trim() === text && children.every((n) => n.nodeType === Node.TEXT_NODE);
    });
    if (!el) {
      throw new Error(`Unable to find element with text: "${text}"`);
    }
    return el as HTMLElement;
  }

  function queryByText(text: string): HTMLElement | null {
    try {
      return getByText(text);
    } catch {
      return null;
    }
  }

  function getByTestId(testId: string): HTMLElement {
    const el = container.querySelector(`[data-testid="${testId}"]`);
    if (!el) {
      throw new Error(`Unable to find element with testId: "${testId}"`);
    }
    return el as HTMLElement;
  }

  function queryByTestId(testId: string): HTMLElement | null {
    return (container.querySelector(`[data-testid="${testId}"]`) as HTMLElement) ?? null;
  }

  return {
    getByText,
    queryByText,
    getByTestId,
    queryByTestId,
    unmount: () => {
      act(() => {
        root.unmount();
      });
      document.body.removeChild(container);
    },
    container,
  };
}
