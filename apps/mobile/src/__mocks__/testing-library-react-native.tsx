// mock for @testing-library/react-native in vitest (jsdom environment)
import React from 'react';
import { act } from 'react';
import ReactDOM from 'react-dom/client';

type TestElement = HTMLElement & {
  props: {
    children?: unknown;
    style?: unknown;
    [key: string]: unknown;
  };
};

type RenderResult = {
  getByText: (text: string | RegExp) => HTMLElement;
  queryByText: (text: string | RegExp) => HTMLElement | null;
  getByTestId: (testId: string) => TestElement;
  queryByTestId: (testId: string) => TestElement | null;
  getAllByTestId: (testId: string) => TestElement[];
  getByPlaceholderText: (placeholder: string) => HTMLElement;
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

  function matchesText(content: string | null, matcher: string | RegExp): boolean {
    if (content === null) return false;
    if (typeof matcher === 'string') return content === matcher;
    return matcher.test(content);
  }

  function getByText(text: string | RegExp): HTMLElement {
    // Find the closest element containing exactly this text
    const textNodes = getAllTextNodes(container);
    for (const textNode of textNodes) {
      if (matchesText(textNode.textContent, text)) {
        return textNode.parentElement as HTMLElement;
      }
    }
    // Fallback: search by trimmed textContent of leaf elements
    const elements = Array.from(container.querySelectorAll('*'));
    const el = elements.find((e) => {
      const children = Array.from(e.childNodes).filter((n) => n.nodeType !== Node.TEXT_NODE || (n.textContent?.trim() ?? ''));
      const trimmed = e.textContent?.trim() ?? '';
      return matchesText(trimmed, text) && children.every((n) => n.nodeType === Node.TEXT_NODE);
    });
    if (!el) {
      throw new Error(`Unable to find element with text: "${text}"`);
    }
    return el as HTMLElement;
  }

  function queryByText(text: string | RegExp): HTMLElement | null {
    try {
      return getByText(text);
    } catch {
      return null;
    }
  }

  function getReactProps(el: HTMLElement): Record<string, unknown> {
    const fiberKey = Object.keys(el).find(
      (k) => k.startsWith('__reactFiber') || k.startsWith('__reactInternalInstance'),
    );
    if (!fiberKey) return {};
    // Walk UP the fiber tree to find the first fiber whose props.testID matches
    const targetTestId = el.getAttribute('data-testid');
    let fiber: any = (el as any)[fiberKey];
    while (fiber) {
      const p = fiber.pendingProps ?? fiber.memoizedProps;
      if (p && typeof p === 'object' && p.testID === targetTestId) {
        return p as Record<string, unknown>;
      }
      fiber = fiber.return;
    }
    // Fallback: return the immediate fiber's props
    fiber = (el as any)[fiberKey];
    const p = fiber?.pendingProps ?? fiber?.memoizedProps;
    return (p && typeof p === 'object' ? p : {}) as Record<string, unknown>;
  }

  function wrapElement(el: HTMLElement): TestElement {
    const props = getReactProps(el);
    return Object.assign(el, { props }) as TestElement;
  }

  function getByTestId(testId: string): TestElement {
    const el = container.querySelector(`[data-testid="${testId}"]`);
    if (!el) {
      throw new Error(`Unable to find element with testId: "${testId}"`);
    }
    return wrapElement(el as HTMLElement);
  }

  function queryByTestId(testId: string): TestElement | null {
    const el = container.querySelector(`[data-testid="${testId}"]`) as HTMLElement | null;
    return el ? wrapElement(el) : null;
  }

  function getAllByTestId(testId: string): TestElement[] {
    const els = Array.from(container.querySelectorAll(`[data-testid="${testId}"]`)) as HTMLElement[];
    if (els.length === 0) {
      throw new Error(`Unable to find any element with testId: "${testId}"`);
    }
    return els.map(wrapElement);
  }

  function getByPlaceholderText(placeholder: string): HTMLElement {
    const el = container.querySelector(`[placeholder="${placeholder}"]`);
    if (!el) {
      throw new Error(`Unable to find element with placeholder: "${placeholder}"`);
    }
    return el as HTMLElement;
  }

  return {
    getByText,
    queryByText,
    getByTestId,
    queryByTestId,
    getAllByTestId,
    getByPlaceholderText,
    unmount: () => {
      act(() => {
        root.unmount();
      });
      document.body.removeChild(container);
    },
    container,
  };
}

// renderHook utility — minimal subset for vitest jsdom
export function renderHook<T>(callback: () => T): {
  result: { current: T };
  unmount: () => void;
  rerender: () => void;
} {
  const result = { current: undefined as unknown as T };
  function Wrapper() {
    result.current = callback();
    return null;
  }
  const container = document.createElement('div');
  document.body.appendChild(container);
  let root: ReturnType<typeof ReactDOM.createRoot>;
  act(() => {
    root = ReactDOM.createRoot(container);
    root.render(React.createElement(Wrapper));
  });
  return {
    result,
    rerender: () => {
      act(() => {
        root.render(React.createElement(Wrapper));
      });
    },
    unmount: () => {
      act(() => {
        root.unmount();
      });
      document.body.removeChild(container);
    },
  };
}

// fireEvent utility
export const fireEvent = {
  changeText: (element: HTMLElement, value: string) => {
    const onChangeText = (element as any).onChangeText ?? (element as any).__reactFiber?.pendingProps?.onChangeText;
    if (onChangeText) {
      act(() => { onChangeText(value); });
      return;
    }
    // Walk React fiber to find onChangeText prop
    let fiber = (element as any)._reactFiber ?? (element as any)[Object.keys(element).find((k) => k.startsWith('__reactFiber')) ?? ''];
    while (fiber) {
      if (fiber.pendingProps?.onChangeText) {
        act(() => { fiber.pendingProps.onChangeText(value); });
        return;
      }
      fiber = fiber.return;
    }
    throw new Error('fireEvent.changeText: onChangeText prop not found on element');
  },
  press: (element: HTMLElement) => {
    act(() => { element.click(); });
  },
};
