import { ImageBackground, Pressable, StyleSheet, Text, View } from 'react-native';

import { colors } from '../theme/colors';

type SpotHeroCardTone = 'green' | 'pink' | 'yellow';

type SpotHeroCardProps = {
  badge: string;
  title: string;
  description: string;
  imageSource?: { uri: string };
  tone: SpotHeroCardTone;
  metaRight?: string;
  infoPills?: string[];
  primaryButton: { label: string; onPress: () => void };
  secondaryButton: { label: string; onPress: () => void };
};

export function SpotHeroCard({
  badge,
  description,
  imageSource,
  infoPills,
  metaRight,
  primaryButton,
  secondaryButton,
  title,
  tone,
}: SpotHeroCardProps) {
  const hasImage = !!imageSource;
  const isEnded = badge === '개화 종료';

  const inner = (
    <>
      {hasImage && <View style={styles.shade} />}
      <View style={styles.glowA} />
      <View style={styles.glowB} />

      <View style={styles.topRow}>
        <View style={[styles.badgePill, isEnded && styles.badgePillEnded]}>
          <Text style={[styles.badgeText, isEnded && styles.badgeTextEnded]}>{badge}</Text>
        </View>
        {metaRight ? <Text style={[styles.metaRight, !hasImage && styles.metaRightDark]}>{metaRight}</Text> : null}
      </View>

      <View style={[styles.body, hasImage && styles.bodyOverlay]}>
        <Text style={[styles.title, !hasImage && styles.titleDark]}>{title}</Text>
        <Text style={[styles.description, !hasImage && styles.descriptionDark]}>{description}</Text>

        {infoPills && infoPills.length > 0 && (
          <View style={styles.pillsRow}>
            {infoPills.map((pill) => (
              <View key={pill} style={[styles.infoPill, hasImage && styles.infoPillOnImage]}>
                <Text style={[styles.infoPillText, hasImage && styles.infoPillTextOnImage]}>{pill}</Text>
              </View>
            ))}
          </View>
        )}

        <View style={styles.actions}>
          <Pressable onPress={primaryButton.onPress} style={styles.primaryButton}>
            <Text style={styles.primaryButtonText}>{primaryButton.label}</Text>
          </Pressable>
          <Pressable onPress={secondaryButton.onPress} style={[styles.secondaryButton, !hasImage && styles.secondaryButtonDark]}>
            <Text style={styles.secondaryButtonText}>{secondaryButton.label}</Text>
          </Pressable>
        </View>
      </View>
    </>
  );

  if (hasImage) {
    return (
      <ImageBackground imageStyle={styles.imageInner} source={imageSource} style={styles.card}>
        {inner}
      </ImageBackground>
    );
  }

  return (
    <View
      style={[
        styles.card,
        tone === 'pink' ? styles.cardPink : tone === 'yellow' ? styles.cardYellow : styles.cardGreen,
      ]}
    >
      {inner}
    </View>
  );
}

const styles = StyleSheet.create({
  actions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 18,
  },
  badgePill: {
    backgroundColor: 'rgba(255, 255, 255, 0.72)',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  badgePillEnded: {
    backgroundColor: 'rgba(200, 190, 185, 0.72)',
  },
  badgeText: {
    color: colors.text,
    fontSize: 12,
    fontWeight: '700',
  },
  badgeTextEnded: {
    color: '#7A6058',
  },
  body: {
    justifyContent: 'flex-end',
    minHeight: 300,
    width: '100%',
  },
  bodyOverlay: {
    backgroundColor: 'rgba(18, 14, 12, 0.62)',
    borderRadius: 20,
    marginTop: 12,
    padding: 16,
  },
  card: {
    borderRadius: 34,
    marginBottom: 22,
    minHeight: 390,
    overflow: 'hidden',
    padding: 22,
    position: 'relative',
  },
  cardGreen: {
    backgroundColor: colors.surfaceGreen,
  },
  cardPink: {
    backgroundColor: colors.softPink,
  },
  cardYellow: {
    backgroundColor: '#FFF2BF',
  },
  description: {
    color: '#FFF9F3',
    fontSize: 15,
    lineHeight: 22,
    marginTop: 10,
    maxWidth: 300,
  },
  descriptionDark: {
    color: colors.text,
  },
  glowA: {
    backgroundColor: 'rgba(247, 214, 216, 0.28)',
    borderRadius: 999,
    height: 160,
    position: 'absolute',
    right: -30,
    top: -14,
    width: 160,
  },
  glowB: {
    backgroundColor: 'rgba(248, 234, 193, 0.18)',
    borderRadius: 999,
    bottom: -46,
    height: 124,
    position: 'absolute',
    right: 74,
    width: 124,
  },
  imageInner: {
    borderRadius: 34,
  },
  infoPill: {
    backgroundColor: 'rgba(255,255,255,0.82)',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  infoPillOnImage: {
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderColor: 'rgba(255,255,255,0.35)',
    borderWidth: 1,
  },
  infoPillTextOnImage: {
    color: '#FFFFFF',
  },
  infoPillText: {
    color: colors.text,
    fontSize: 12,
    fontWeight: '600',
  },
  metaRight: {
    color: '#FFF4F6',
    flexShrink: 1,
    fontSize: 13,
    fontWeight: '600',
    marginLeft: 12,
    textAlign: 'right',
  },
  metaRightDark: {
    color: colors.textMuted,
  },
  pillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 14,
  },
  primaryButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 11,
  },
  primaryButtonText: {
    color: colors.primaryDeep,
    fontSize: 14,
    fontWeight: '700',
  },
  secondaryButton: {
    backgroundColor: 'rgba(255,255,255,0.88)',
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 11,
  },
  secondaryButtonDark: {
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderWidth: 1,
  },
  secondaryButtonText: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '700',
  },
  shade: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(10, 8, 6, 0.12)',
  },
  title: {
    color: '#FFFFFF',
    fontSize: 34,
    fontWeight: '700',
    letterSpacing: -0.6,
    lineHeight: 40,
    marginTop: 16,
    maxWidth: 280,
  },
  titleDark: {
    color: colors.text,
  },
  topRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
});
