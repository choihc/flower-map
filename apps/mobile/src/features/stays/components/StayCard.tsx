import { Image, Pressable, StyleSheet, Text, View } from 'react-native';

import type { Stay, StayRating } from '../../../shared/data/types';
import { colors } from '../../../shared/theme/colors';
import { isValidCoordinate } from '../lib/coordinate';
import { formatStayTypeBadge } from '../lib/stayType';

export type StayCardProps = {
  stay: Stay;
  onPress: () => void;
  onPressDirections: () => void;
  onPressBook: () => void;
};

const TAG_TONE_BG = [colors.surfaceGreen, colors.softPink, colors.softYellow];
const TAG_TONE_FG = ['#2E6B35', '#8B3A4A', '#6A5500'];

const TYPE_BADGE_BG = 'rgba(31, 41, 51, 0.92)';
const RATING_CHIP_BG = 'rgba(255, 255, 255, 0.94)';

function isValidRating(r: StayRating | null): r is StayRating {
  return r !== null && Number.isFinite(r.score);
}

function pickTopRating(stay: Stay): StayRating | null {
  const candidates = [stay.naverRating, stay.googleRating].filter(isValidRating);
  if (candidates.length === 0) return null;
  return candidates.reduce((a, b) => (a.score >= b.score ? a : b));
}

export function StayCard({ stay, onPress, onPressDirections, onPressBook }: StayCardProps) {
  const tags = stay.seasonTags.slice(0, 3);
  const rating = pickTopRating(stay);
  const coordinateValid = isValidCoordinate(stay.latitude, stay.longitude);

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
        {rating ? (
          <View testID="stay-card-rating" style={styles.ratingChip}>
            <Text style={styles.ratingStar}>★</Text>
            <Text style={styles.ratingText}>{rating.score.toFixed(1)}</Text>
          </View>
        ) : null}
      </View>

      <View style={styles.body}>
        <Text style={styles.name} numberOfLines={1}>{stay.name}</Text>
        <Text style={styles.region} numberOfLines={1}>
          {stay.regionPrimary} · {stay.regionSecondary}
        </Text>

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
        ) : null}

        <Text style={styles.tagline} numberOfLines={2}>{stay.shortTagline}</Text>
      </View>

      <View style={styles.ctaRow}>
        <Pressable
          testID="stay-card-directions"
          accessibilityState={{ disabled: !coordinateValid }}
          aria-disabled={!coordinateValid}
          onPress={() => {
            if (!coordinateValid) return;
            onPressDirections();
          }}
          style={[styles.ctaSecondary, !coordinateValid ? styles.ctaDisabled : null]}
        >
          <Text style={styles.ctaSecondaryText}>길찾기</Text>
        </Pressable>
        <Pressable
          testID="stay-card-book"
          onPress={onPressBook}
          style={styles.ctaPrimary}
        >
          <Text style={styles.ctaPrimaryText}>예약하러 가기 →</Text>
        </Pressable>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  body: {
    paddingHorizontal: 16,
    paddingTop: 14,
  },
  card: {
    backgroundColor: colors.background,
    borderRadius: 24,
    marginBottom: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },
  ctaDisabled: {
    opacity: 0.4,
  },
  ctaPrimary: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: 14,
    flex: 1.4,
    paddingVertical: 14,
  },
  ctaPrimaryText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  ctaRow: {
    flexDirection: 'row',
    gap: 8,
    paddingBottom: 14,
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  ctaSecondary: {
    alignItems: 'center',
    backgroundColor: colors.background,
    borderColor: colors.border,
    borderRadius: 14,
    borderWidth: 1,
    flex: 1,
    paddingVertical: 14,
  },
  ctaSecondaryText: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '700',
  },
  hero: {
    height: 200,
    position: 'relative',
    width: '100%',
  },
  heroImage: {
    height: '100%',
    width: '100%',
  },
  heroPlaceholder: {
    backgroundColor: colors.cardAlt,
  },
  name: {
    color: colors.text,
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  ratingChip: {
    alignItems: 'center',
    backgroundColor: RATING_CHIP_BG,
    borderRadius: 999,
    bottom: 12,
    flexDirection: 'row',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    position: 'absolute',
    right: 12,
  },
  ratingStar: {
    color: colors.accentGold,
    fontSize: 12,
    fontWeight: '700',
  },
  ratingText: {
    color: colors.inkDeep,
    fontSize: 12,
    fontWeight: '700',
  },
  region: {
    color: colors.textMuted,
    fontSize: 13,
    marginTop: 4,
  },
  tag: {
    borderRadius: 999,
    paddingHorizontal: 9,
    paddingVertical: 5,
  },
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 10,
  },
  tagText: {
    fontSize: 12,
    fontWeight: '700',
  },
  tagline: {
    color: colors.textMuted,
    fontSize: 13,
    lineHeight: 19,
    marginTop: 10,
  },
  typeBadge: {
    backgroundColor: TYPE_BADGE_BG,
    borderRadius: 999,
    left: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    position: 'absolute',
    top: 12,
  },
  typeBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
});
