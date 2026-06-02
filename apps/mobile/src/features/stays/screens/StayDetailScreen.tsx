import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useQuery } from '@tanstack/react-query';

import {
  getPublishedStayBySlug,
  getStayContent,
  stayKeys,
} from '../../../shared/data/stayRepository';
import type { Stay, StayRating } from '../../../shared/data/types';
import { isValidCoordinate } from '../../../shared/lib/coordinate';
import { openExternalHttpUrl } from '../../../shared/lib/externalLink';
import {
  DIRECTIONS_DISABLED_MESSAGE,
  openNaverMapPlace,
  openNaverNavigation,
} from '../../../shared/lib/naverMap';
import { showToast } from '../../../shared/lib/toast';
import { colors } from '../../../shared/theme/colors';
import { NativeSpotAd } from '../../../shared/ui/NativeSpotAd';
import { ScreenShell } from '../../../shared/ui/ScreenShell';
import { SectionCard } from '../../../shared/ui/SectionCard';
import { SkeletonBox } from '../../../shared/ui/SkeletonBox';
import { SpotHeroCard } from '../../../shared/ui/SpotHeroCard';
import { StoriesSection } from '../../../shared/ui/StoriesSection';
import { openTripcomHotel, resolveBookingQuery } from '../lib/affiliateHotel';
import { formatStayTypeBadge } from '../lib/stayType';

type StayDetailScreenProps = {
  slug: string;
};

const RATING_LABELS = { naver: '네이버', google: '구글' } as const;

function buildInfoPills(stay: Stay): string[] {
  const region = `${stay.regionPrimary} · ${stay.regionSecondary}`;
  const tags = stay.seasonTags.slice(0, 2);
  return [region, ...tags];
}

