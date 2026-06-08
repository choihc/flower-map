import { useState } from 'react';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { StyleSheet, Text, View } from 'react-native';

import { getPublishedSpots, spotKeys } from '../../../shared/data/spotRepository';
import { getPublishedStays, stayKeys } from '../../../shared/data/stayRepository';
import type { Stay } from '../../../shared/data/types';
import { formatProximity } from '../../../shared/lib/proximityLabel';
import { NativeSpotAd } from '../../../shared/ui/NativeSpotAd';
import { ScreenShell } from '../../../shared/ui/ScreenShell';
import { SkeletonBox } from '../../../shared/ui/SkeletonBox';
import { colors } from '../../../shared/theme/colors';
import { BookingProviderSheet } from '../components/BookingProviderSheet';
import { StayCard } from '../components/StayCard';
import { findClosestSpot } from '../lib/findClosestSpot';

export function StayListScreen() {
  const router = useRouter();
  const [bookingStay, setBookingStay] = useState<Stay | null>(null);
  const { data: stays = [], isLoading } = useQuery({
    queryKey: stayKeys.all,
    queryFn: getPublishedStays,
  });
  const { data: spots = [] } = useQuery({
    queryKey: spotKeys.all,
    queryFn: getPublishedSpots,
  });

  if (isLoading) {
    return (
      <ScreenShell titleText="호캉스">
        <SkeletonBox height={120} borderRadius={18} />
        <SkeletonBox height={120} borderRadius={18} />
        <SkeletonBox height={120} borderRadius={18} />
      </ScreenShell>
    );
  }

  if (stays.length === 0) {
    return (
      <ScreenShell titleText="호캉스" subtitle="준비 중인 큐레이션이에요">
        <Text style={styles.emptyText}>곧 새로운 큐레이션이 올라올 거예요.</Text>
      </ScreenShell>
    );
  }

  return (
    <ScreenShell titleText="호캉스">
      <View style={styles.intro}>
        <Text style={styles.introText}>{stays.length}곳을 큐레이션했어요</Text>
      </View>
      {stays.map((stay, idx) => {
        const closest = findClosestSpot(stay, spots);
        const boostBadge = closest
          ? { label: formatProximity(closest.distanceKm, closest.spot.place) }
          : null;
        return (
          <View key={stay.id}>
            <StayCard
              stay={stay}
              boostBadge={boostBadge}
              onPress={() => router.push(`/stays/${stay.slug}` as never)}
              onPressBook={() => setBookingStay(stay)}
            />
            {(idx + 1) % 10 === 0 && idx < stays.length - 1 ? <NativeSpotAd /> : null}
          </View>
        );
      })}
      <BookingProviderSheet stay={bookingStay} onClose={() => setBookingStay(null)} />
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  emptyText: {
    color: colors.textMuted,
    fontSize: 14,
    marginTop: 12,
  },
  intro: {
    marginBottom: 12,
  },
  introText: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: '600',
  },
});
