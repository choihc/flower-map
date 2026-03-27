import { useLocalSearchParams, useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { getPublishedSpots } from '../../../shared/data/spotRepository';
import { colors } from '../../../shared/theme/colors';
import { ScreenShell } from '../../../shared/ui/ScreenShell';
import { SectionCard } from '../../../shared/ui/SectionCard';

export function SpotListScreen() {
  const router = useRouter();
  const featuredSpots = getPublishedSpots();
  const { flower } = useLocalSearchParams<{ flower?: string }>();
  const activeFlower = flower && typeof flower === 'string' ? flower : null;
  const visibleSpots = activeFlower ? featuredSpots.filter((spot) => spot.flower === activeFlower) : featuredSpots;
  const title = activeFlower ? `${activeFlower} 명소 리스트` : '명소 리스트';
  const subtitle = activeFlower
    ? `${activeFlower} 명소만 모아서 빠르게 비교해보세요.`
    : '지도에서 보던 조건을 리스트로 더 빠르게 비교할 수 있어요.';
  const sectionTitle = activeFlower ? `${activeFlower} 명소 추천` : '봄꽃 명소 추천';

  return (
    <ScreenShell title={title} subtitle={subtitle}>
      <View style={styles.sortRow}>
        {['거리순', '인기순', '종료 임박순'].map((label, index) => (
          <Pressable key={label} style={[styles.sortChip, index === 0 ? styles.sortChipActive : null]}>
            <Text style={[styles.sortChipText, index === 0 ? styles.sortChipTextActive : null]}>{label}</Text>
          </Pressable>
        ))}
      </View>

      <SectionCard title={sectionTitle}>
        {visibleSpots.map((spot) => (
          <Pressable key={spot.id} onPress={() => router.push(`/spot/${spot.id}`)} style={styles.spotRow}>
            <View style={[styles.spotAccent, spot.tone === 'pink' ? styles.accentPink : spot.tone === 'yellow' ? styles.accentYellow : styles.accentGreen]} />
            <View style={styles.spotContent}>
              <Text style={styles.spotTitle}>{spot.place}</Text>
              <Text style={styles.spotMeta}>
                {spot.flower} · {spot.location}
              </Text>
              <Text style={styles.spotHelper}>{spot.helper}</Text>
            </View>
            <Text style={styles.spotAction}>보기</Text>
          </Pressable>
        ))}
      </SectionCard>
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  accentGreen: {
    backgroundColor: colors.primary,
  },
  accentPink: {
    backgroundColor: colors.secondary,
  },
  accentYellow: {
    backgroundColor: colors.warning,
  },
  sortChip: {
    backgroundColor: colors.cardAlt,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  sortChipActive: {
    backgroundColor: colors.primary,
  },
  sortChipText: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '700',
  },
  sortChipTextActive: {
    color: '#FFFFFF',
  },
  sortRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  spotAccent: {
    alignSelf: 'stretch',
    borderRadius: 999,
    width: 6,
  },
  spotAction: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: '700',
  },
  spotContent: {
    flex: 1,
  },
  spotHelper: {
    color: colors.textMuted,
    fontSize: 13,
    lineHeight: 19,
    marginTop: 4,
  },
  spotMeta: {
    color: colors.textMuted,
    fontSize: 13,
    marginTop: 4,
  },
  spotRow: {
    alignItems: 'center',
    borderBottomColor: colors.border,
    borderBottomWidth: 1,
    flexDirection: 'row',
    gap: 12,
    paddingVertical: 14,
  },
  spotTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '700',
  },
});