function formatCapturedAt(value: string | null): string | null {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function StayDetailScreen({ slug }: StayDetailScreenProps) {
  const { data: stay, isLoading } = useQuery({
    queryKey: stayKeys.detail(slug),
    queryFn: () => getPublishedStayBySlug(slug),
  });

  const { data: content } = useQuery({
    queryKey: stayKeys.content(slug),
    queryFn: () => getStayContent(slug),
    enabled: !!stay,
  });

  if (isLoading) {
    return (
      <ScreenShell showBack hideTitleHeader>
        <SkeletonBox height={320} borderRadius={28} />
        <SkeletonBox height={120} borderRadius={20} />
        <SkeletonBox height={100} borderRadius={20} />
        <SkeletonBox height={80} borderRadius={20} />
      </ScreenShell>
    );
  }

  if (!stay) {
    return (
      <ScreenShell
        showBack
        titleText="호캉스 정보를 찾을 수 없어요"
        subtitle="다른 호텔을 탐색해 보세요."
      >
        {null}
      </ScreenShell>
    );
  }

  const directionsDisabled = !isValidCoordinate(stay.latitude, stay.longitude);
  const ratings: Array<{ kind: 'naver' | 'google'; rating: StayRating }> = [];
  if (stay.naverRating && Number.isFinite(stay.naverRating.score)) {
    ratings.push({ kind: 'naver', rating: stay.naverRating });
  }
  if (stay.googleRating && Number.isFinite(stay.googleRating.score)) {
    ratings.push({ kind: 'google', rating: stay.googleRating });
  }
  const capturedAt = formatCapturedAt(stay.ratingCapturedAt);
  const bookingQuery = resolveBookingQuery(stay.name, stay.bookingQueryOverride);
  const trimmedAddress = stay.address.trim();
  const hasAddress = trimmedAddress.length > 0;
  const videos = content?.videos ?? [];
  const blogs = content?.blogs ?? [];

  const handleDirections = () => {
    if (directionsDisabled) {
      showToast(DIRECTIONS_DISABLED_MESSAGE);
      return;
    }
    openNaverNavigation({
      latitude: stay.latitude,
      longitude: stay.longitude,
      name: stay.name,
    });
  };

  const handleBook = () => {
    openTripcomHotel({
      name: stay.name,
      queryOverride: stay.bookingQueryOverride,
      tripcomBookingUrl: stay.tripcomBookingUrl,
    });
  };

  return (
    <ScreenShell
      showBack
      hideTitleHeader
    >
      <SpotHeroCard
        badge={formatStayTypeBadge(stay.stayType)}
        title={stay.name}
        description={stay.shortTagline}
        imageSource={stay.thumbnailUrl ? { uri: stay.thumbnailUrl } : undefined}
        infoPills={buildInfoPills(stay)}
        tone="ink"
        primaryButton={{ label: '예약하기 →', onPress: handleBook }}
        secondaryButton={{ label: '길찾기', onPress: handleDirections }}
      />

      {videos.length > 0 ? (
        <StoriesSection
          sectionTitle="관련 영상"
          videos={videos}
          blogs={[]}
          testID="stay-stories-videos"
        />
      ) : null}

      {blogs.length > 0 ? (
        <StoriesSection
          sectionTitle="블로그 후기"
          videos={[]}
          blogs={blogs}
          testID="stay-stories-blogs"
        />
      ) : null}

      {stay.recommendationPoints.length > 0 ? (
        <SectionCard title="추천 포인트">
          {stay.recommendationPoints.map((point, idx) => (
            <View key={`${idx}-${point}`} style={styles.pointRow}>
              <View style={styles.pointNumber}>
                <Text style={styles.pointNumberText}>{idx + 1}</Text>
              </View>
              <Text style={styles.pointText}>{point}</Text>
            </View>
          ))}
        </SectionCard>
      ) : null}

      {ratings.length > 0 ? (
        <SectionCard title="평점">
          {ratings.map(({ kind, rating }) => (
            <Pressable
              key={kind}
              testID={`stay-rating-${kind}`}
              onPress={() => openExternalHttpUrl(rating.url)}
              style={styles.ratingRow}
            >
              <View style={styles.ratingLeft}>
                <Text style={styles.ratingStar}>★</Text>
                <Text style={styles.ratingScore}>{rating.score.toFixed(1)}</Text>
                <Text style={styles.ratingSource}>{RATING_LABELS[kind]} 리뷰 보기</Text>
              </View>
              <Text style={styles.ratingArrow}>›</Text>
            </Pressable>
          ))}
          {capturedAt ? <Text style={styles.ratingMeta}>· {capturedAt} 수집 기준</Text> : null}
        </SectionCard>
      ) : null}

      <SectionCard title="예약·찾아가기">
        {hasAddress ? (
          <>
            <Text style={styles.addressText}>📍 {trimmedAddress}</Text>
            <Pressable
              testID="stay-detail-map"
              onPress={() => {
                openNaverMapPlace(trimmedAddress);
              }}
              style={styles.outlineButton}
            >
              <Text style={styles.outlineButtonText}>네이버 지도에서 보기 →</Text>
            </Pressable>
          </>
        ) : null}
        <Text style={styles.bookingQueryLabel}>trip.com 검색어: "{bookingQuery}"</Text>
        <Pressable testID="stay-detail-book" onPress={handleBook} style={styles.primaryButton}>
          <Text style={styles.primaryButtonText}>trip.com에서 호텔 예약하기 →</Text>
        </Pressable>
      </SectionCard>

      <NativeSpotAd />

      {stay.description ? (
        <SectionCard title="소개">
          <Text style={styles.bodyText}>{stay.description}</Text>
        </SectionCard>
      ) : null}
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  addressText: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 10,
  },
  bodyText: {
    color: colors.text,
    fontSize: 15,
    lineHeight: 22,
  },
  bookingQueryLabel: {
    color: colors.textMuted,
    fontSize: 12,
    marginBottom: 8,
    marginTop: 4,
  },
  outlineButton: {
    alignItems: 'center',
    backgroundColor: colors.background,
    borderColor: colors.border,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 12,
    paddingVertical: 14,
  },
  outlineButtonText: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '700',
  },
  pointNumber: {
    alignItems: 'center',
    backgroundColor: colors.surfaceGreen,
    borderRadius: 999,
    height: 26,
    justifyContent: 'center',
    width: 26,
  },
  pointNumberText: {
    color: colors.primaryDeep,
    fontSize: 13,
    fontWeight: '700',
  },
  pointRow: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: 12,
    paddingVertical: 8,
  },
  pointText: {
    color: colors.text,
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 20,
  },
  primaryButton: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: 14,
    paddingVertical: 14,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  ratingArrow: {
    color: colors.textMuted,
    fontSize: 18,
    fontWeight: '600',
  },
  ratingLeft: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  ratingMeta: {
    color: colors.textMuted,
    fontSize: 12,
    marginTop: 8,
  },
  ratingRow: {
    alignItems: 'center',
    borderBottomColor: colors.border,
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  ratingScore: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '700',
  },
  ratingSource: {
    color: colors.textMuted,
    fontSize: 13,
    marginLeft: 4,
  },
  ratingStar: {
    color: colors.accentGold,
    fontSize: 16,
    fontWeight: '700',
  },
});
