// apps/mobile/src/__mocks__/expo-notifications.ts
// vitest 환경에서 expo-notifications 네이티브 모듈 mock
// registerPushToken은 단위 테스트에서 직접 테스트하지 않으므로 최소한으로 구현한다.

export const AndroidImportance = { MAX: 5 } as const;

export async function requestPermissionsAsync() {
  return { status: 'granted' };
}

export async function getExpoPushTokenAsync(_options: { projectId?: string }) {
  return { data: 'ExponentPushToken[test-token]' };
}

export async function setNotificationChannelAsync(
  _channelId: string,
  _channel: object,
) {
  return null;
}
