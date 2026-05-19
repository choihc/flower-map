import { useMemo } from 'react';
import { useRouter } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';

import { getTopSpots, spotKeys } from '../../../shared/data/spotRepository';
import { getPublishedStays, stayKeys } from '../../../shared/data/stayRepository';
import { isValidCoordinate } from '../../../shared/lib/coordinate';
import { DIRECTIONS_DISABLED_MESSAGE, openNaverNavigation } from '../../../shared/lib/naverMap';
import { showToast } from '../../../shared/lib/toast';
import { colors } from '../../../shared/theme/colors';
import { StayCard } from '../../stays/components/StayCard';
import { openNaverHotelSearch } from '../../stays/lib/naverHotel';
import { staysDetailPath } from '../../stays/routes';
import { rankStaysForHome } from '../lib/rankStays';

const HOCANCE_TOP_N_SPOTS = 10;

export function HocanceTop5Section() {
  const router = useRouter();
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
          const directionsDisabled = !isValidCoordinate(stay.latitude, stay.longitude);
          return (
            <StayCard
              key={stay.id}
              stay={stay}
              boostBadge={boostReason}
              directionsDisabled={directionsDisabled}
              onPress={() => router.push(staysDetailPath(stay.slug))}
              onPressDirections={() => {
                if (directionsDisabled) {
                  showToast(DIRECTIONS_DISABLED_MESSAGE);
                  return;
                }
                openNaverNavigation({
                  name: stay.name,
                  latitude: stay.latitude,
                  longitude: stay.longitude,
                });
              }}
              onPressBook={() =>
                openNaverHotelSearch({ name: stay.name, queryOverride: stay.bookingQueryOverride })
              }
            />
          );
        })}
      </View>
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
