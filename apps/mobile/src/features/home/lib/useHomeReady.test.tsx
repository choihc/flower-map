import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { act } from 'react';
import { renderHook } from '@testing-library/react-native';

vi.mock('@tanstack/react-query', () => ({ useQuery: vi.fn() }));
vi.mock('../../../shared/data/spotRepository', () => ({
  spotKeys: { all: ['spots'], top: (n: number) => ['spots', 'top', n] },
  getPublishedSpots: vi.fn(),
  getTopSpots: vi.fn(),
}));
vi.mock('../../../shared/data/homeCurationRepository', () => ({
  homeCurationKeys: { active: ['homeCuration', 'active'] },
  getActiveHomeCurationSlots: vi.fn(),
}));
vi.mock('../../../shared/data/stayRepository', () => ({
  stayKeys: { all: ['stays'] },
  getPublishedStays: vi.fn(),
}));

import { useQuery } from '@tanstack/react-query';
import { useHomeReady, HOME_SKELETON_TIMEOUT_MS } from './useHomeReady';

const queryMock = useQuery as unknown as ReturnType<typeof vi.fn>;

// queryKey(JSON 문자열) → status 매핑. 미지정 키는 fallback 상태를 쓴다.
// 호출 순서에 의존하지 않으므로 리렌더에도 안전하다.
function mockStatuses(map: Record<string, string>, fallback = 'success') {
  queryMock.mockImplementation((opts: any) => ({
    status: map[JSON.stringify(opts.queryKey)] ?? fallback,
  }));
}

describe('useHomeReady', () => {
  beforeEach(() => {
    queryMock.mockReset();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('모든 쿼리가 pending이면 ready=false', () => {
    mockStatuses({}, 'pending');
    const { result } = renderHook(() => useHomeReady());
    expect(result.current.ready).toBe(false);
  });

  it('모든 쿼리가 success면 첫 렌더에서 ready=true (캐시 적중 무플래시 · FR-5)', () => {
    mockStatuses({}, 'success');
    const { result } = renderHook(() => useHomeReady());
    expect(result.current.ready).toBe(true);
  });

  it('일부 쿼리가 error여도 모두 settled면 ready=true (FR-2)', () => {
    mockStatuses({ '["stays"]': 'error' }, 'success');
    const { result } = renderHook(() => useHomeReady());
    expect(result.current.ready).toBe(true);
  });

  it('하나라도 pending이면 ready=false', () => {
    mockStatuses({ '["spots","top",10]': 'pending' }, 'success');
    const { result } = renderHook(() => useHomeReady());
    expect(result.current.ready).toBe(false);
  });

  it('타임아웃 경과 시 pending이어도 ready=true로 강제된다 (FR-3)', () => {
    vi.useFakeTimers();
    mockStatuses({}, 'pending');
    const { result } = renderHook(() => useHomeReady({ timeoutMs: HOME_SKELETON_TIMEOUT_MS }));
    expect(result.current.ready).toBe(false);
    act(() => {
      vi.advanceTimersByTime(HOME_SKELETON_TIMEOUT_MS);
    });
    expect(result.current.ready).toBe(true);
  });
});
