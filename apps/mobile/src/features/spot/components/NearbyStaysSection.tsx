import { useRouter } from 'expo-router';
import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';

import { getPublishedStays, stayKeys } from '../../../shared/data/stayRepository';
import type { FlowerSpot } from '../../../shared/data/types';
import { formatProximity } from '../../../shared/lib/proximityLabel';
import { colors } from '../../../shared/theme/colors';
import { StayCard } from '../../stays/components/StayCard';
import { openTripcomHotel } from '../../stays/lib/affiliateHotel';
import { STAYS_ROUTE, staysDetailPath } from '../../stays/routes';
import { findNearbyStays } from '../lib/findNearbyStays';

const LIMIT = 3;
const PRIMARY_RADIUS_KM = 30;
const FALLBACK_RADIUS_KM = 60;

type Props = { spot: FlowerSpot };

export function NearbyStaysSection({ spot }: Props) {
  const router = useRouter();
  const { data: stays = [] } = useQuery({
    queryKey: stayKeys.all,
    queryFn: getPublishedStays,
  });

  const result = useMemo(
    () =>
      findNearbyStays(spot, stays, {
        limit: LIMIT,
        primaryRadiusKm: PRIMARY_RADIUS_KM,
        fallbackRadiusKm: FALLBACK_RADIUS_KM,
      }),
    [spot, stays],
  );

  if (result.stays.length === 0) return null;

  const radiusKm = result.usedFallback ? FALLBACK_RADIUS_KM : PRIMARY_RADIUS_KM;
  const radiusLabel = `${spot.place} ${radiusKm}km 이내`;

  // 후보가 limit 이상이면 잘림 가능성으로 간주해 더보기 노출 (스펙 §6.1 단순화)
  const showMore = result.stays.length >= LIMIT;

  return (
    <View testID="nearby-stays-section" style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>주변 호텔</Text>
        <View style={styles.radiusChip}>
          <Text style={styles.radiusChipText} numberOfLines={1}>{radiusLabel}</Text>
        </View>
      </View>

      <View style={styles.list}>
        {result.stays.map(({ stay, distanceKm }) => (
          <StayCard
            key={stay.id}
            stay={stay}
            boostBadge={{ label: formatProximity(distanceKm, '이 명소') }}
            onPress={() => router.push(staysDetailPath(stay.slug))}
            onPressBook={() =>
              void openTripcomHotel({
                name: stay.name,
                queryOverride: stay.bookingQueryOverride,
                tripcomBookingUrl: stay.tripcomBookingUrl,
              })
            }
          />
        ))}
      </View>

      {showMore ? (
        <Pressable
          testID="nearby-stays-more"
          onPress={() => router.push(STAYS_ROUTE as never)}
          style={styles.moreButton}
        >
          <Text style={styles.moreText}>더보기 →</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 22,
  },
  header: {
    alignItems: 'baseline',
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  title: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  radiusChip: {
    backgroundColor: colors.softPink,
    borderRadius: 999,
    paddingHorizontal: 9,
    paddingVertical: 3,
    flexShrink: 1,
  },
  radiusChipText: {
    color: '#8B3A4A',
    fontSize: 11,
    fontWeight: '700',
  },
  list: {
    gap: 10,
  },
  moreButton: {
    alignSelf: 'flex-end',
    paddingHorizontal: 8,
    paddingVertical: 10,
  },
  moreText: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '700',
  },
});
