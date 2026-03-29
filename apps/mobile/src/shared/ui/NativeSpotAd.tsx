import { useEffect, useRef, useState } from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';
import {
  NativeAd,
  NativeAdView,
  NativeAsset,
  NativeAssetType,
  NativeMediaView,
} from 'react-native-google-mobile-ads';

import { getNativeAdUnitId } from '../lib/adConfig';
import { colors } from '../theme/colors';
import { SkeletonBox } from './SkeletonBox';

type AdState = 'loading' | 'loaded' | 'failed';

export function NativeSpotAd() {
  const [adState, setAdState] = useState<AdState>('loading');
  const [nativeAd, setNativeAd] = useState<InstanceType<typeof NativeAd> | null>(null);
  const adRef = useRef<InstanceType<typeof NativeAd> | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadAd() {
      try {
        const platform = Platform.OS as 'ios' | 'android';
        const ad = await NativeAd.createForAdRequest(getNativeAdUnitId(platform));
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
