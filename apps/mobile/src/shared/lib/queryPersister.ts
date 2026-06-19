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

export const persistOptions = {
  persister: asyncStoragePersister,
  maxAge: PERSIST_MAX_AGE,
  buster: CACHE_BUSTER,
  dehydrateOptions: {
    // 성공 쿼리만 영속한다. 에러/pending은 영속하지 않는다. (FR-11)
    shouldDehydrateQuery: (query: { state: { status: string } }) =>
      query.state.status === 'success',
  },
};
