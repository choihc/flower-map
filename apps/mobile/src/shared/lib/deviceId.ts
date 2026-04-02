import AsyncStorage from '@react-native-async-storage/async-storage';
import { randomUUID } from 'expo-crypto';

const DEVICE_ID_KEY = 'device_id_v1';

let cached: string | null = null;

export async function getDeviceId(): Promise<string> {
  if (cached) return cached;

  const stored = await AsyncStorage.getItem(DEVICE_ID_KEY);
  if (stored) {
    cached = stored;
    return stored;
  }

  const id = randomUUID();
  await AsyncStorage.setItem(DEVICE_ID_KEY, id);
  cached = id;
  return id;
}
