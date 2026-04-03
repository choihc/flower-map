import { describe, expect, it, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { Storage } from '@apps-in-toss/framework';
import { useStorage } from '../useStorage';

describe('useStorage', () => {
  beforeEach(() => {
    vi.mocked(Storage.getItem).mockResolvedValue(null);
    vi.mocked(Storage.setItem).mockResolvedValue();
  });

  it('초기에는 빈 배열을 반환합니다', async () => {
    const { result } = renderHook(() => useStorage());
    expect(result.current.savedIds).toEqual([]);
  });

  it('저장된 아이디가 있으면 로드합니다', async () => {
    vi.mocked(Storage.getItem).mockResolvedValue(JSON.stringify(['spot-1']));
    const { result } = renderHook(() => useStorage());
    await act(async () => {});
    expect(result.current.savedIds).toContain('spot-1');
  });

  it('save 호출 시 아이디를 추가합니다', async () => {
    const { result } = renderHook(() => useStorage());
    await act(async () => {
      await result.current.save('spot-2');
    });
    expect(result.current.savedIds).toContain('spot-2');
    expect(Storage.setItem).toHaveBeenCalledWith(
      'saved-spots',
      JSON.stringify(['spot-2']),
    );
  });

  it('remove 호출 시 아이디를 제거합니다', async () => {
    vi.mocked(Storage.getItem).mockResolvedValue(JSON.stringify(['spot-1', 'spot-2']));
    const { result } = renderHook(() => useStorage());
    await act(async () => {});
    await act(async () => {
      await result.current.remove('spot-1');
    });
    expect(result.current.savedIds).not.toContain('spot-1');
    expect(result.current.savedIds).toContain('spot-2');
  });

  it('isSaved는 저장 여부를 반환합니다', async () => {
    vi.mocked(Storage.getItem).mockResolvedValue(JSON.stringify(['spot-1']));
    const { result } = renderHook(() => useStorage());
    await act(async () => {});
    expect(result.current.isSaved('spot-1')).toBe(true);
    expect(result.current.isSaved('spot-99')).toBe(false);
  });
});
