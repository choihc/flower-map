import { describe, expect, it, afterEach } from 'vitest';

import { getNativeAdUnitId } from './adConfig';

describe('getNativeAdUnitId', () => {
  afterEach(() => {
    delete process.env.EXPO_PUBLIC_ADMOB_NATIVE_AD_UNIT_ID_IOS;
    delete process.env.EXPO_PUBLIC_ADMOB_NATIVE_AD_UNIT_ID_ANDROID;
  });

  it('환경변수 미설정 시 iOS 테스트 광고 유닛 ID를 반환한다', () => {
    expect(getNativeAdUnitId('ios')).toBe('ca-app-pub-3940256099942544/3986624511');
  });

  it('환경변수 미설정 시 Android 테스트 광고 유닛 ID를 반환한다', () => {
    expect(getNativeAdUnitId('android')).toBe('ca-app-pub-3940256099942544/2247696110');
  });

  it('EXPO_PUBLIC_ADMOB_NATIVE_AD_UNIT_ID_IOS 환경변수가 있으면 해당 값을 반환한다', () => {
    process.env.EXPO_PUBLIC_ADMOB_NATIVE_AD_UNIT_ID_IOS = 'ca-app-pub-real/ios-unit';
    expect(getNativeAdUnitId('ios')).toBe('ca-app-pub-real/ios-unit');
  });

  it('EXPO_PUBLIC_ADMOB_NATIVE_AD_UNIT_ID_ANDROID 환경변수가 있으면 해당 값을 반환한다', () => {
    process.env.EXPO_PUBLIC_ADMOB_NATIVE_AD_UNIT_ID_ANDROID = 'ca-app-pub-real/android-unit';
    expect(getNativeAdUnitId('android')).toBe('ca-app-pub-real/android-unit');
  });
});
