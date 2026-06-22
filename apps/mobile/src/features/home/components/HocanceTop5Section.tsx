import { useMemo, useState } from 'react';
import { useRouter } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';

import { getTopSpots, spotKeys } from '../../../shared/data/spotRepository';
import { getPublishedStays, stayKeys } from '../../../shared/data/stayRepository';
import type { Stay } from '../../../shared/data/types';
import { formatProximity } from '../../../shared/lib/proximityLabel';
import { colors } from '../../../shared/theme/colors';
import { SkeletonBox } from '../../../shared/ui/SkeletonBox';
import { BookingProviderSheet } from '../../stays/components/BookingProviderSheet';
import { StayCard } from '../../stays/components/StayCard';
import { staysDetailPath } from '../../stays/routes';
import { rankStaysForHome } from '../lib/rankStays';

const HOCANCE_TOP_N_SPOTS = 10;

export function HocanceTop5Section() {
  const router = useRouter();
  const [bookingStay, setBookingStay] = useState<Stay | null>(null);
  const staysQuery = useQuery({
    queryKey: stayKeys.all,
    queryFn: getPublishedStays,
  });
  const topSpotsQuery = useQuery({
    queryKey: spotKeys.top(HOCANCE_TOP_N_SPOTS),
    queryFn: () => getTopSpots(HOCANCE_TOP_N_SPOTS),
  });

  const stays = staysQuery.data ?? [];
  const topSpots = topSpotsQuery.data ?? [];
  const ranked = useMemo(() => rankStaysForHome(stays, topSpots), [stays, topSpots]);

  // 에러는 console.error로 관측. (FR-6) — 표시할 캐시 데이터가 있으면 가리지 않는다(아래).
  if (staysQuery.error) {
    console.error('[HocanceTop5Section] stays query error:', staysQuery.error);
  }
  if (topSpotsQuery.error) {
    console.error('[HocanceTop5Section] topSpots query error:', topSpotsQuery.error);
  }

  // 데이터가 아직 없고 의존 쿼리가 응답 전이면 자기 영역 스켈레톤. (FR-4)
  if (ranked.length === 0 && (staysQuery.isPending || topSpotsQuery.isPending)) {
    return (
      <View testID="hocance-skeleton" style={styles.container}>
        <Text style={styles.title}>꽃 명소 주변 호텔보기</Text>
        <View style={styles.list}>
          <SkeletonBox height={120} />
          <SkeletonBox height={120} />
        </View>
      </View>
    );
  }

  // 빈 결과(FR-5) 또는 데이터 없는 에러(FR-6) → 섹션 숨김.
  // 호캉스가 있으면 백그라운드 리패치 실패와 무관하게 계속 노출(SWR, FR-8).
  if (ranked.length === 0) return null;

  return (
    <View testID="hocance-top5-section" style={styles.container}>
      <Text style={styles.title}>꽃 명소 주변 호텔보기</Text>
      <View style={styles.list}>
        {ranked.map(({ stay, boostReason }) => {
          const boostBadge = boostReason
            ? { label: formatProximity(boostReason.distanceKm, boostReason.spotName) }
            : null;
          return (
            <StayCard
              key={stay.id}
              stay={stay}
              boostBadge={boostBadge}
              onPress={() => router.push(staysDetailPath(stay.slug))}
              onPressBook={() => setBookingStay(stay)}
            />
          );
        })}
      </View>
      <BookingProviderSheet stay={bookingStay} onClose={() => setBookingStay(null)} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 24,
  },
  title: {
    color: colors.text,
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: -0.4,
    marginBottom: 14,
  },
  list: {
    gap: 14,
  },
});
