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

      {/* 상단: 뱃지만 */}
      <View style={styles.topSection}>
        <View style={styles.topRow}>
          <View style={[styles.badgePill, isEnded && styles.badgePillEnded]}>
            <Text style={[styles.badgeText, isEnded && styles.badgeTextEnded]}>{badge}</Text>
          </View>
          {metaRight ? <Text style={[styles.metaRight, !hasImage && styles.metaRightDark]}>{metaRight}</Text> : null}
        </View>
      </View>

      {/* 뱃지와 오버레이 사이 공간 */}
      {hasImage && <View style={styles.imageSpacer} />}

      {/* 하단: pills + 타이틀 + 설명 + 버튼 */}
      <View style={[styles.body, hasImage ? styles.bodyOverlay : styles.bodyNoImage]}>
        {infoPills && infoPills.length > 0 && (
          <View style={styles.pillsRow}>
            {infoPills.map((pill) => (
              <View key={pill} style={[styles.infoPill, hasImage && styles.infoPillOnImage]}>
                <Text style={[styles.infoPillText, hasImage && styles.infoPillTextOnImage]}>{pill}</Text>
              </View>
            ))}
          </View>
        )}

        <Text style={[styles.title, !hasImage && styles.titleDark]}>{title}</Text>
        <Text style={[styles.description, !hasImage && styles.descriptionDark]}>{description}</Text>

        <View style={styles.descriptionSpacer} />

        <View style={styles.actions}>
          <Pressable onPress={secondaryButton.onPress} style={[styles.secondaryButton, !hasImage && styles.secondaryButtonDark]}>
            <Text style={styles.secondaryButtonText}>{secondaryButton.label}</Text>
          </Pressable>
          <Pressable onPress={primaryButton.onPress} style={styles.primaryButton}>
            <Text style={styles.primaryButtonText}>{primaryButton.label}</Text>
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
    backgroundColor: colors.primary,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  badgePillEnded: {
    backgroundColor: '#EDE8E4',
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  badgeTextEnded: {
    color: '#8C7060',
  },
  body: {
    width: '100%',
  },
  bodyNoImage: {
    flex: 1,
  },
  bodyOverlay: {
    backgroundColor: 'rgba(18, 14, 12, 0.62)',
    borderRadius: 20,
    minHeight: 300,
    padding: 16,
  },
  descriptionSpacer: {
    flex: 1,
  },
  imageSpacer: {
    flex: 1,
    minHeight: 16,
  },
  card: {
    borderRadius: 34,
    marginBottom: 12,
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
    backgroundColor: '#FFF8DC',
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
  imageInner: {
    borderRadius: 34,
  },
  infoPill: {
    backgroundColor: colors.softYellow,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  infoPillOnImage: {
    backgroundColor: '#FFFFFF',
    borderColor: 'transparent',
    borderWidth: 0,
  },
  infoPillText: {
    color: colors.text,
    fontSize: 12,
    fontWeight: '600',
  },
  infoPillTextOnImage: {
    color: colors.secondaryDeep,
  },
  metaRight: {
    color: '#FFFFFF',
    flexShrink: 1,
    fontSize: 13,
    fontWeight: '700',
    marginLeft: 12,
    textAlign: 'right',
  },
  metaRightDark: {
    color: colors.primaryDeep,
  },
  pillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 8,
  },
  primaryButton: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: 999,
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  secondaryButton: {
    backgroundColor: '#FFFFFF',
    borderColor: colors.border,
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  secondaryButtonDark: {
    backgroundColor: colors.card,
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
    marginTop: 4,
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
  topSection: {
    zIndex: 1,
  },
});
