import { useEffect, useRef, useState } from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';

import { getNativeAdUnitId } from '../lib/adConfig';
import { colors } from '../theme/colors';
import { SkeletonBox } from './SkeletonBox';

// EAS Build 없이 실행 중(시뮬레이터/에뮬레이터)이면 네이티브 모듈이 없으므로 안전하게 로드
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let _ads: any = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  _ads = require('react-native-google-mobile-ads');
} catch {
  // 네이티브 모듈 없음 — 광고 미표시로 폴백
}

type AdState = 'loading' | 'loaded' | 'failed';

export function NativeSpotAd() {
  const [adState, setAdState] = useState<AdState>(() => (_ads ? 'loading' : 'failed'));
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [nativeAd, setNativeAd] = useState<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const adRef = useRef<any>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadAd() {
      try {
        const platform = Platform.OS as 'ios' | 'android';
        const ad = await _ads.NativeAd.createForAdRequest(getNativeAdUnitId(platform));
        if (cancelled) {
          ad.destroy();
          return;
        }
        adRef.current = ad;
        setNativeAd(ad);
        setAdState('loaded');
      } catch {
        if (!cancelled) setAdState('failed');
      }
    }

    loadAd();

    return () => {
      cancelled = true;
      adRef.current?.destroy();
    };
  }, []);

  if (adState === 'failed') return null;

  if (adState === 'loading' || !nativeAd) {
    return <SkeletonBox height={200} borderRadius={24} />;
  }

  const { NativeAdView, NativeAsset, NativeAssetType, NativeMediaView } = _ads;

  return (
    <NativeAdView nativeAd={nativeAd} style={styles.card}>
      <View style={styles.adBadge}>
        <Text style={styles.adBadgeText}>광고</Text>
      </View>

      <NativeMediaView style={styles.media} />

      <NativeAsset assetType={NativeAssetType.HEADLINE}>
        <Text numberOfLines={2} style={styles.headline}>
          {nativeAd.headline}
        </Text>
      </NativeAsset>

      {nativeAd.body ? (
        <NativeAsset assetType={NativeAssetType.BODY}>
          <Text numberOfLines={2} style={styles.body}>
            {nativeAd.body}
          </Text>
        </NativeAsset>
      ) : null}

      <View style={styles.footer}>
        <NativeAsset assetType={NativeAssetType.ADVERTISER}>
          <Text style={styles.advertiser}>{nativeAd.advertiser}</Text>
        </NativeAsset>
        <NativeAsset assetType={NativeAssetType.CALL_TO_ACTION}>
          <View style={styles.ctaButton}>
            <Text style={styles.ctaText}>{nativeAd.callToAction}</Text>
          </View>
        </NativeAsset>
      </View>
    </NativeAdView>
  );
}

const styles = StyleSheet.create({
  adBadge: {
    alignSelf: 'flex-start',
    backgroundColor: colors.cardAlt,
    borderColor: colors.border,
    borderRadius: 6,
    borderWidth: 1,
    marginBottom: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  adBadgeText: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: '600',
  },
  advertiser: {
    color: colors.textMuted,
    fontSize: 13,
  },
  body: {
    color: colors.textMuted,
    fontSize: 14,
    lineHeight: 20,
    marginTop: 4,
  },
  card: {
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderRadius: 24,
    borderWidth: 1,
    marginBottom: 22,
    padding: 18,
    shadowColor: '#BDAF9F',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.08,
    shadowRadius: 24,
  },
  ctaButton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  ctaText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  footer: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  headline: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '700',
    lineHeight: 22,
    marginTop: 10,
  },
  media: {
    borderRadius: 16,
    height: 160,
    width: '100%',
  },
});
