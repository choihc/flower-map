import { Image, Pressable, StyleSheet, Text, View } from 'react-native';

import type { Stay, StayRating } from '../../../shared/data/types';
import { colors } from '../../../shared/theme/colors';
import { formatStayTypeBadge } from '../lib/stayType';

export type StayCardProps = {
  stay: Stay;
  onPress: () => void;
  onPressBook: () => void;
  boostBadge?: { label: string } | null;
};

const TAG_TONE_BG = [colors.surfaceGreen, colors.softPink];
const TAG_TONE_FG = ['#2E6B35', '#8B3A4A'];

const TYPE_BADGE_BG = 'rgba(31, 41, 51, 0.92)';

function isValidRating(r: StayRating | null): r is StayRating {
  return r !== null && Number.isFinite(r.score);
}

function pickTopRating(stay: Stay): StayRating | null {
  const candidates = [stay.naverRating, stay.googleRating].filter(isValidRating);
  if (candidates.length === 0) return null;
  return candidates.reduce((a, b) => (a.score >= b.score ? a : b));
}

export function StayCard({ stay, onPress, onPressBook, boostBadge }: StayCardProps) {
  const tags = stay.seasonTags.slice(0, 2);
  const rating = pickTopRating(stay);
  const showBoost = boostBadge != null && boostBadge.label.length > 0;

  return (
    <Pressable testID="stay-card" onPress={onPress} style={styles.card}>
      <View style={styles.hero}>
        {stay.thumbnailUrl ? (
          <Image
            testID="stay-card-thumbnail"
            resizeMode="cover"
            source={{ uri: stay.thumbnailUrl }}
            style={styles.heroImage}
          />
        ) : (
          <View style={[styles.heroImage, styles.heroPlaceholder]} />
        )}
        <View style={styles.typeBadge}>
          <Text style={styles.typeBadgeText}>{formatStayTypeBadge(stay.stayType)}</Text>
        </View>
      </View>

      <View style={styles.body}>
        <View style={styles.nameRow}>
          <Text style={styles.name} numberOfLines={1}>{stay.name}</Text>
          {rating ? (
            <Text testID="stay-card-rating" style={styles.rating}>
              ★ {rating.score.toFixed(1)}
            </Text>
          ) : null}
        </View>

        <Text style={styles.region} numberOfLines={1}>
          {stay.regionPrimary} · {stay.regionSecondary}
        </Text>

        {showBoost ? (
          <Text testID="stay-card-boost-badge" style={styles.boost} numberOfLines={1}>
            🌸 {boostBadge!.label}
          </Text>
        ) : null}

        <View style={styles.ctaRow}>
          {tags.length > 0 ? (
            <View testID="stay-card-tags" style={styles.tagRow}>
              {tags.map((tag, idx) => (
                <View
                  key={tag}
                  style={[styles.tag, { backgroundColor: TAG_TONE_BG[idx] ?? colors.surfaceGreen }]}
                >
                  <Text style={[styles.tagText, { color: TAG_TONE_FG[idx] ?? colors.text }]}>{tag}</Text>
                </View>
              ))}
            </View>
          ) : <View />}
          <Pressable
            testID="stay-card-book"
            onPress={onPressBook}
            style={styles.ctaBook}
          >
            <Text style={styles.ctaBookText}>예약 →</Text>
          </Pressable>
        </View>
      </View>
    </Pressable>
  );
}

const HERO = 112;

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.background,
    borderRadius: 18,
    flexDirection: 'row',
    marginBottom: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  hero: {
    height: HERO,
    width: HERO,
    flexShrink: 0,
    position: 'relative',
  },
  heroImage: {
    height: '100%',
    width: '100%',
  },
  heroPlaceholder: {
    backgroundColor: colors.cardAlt,
  },
  typeBadge: {
    backgroundColor: TYPE_BADGE_BG,
    borderRadius: 999,
    left: 6,
    paddingHorizontal: 7,
    paddingVertical: 3,
    position: 'absolute',
    top: 6,
  },
  typeBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },
  body: {
    flex: 1,
    flexDirection: 'column',
    gap: 4,
    minWidth: 0,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  nameRow: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: 6,
    justifyContent: 'space-between',
  },
  name: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: -0.3,
    flex: 1,
  },
  rating: {
    color: colors.inkDeep,
    flexShrink: 0,
    fontSize: 11,
    fontWeight: '700',
  },
  region: {
    color: colors.textMuted,
    fontSize: 11,
  },
  boost: {
    color: '#8B3A4A',
    fontSize: 11,
    fontWeight: '700',
  },
  ctaRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 6,
    justifyContent: 'space-between',
    marginTop: 'auto',
  },
  tagRow: {
    flexDirection: 'row',
    gap: 4,
  },
  tag: {
    borderRadius: 999,
    paddingHorizontal: 7,
    paddingVertical: 3,
  },
  tagText: {
    fontSize: 10,
    fontWeight: '700',
  },
  ctaBook: {
    backgroundColor: colors.primary,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  ctaBookText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
});
