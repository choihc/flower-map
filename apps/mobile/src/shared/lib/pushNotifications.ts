// apps/mobile/src/shared/lib/pushNotifications.ts
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import { supabase } from './supabase';

const EAS_PROJECT_ID = 'c4af274d-b7c9-4d43-a479-00e6ae4d1944';

export async function registerPushToken(): Promise<void> {
  // 시뮬레이터/에뮬레이터에서는 푸시 토큰 획득 불가
  if (!Device.isDevice) return;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
    });
  }

  const { status } = await Notifications.requestPermissionsAsync();
  if (status !== 'granted') return;

  const { data: token } = await Notifications.getExpoPushTokenAsync({
    projectId: EAS_PROJECT_ID,
  });

  const platform = Platform.OS as 'ios' | 'android';
  const { error } = await supabase
    .from('push_tokens')
    .insert({ token, platform });
  // 23505: unique_violation (이미 등록된 토큰) → 정상 케이스로 무시
  if (error && error.code !== '23505') {
    console.error('[pushNotifications] token 저장 실패:', error.message);
  }
}
