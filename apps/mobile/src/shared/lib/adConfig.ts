export function getNativeAdUnitId(platform: 'ios' | 'android'): string {
  if (platform === 'ios') {
    return (
      process.env.EXPO_PUBLIC_ADMOB_NATIVE_AD_UNIT_ID_IOS ??
      'ca-app-pub-3940256099942544/3986624511'
    );
  }
  return (
    process.env.EXPO_PUBLIC_ADMOB_NATIVE_AD_UNIT_ID_ANDROID ??
    'ca-app-pub-3940256099942544/2247696110'
  );
}
