// vitest 환경에서 @react-native-async-storage/async-storage mock
// 인메모리 Map으로 getItem/setItem/removeItem을 흉내낸다.
const store = new Map<string, string>();

const AsyncStorage = {
  getItem: async (key: string): Promise<string | null> => store.get(key) ?? null,
  setItem: async (key: string, value: string): Promise<void> => {
    store.set(key, value);
  },
  removeItem: async (key: string): Promise<void> => {
    store.delete(key);
  },
};

export default AsyncStorage;
