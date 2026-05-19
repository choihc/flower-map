/** @vitest-environment jsdom */
import { act } from 'react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react-native';

const storage = new Map<string, string>();
let setItemImpl: (key: string, value: string) => Promise<void> = async (key, value) => {
  storage.set(key, value);
};

vi.mock('@react-native-async-storage/async-storage', () => ({
  default: {
    getItem: vi.fn(async (key: string) => storage.get(key) ?? null),
    setItem: vi.fn(async (key: string, value: string) => {
      await setItemImpl(key, value);
    }),
  },
}));

import { useFeatureSeen, __resetFeatureSeenCache } from './useFeatureSeen';
import AsyncStorage from '@react-native-async-storage/async-storage';

async function flushPromises() {
  await act(async () => {
    await Promise.resolve();
    await Promise.resolve();
  });
}

describe('useFeatureSeen', () => {
  beforeEach(() => {
    storage.clear();
    setItemImpl = async (key, value) => {
      storage.set(key, value);
    };
    __resetFeatureSeenCache();
    vi.clearAllMocks();
  });

  it('read 완료 전에는 seen이 undefined (판단 보류)', () => {
    const h = renderHook(() => useFeatureSeen('stays'));
    expect(h.result.current.seen).toBeUndefined();
    h.unmount();
  });

  it('AsyncStorage가 비어있으면 read 후 seen === false', async () => {
    const h = renderHook(() => useFeatureSeen('stays'));
    await flushPromises();
    expect(h.result.current.seen).toBe(false);
    h.unmount();
  });

  it("값이 'true'이면 read 후 seen === true", async () => {
    storage.set('hasSeenStays', 'true');
    const h = renderHook(() => useFeatureSeen('stays'));
    await flushPromises();
    expect(h.result.current.seen).toBe(true);
    h.unmount();
  });

  it('markSeen 호출 시 AsyncStorage에 true 쓰고 seen=true로 전환', async () => {
    const h = renderHook(() => useFeatureSeen('stays'));
    await flushPromises();
    expect(h.result.current.seen).toBe(false);
    await act(async () => {
      await h.result.current.markSeen();
    });
    expect(AsyncStorage.setItem).toHaveBeenCalledWith('hasSeenStays', 'true');
    expect(h.result.current.seen).toBe(true);
    expect(storage.get('hasSeenStays')).toBe('true');
    h.unmount();
  });

  it('이미 true면 markSeen은 setItem을 다시 호출하지 않는다', async () => {
    storage.set('hasSeenStays', 'true');
    const h = renderHook(() => useFeatureSeen('stays'));
    await flushPromises();
    expect(h.result.current.seen).toBe(true);
    await act(async () => {
      await h.result.current.markSeen();
    });
    expect(AsyncStorage.setItem).not.toHaveBeenCalled();
    h.unmount();
  });

  it('동일 slug의 두 인스턴스: 한 쪽 markSeen이 다른 인스턴스에도 즉시 broadcast 된다', async () => {
    const h1 = renderHook(() => useFeatureSeen('stays'));
    const h2 = renderHook(() => useFeatureSeen('stays'));
    await flushPromises();
    expect(h1.result.current.seen).toBe(false);
    expect(h2.result.current.seen).toBe(false);

    await act(async () => {
      await h1.result.current.markSeen();
    });

    expect(h1.result.current.seen).toBe(true);
    expect(h2.result.current.seen).toBe(true);
    h1.unmount();
    h2.unmount();
  });

  it('AsyncStorage.setItem 실패 시 메모리/리스너로 세션 한정 seen=true 전파', async () => {
    setItemImpl = async () => {
      throw new Error('disk full');
    };
    const h1 = renderHook(() => useFeatureSeen('stays'));
    const h2 = renderHook(() => useFeatureSeen('stays'));
    await flushPromises();
    expect(h1.result.current.seen).toBe(false);

    await act(async () => {
      await h1.result.current.markSeen();
    });

    // 영구 저장에는 실패했지만, 메모리 캐시/브로드캐스트로 세션 한정 OFF.
    expect(h1.result.current.seen).toBe(true);
    expect(h2.result.current.seen).toBe(true);
    h1.unmount();
    h2.unmount();
  });

  it('동일 slug의 동시 read는 dedup 된다 (getItem 1회)', async () => {
    const h1 = renderHook(() => useFeatureSeen('stays'));
    const h2 = renderHook(() => useFeatureSeen('stays'));
    await flushPromises();
    expect(AsyncStorage.getItem).toHaveBeenCalledTimes(1);
    h1.unmount();
    h2.unmount();
  });

  it('read pending 중 markSeen 호출이 race 없이 seen=true로 수렴한다', async () => {
    // 초기 getItem은 promise 그대로, markSeen 먼저 호출
    const h1 = renderHook(() => useFeatureSeen('stays'));
    // read가 끝나기 전 즉시 markSeen 호출
    await act(async () => {
      await h1.result.current.markSeen();
    });
    await flushPromises();
    expect(h1.result.current.seen).toBe(true);
    h1.unmount();
  });
});
