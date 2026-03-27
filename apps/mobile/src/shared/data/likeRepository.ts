import AsyncStorage from '@react-native-async-storage/async-storage';

const LIKES_KEY = 'spot_likes_v1';

async function getLikedIds(): Promise<Set<string>> {
  const raw = await AsyncStorage.getItem(LIKES_KEY);
  const arr: string[] = raw ? JSON.parse(raw) : [];
  return new Set(arr);
}

async function saveLikedIds(ids: Set<string>): Promise<void> {
  await AsyncStorage.setItem(LIKES_KEY, JSON.stringify([...ids]));
}

export async function isSpotLiked(spotId: string): Promise<boolean> {
  const ids = await getLikedIds();
  return ids.has(spotId);
}

export async function toggleSpotLike(spotId: string): Promise<boolean> {
  const ids = await getLikedIds();
  if (ids.has(spotId)) {
    ids.delete(spotId);
  } else {
    ids.add(spotId);
  }
  await saveLikedIds(ids);
  return ids.has(spotId);
}

export async function getAllLikedIds(): Promise<string[]> {
  const ids = await getLikedIds();
  return [...ids];
}
