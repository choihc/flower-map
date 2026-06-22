import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

// 앱 버전이 바뀌면(또는 캐시 스키마 prefix가 바뀌면) 기존 영속 캐시를 폐기한다. (FR-10)
export const CACHE_BUSTER = `v1-${Constants.expoConfig?.version ?? '0'}`;

// 영속 캐시 보존 기한 24h. 초과 시 복원하지 않고 신규 조회한다. (FR-9)
export const PERSIST_MAX_AGE = 1000 * 60 * 60 * 24;

export const asyncStoragePersister = createAsyncStoragePersister({
  storage: AsyncStorage,
  key: 'flower-map-rq-cache',
});

/**
 * 영속 대상 홈 쿼리 화이트리스트.
 *
 * AsyncStorage 직렬화는 JSON.stringify 기반이라 `Date`가 문자열로 복원된다.
 * content/detail 쿼리(`spots.content`/`stays.content` 등)는 `Date` 필드
 * (블로그 postedAt·영상 publishedAt)를 담고 있어 복원 후 `getFullYear()` 호출 시
 * 크래시한다. 따라서 콜드 스타트 즉시 표시가 목적인 홈 쿼리만 영속한다(P2 범위).
 */
function isHomePersistableKey(queryKey: readonly unknown[]): boolean {
  const [head, second] = queryKey;
  if (head === 'spots') return second === undefined || second === 'top'; // all | top(n)
  if (head === 'stays') return second === undefined; // all (content 제외)
  if (head === 'homeCuration') return second === 'active';
  return false;
}

export const persistOptions = {
  persister: asyncStoragePersister,
  maxAge: PERSIST_MAX_AGE,
  buster: CACHE_BUSTER,
  dehydrateOptions: {
    // 성공 상태의 홈 쿼리만 영속한다. (FR-11)
    shouldDehydrateQuery: (query: { queryKey: readonly unknown[]; state: { status: string } }) =>
      query.state.status === 'success' && isHomePersistableKey(query.queryKey),
  },
};
