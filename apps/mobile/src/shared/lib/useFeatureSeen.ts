import { useCallback, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SEEN_VALUE = 'true';

function storageKey(slug: string) {
  // 'stays' -> 'hasSeenStays'
  return `hasSeen${slug.charAt(0).toUpperCase()}${slug.slice(1)}`;
}

/**
 * 모듈 레벨 캐시·구독자 패턴.
 *
 * 동일 slug에 대해 컴포넌트가 여러 인스턴스로 훅을 호출해도 상태가 공유되도록
 * 모듈 스코프에 캐시(`cache`)와 리스너 집합(`listeners`)을 보관한다.
 * 첫 마운트 시 동일 slug에 대해 진행 중인 read가 있으면 dedup(`pendingReads`)
 * 하여 AsyncStorage.getItem 호출을 한 번으로 제한한다.
 *
 * markSeen 호출 시 setItem 성공/실패와 무관하게 캐시를 true로 갱신하고
 * 모든 리스너에 broadcast 한다. setItem이 실패하더라도 세션 한정으로 OFF가
 * 유지되어 영구 노출 결함을 차단한다.
 */
type SeenValue = boolean | undefined;
const cache = new Map<string, boolean>();
const pendingReads = new Map<string, Promise<void>>();
const listeners = new Map<string, Set<(seen: SeenValue) => void>>();

function getListeners(key: string): Set<(seen: SeenValue) => void> {
  let set = listeners.get(key);
  if (!set) {
    set = new Set();
    listeners.set(key, set);
  }
  return set;
}

function broadcast(key: string, value: SeenValue) {
  const set = listeners.get(key);
  if (!set) return;
  set.forEach((listener) => listener(value));
}

function ensureRead(key: string): Promise<void> {
  if (cache.has(key)) return Promise.resolve();
  const existing = pendingReads.get(key);
  if (existing) return existing;
  const promise = AsyncStorage.getItem(key)
    .then((value) => {
      // markSeen이 read 중 끼어들어 캐시를 true로 만든 경우에는 그 값을 보존한다.
      if (!cache.has(key)) {
        cache.set(key, value === SEEN_VALUE);
      }
      broadcast(key, cache.get(key));
    })
    .catch((err) => {
      console.warn('[useFeatureSeen] getItem 실패', err);
      if (!cache.has(key)) {
        // 읽기 실패 시그널은 OFF(false 가정 — 노출 유지) 폴백.
        cache.set(key, false);
      }
      broadcast(key, cache.get(key));
    })
    .finally(() => {
      pendingReads.delete(key);
    });
  pendingReads.set(key, promise);
  return promise;
}

/** 테스트 전용: 모듈 캐시/리스너/펜딩 read를 모두 초기화한다. */
export function __resetFeatureSeenCache() {
  cache.clear();
  pendingReads.clear();
  listeners.clear();
}

export type UseFeatureSeen = {
  seen: SeenValue;
  markSeen: () => Promise<void>;
};

export function useFeatureSeen(slug: string): UseFeatureSeen {
  const key = storageKey(slug);
  const [seen, setSeen] = useState<SeenValue>(() => cache.get(key));

  useEffect(() => {
    const listener = (value: SeenValue) => setSeen(value);
    getListeners(key).add(listener);
    // 첫 마운트 시 캐시에 값이 없으면 단일 read 트리거.
    if (!cache.has(key)) {
      void ensureRead(key);
    } else {
      // 캐시에 값이 있으면 상태를 그 값으로 즉시 동기화.
      setSeen(cache.get(key));
    }
    return () => {
      const set = listeners.get(key);
      if (set) {
        set.delete(listener);
        if (set.size === 0) listeners.delete(key);
      }
    };
  }, [key]);

  const markSeen = useCallback(async () => {
    if (cache.get(key) === true) return;
    // 캐시·리스너를 먼저 true로 전파해 setItem 결과와 무관하게 세션 한정 OFF.
    cache.set(key, true);
    broadcast(key, true);
    try {
      await AsyncStorage.setItem(key, SEEN_VALUE);
    } catch (err) {
      // 영구 저장 실패는 경고만 남기고 메모리 캐시는 유지한다.
      console.warn('[useFeatureSeen] setItem 실패', err);
    }
  }, [key]);

  return { seen, markSeen };
}
