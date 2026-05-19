import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { StyleSheet, Text, View } from 'react-native';

import { getPublishedStays, stayKeys } from '../../../shared/data/stayRepository';
import { isValidCoordinate } from '../../../shared/lib/coordinate';
import { DIRECTIONS_DISABLED_MESSAGE, openNaverNavigation } from '../../../shared/lib/naverMap';
import { showToast } from '../../../shared/lib/toast';
import { NativeSpotAd } from '../../../shared/ui/NativeSpotAd';
import { ScreenShell } from '../../../shared/ui/ScreenShell';
import { SkeletonBox } from '../../../shared/ui/SkeletonBox';
import { colors } from '../../../shared/theme/colors';
import { StayCard } from '../components/StayCard';
import { openAgodaHotelSearch } from '../lib/affiliateHotel';

export function StayListScreen() {
  const router = useRouter();
  const { data: stays = [], isLoading } = useQuery({
    queryKey: stayKeys.all,
    queryFn: getPublishedStays,
  });

  if (isLoading) {
    return (
      <ScreenShell title="호캉스" subtitle="이번 주말 어디로 떠날까">
        <SkeletonBox height={320} borderRadius={24} />
        <SkeletonBox height={320} borderRadius={24} />
        <SkeletonBox height={320} borderRadius={24} />
      </ScreenShell>
    );
  }

  if (stays.length === 0) {
    return (
      <ScreenShell title="호캉스" subtitle="준비 중인 큐레이션이에요">
        <Text style={styles.emptyText}>곧 새로운 큐레이션이 올라올 거예요.</Text>
      </ScreenShell>
    );
  }

  return (
    <ScreenShell title="호캉스" subtitle="이번 주말 어디로 떠날까">
      <View style={styles.intro}>
        <Text style={styles.introText}>{stays.length}곳을 큐레이션했어요</Text>
      </View>
      {stays.map((stay, idx) => {
        const directionsDisabled = !isValidCoordinate(stay.latitude, stay.longitude);
        return (
          <View key={stay.id}>
            <StayCard
              stay={stay}
              directionsDisabled={directionsDisabled}
              onPress={() => router.push(`/stays/${stay.slug}` as never)}
              onPressDirections={() => {
                if (directionsDisabled) {
                  showToast(DIRECTIONS_DISABLED_MESSAGE);
                  return;
                }
                openNaverNavigation({
                  latitude: stay.latitude,
                  longitude: stay.longitude,
                  name: stay.name,
                });
              }}
              onPressBook={() =>
                openAgodaHotelSearch({ name: stay.name, queryOverride: stay.bookingQueryOverride })
              }
            />
            {(idx + 1) % 3 === 0 && idx < stays.length - 1 ? <NativeSpotAd /> : null}
          </View>
        );
      })}
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
