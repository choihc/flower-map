// vitest 환경에서 expo-location 네이티브 모듈 mock
// requestAndGetLocation은 단위 테스트에서 직접 테스트하지 않으므로 최소한으로 구현한다.

export const PermissionStatus = {
  GRANTED: 'granted',
  DENIED: 'denied',
  UNDETERMINED: 'undetermined',
} as const;

export async function requestForegroundPermissionsAsync() {
  return { status: 'granted' };
}

export async function getCurrentPositionAsync() {
  return {
    coords: {
      latitude: 0,
      longitude: 0,
    },
  };
}
