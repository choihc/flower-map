import { afterEach, vi } from 'vitest';

// react-test-renderer의 act() 경고를 피하기 위한 플래그입니다.
(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT =
  true;

afterEach(() => {
  vi.restoreAllMocks();
});
