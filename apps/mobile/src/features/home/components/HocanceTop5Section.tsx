import { useMemo, useState } from 'react';
import { useRouter } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';

import { getTopSpots, spotKeys } from '../../../shared/data/spotRepository';
import { getPublishedStays, stayKeys } from '../../../shared/data/stayRepository';
import type { Stay } from '../../../shared/data/types';
import { formatProximity } from '../../../shared/lib/proximityLabel';
import { colors } from '../../../shared/theme/colors';
import { BookingProviderSheet } from '../../stays/components/BookingProviderSheet';
import { StayCard } from '../../stays/components/StayCard';
import { staysDetailPath } from '../../stays/routes';
import { rankStaysForHome } from '../lib/rankStays';

const HOCANCE_TOP_N_SPOTS = 10;

export function HocanceTop5Section() {
  const router = useRouter();
  const [bookingStay, setBookingStay] = useState<Stay | null>(null);
  const { data: stays = [] } = useQuery({
    queryKey: stayKeys.all,
    queryFn: getPublishedStays,
  });
  const { data: topSpots = [] } = useQuery({
    queryKey: spotKeys.top(HOCANCE_TOP_N_SPOTS),
    queryFn: () => getTopSpots(HOCANCE_TOP_N_SPOTS),
  });

  const ranked = useMemo(() => rankStaysForHome(stays, topSpots), [stays, topSpots]);

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
