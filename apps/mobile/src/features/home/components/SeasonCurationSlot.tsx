import { useRouter } from 'expo-router';
import { ImageBackground, Pressable, StyleSheet, Text, View } from 'react-native';

import type { HomeCurationSlot } from '../../../shared/data/types';
import { isInternalAppRoute } from '../../../shared/lib/internalRoute';
import { colors } from '../../../shared/theme/colors';

const BADGE_LABEL = '시즌 큐레이션';

type SeasonCurationSlotProps = {
  slot: HomeCurationSlot;
  testID?: string;
};

export function SeasonCurationSlot({ slot, testID = 'season-curation-slot' }: SeasonCurationSlotProps) {
  const router = useRouter();

  const handlePress = () => {
    if (!isInternalAppRoute(slot.ctaRoute)) {
      console.warn('[SeasonCurationSlot] 차단된 cta_route:', slot.ctaRoute);
      return;
    }
    try {
      router.push(slot.ctaRoute as string as never);
    } catch (err) {
      console.warn('[SeasonCurationSlot] router.push 실패', err);
    }
  };

  const subtitle = slot.subtitle?.trim();

  const inner = (
    <View style={styles.inner}>
      <View style={styles.badge}>
        <Text style={styles.badgeText}>{BADGE_LABEL}</Text>
      </View>
      <View style={styles.stack}>
        <Text style={styles.title}>{slot.title}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>
      <View style={styles.ctaRow}>
        <View style={styles.ctaPill}>
          <Text style={styles.ctaText}>{slot.ctaLabel}</Text>
        </View>
      </View>
    </View>
  );

  return (
    <Pressable testID={testID} onPress={handlePress} style={styles.card}>
      {slot.coverImageUrl ? (
        <ImageBackground
          source={{ uri: slot.coverImageUrl }}
          imageStyle={styles.imageInner}
          style={styles.image}
        >
          <View style={styles.shade} />
          {inner}
        </ImageBackground>
      ) : (
        inner
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    backgroundColor: colors.inkDeep,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  card: {
    backgroundColor: colors.inkDeep,
    borderRadius: 28,
    height: 220,
    marginBottom: 22,
    overflow: 'hidden',
  },
  ctaPill: {
    backgroundColor: '#FFFFFF',
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  ctaRow: {
    alignItems: 'flex-end',
  },
  ctaText: {
    color: colors.inkDeep,
    fontSize: 13,
    fontWeight: '800',
  },
  image: {
    flex: 1,
  },
  imageInner: {
    borderRadius: 28,
  },
  inner: {
    flex: 1,
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingVertical: 16,
  },
  shade: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(10, 8, 6, 0.42)',
  },
  stack: {
    gap: 4,
  },
  subtitle: {
    color: 'rgba(255, 255, 255, 0.88)',
    fontSize: 13,
    textShadowColor: 'rgba(0, 0, 0, 0.35)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.5,
    lineHeight: 28,
    textShadowColor: 'rgba(0, 0, 0, 0.35)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
});
