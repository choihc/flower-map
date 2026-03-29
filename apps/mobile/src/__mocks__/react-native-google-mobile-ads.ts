export const NativeAd = {
  createForAdRequest: async (_adUnitId: string) => ({
    headline: '테스트 광고 제목',
    body: '테스트 광고 설명',
    callToAction: '더 알아보기',
    advertiser: '테스트 광고주',
    destroy: () => {},
  }),
};

export const NativeAdView = 'NativeAdView';
export const NativeAsset = 'NativeAsset';
export const NativeMediaView = 'NativeMediaView';
export const NativeAssetType = {
  HEADLINE: 'headline',
  BODY: 'body',
  CALL_TO_ACTION: 'callToAction',
  ADVERTISER: 'advertiser',
  ICON: 'icon',
} as const;
