import type { ReactNode } from 'react';
import { useRouter } from 'expo-router';
import type { ImageSourcePropType } from 'react-native';
import { ImageBackground, Pressable, StyleSheet, Text, View } from 'react-native';

import {
  getPublishedSpotBySlug,
  getPublishedSpots,
} from '../../../shared/data/spotRepository';
import { openNaverNavigation } from '../../../shared/lib/naverMap';
import { colors } from '../../../shared/theme/colors';
import { spotImages } from '../../../shared/mocks/spotAssets';
import { BloomArt } from '../../../shared/ui/BloomArt';
import { SectionCard } from '../../../shared/ui/SectionCard';
import { ScreenShell } from '../../../shared/ui/ScreenShell';

type SpotDetailScreenProps = {
  slug: string;
};

export function SpotDetailScreen({ slug }: SpotDetailScreenProps) {
  const router = useRouter();
  const featuredSpots = getPublishedSpots();
  const spot = getPublishedSpotBySlug(slug) ?? featuredSpots[0];

  return (
    <ScreenShell title={spot.place} subtitle={`${spot.flower} · ${spot.location}`}>
      <ImageHero fallbackTone={spot.tone} imageSource={spotImages[spot.slug]}>
        <View style={styles.heroGlowTop} />
        <View style={styles.heroGlowBottom} />
        <View style={styles.heroBadge}>
          <Text style={styles.heroBadgeText}>{spot.badge}</Text>
        </View>
        <View style={styles.heroBody}>
          <View style={styles.heroCopy}>
            <Text style={styles.heroTitle}>{spot.place}</Text>
            <Text style={styles.heroMeta}>
              {spot.flower} · {spot.bloomStatus}
            </Text>
            <Text style={styles.heroDescription}>{spot.description}</Text>
            <View style={styles.heroActions}>
              <Pressable
                onPress={() =>
                  openNaverNavigation({
                    latitude: spot.latitude,
                    longitude: spot.longitude,
                    name: spot.place,
                  })
                }
                style={styles.heroPrimaryButton}
              >
                <Text style={styles.heroPrimaryButtonText}>길찾기</Text>
              </Pressable>
              <Pressable onPress={() => router.push('/map')} style={styles.heroSecondaryButton}>
                <Text style={styles.heroSecondaryButtonText}>지도에서 보기</Text>
              </Pressable>
            </View>
          </View>
          <View style={styles.heroArt}>
            {!spotImages[spot.slug] ? <BloomArt size="lg" tone={spot.tone} /> : null}
          </View>
        </View>
      </ImageHero>

      <View style={styles.metaRow}>
        <MetaPill label="축제 일정" value={spot.festivalDate} />
        <MetaPill label="입장료" value={spot.fee} />
      </View>

      <SectionCard title="방문 정보">
        <DetailRow label="주소" value={spot.location} />
        <DetailRow label="주차" value={spot.parking} />
        <DetailRow label="행사 상태" value={spot.eventEndsIn ? `${spot.eventEndsIn} · 종료 전 방문 추천` : '상시 방문 가능'} />
      </SectionCard>

      <SectionCard title="소개">
        <Text style={styles.bodyText}>{spot.description}</Text>
        <Text style={styles.supportText}>{spot.helper}</Text>
      </SectionCard>

      <SectionCard title="운영 팁">
        <DetailTip text="주말 오후보다 평일 오전이 비교적 한산한 편이에요." />
        <DetailTip text="대표 포토 포인트는 입구보다 안쪽 산책로 구간에 몰려 있어요." />
        <DetailTip text="축제 기간에는 도보 이동 중심으로 동선을 잡는 편이 편합니다." />
      </SectionCard>

      <SectionCard title="비슷한 꽃 명소">
        {featuredSpots
          .filter((item) => item.id !== spot.id)
          .map((item) => (
            <Pressable key={item.id} onPress={() => router.push(`/spot/${item.slug}`)} style={styles.relatedItem}>
              <View>
                <Text style={styles.relatedTitle}>{item.place}</Text>
                <Text style={styles.relatedMeta}>
                  {item.flower} · {item.location}
                </Text>
              </View>
              <Text style={styles.relatedAction}>보기</Text>
            </Pressable>
          ))}
      </SectionCard>
    </ScreenShell>
  );
}

function ImageHero({
  children,
  fallbackTone,
  imageSource,
}: {
  children: ReactNode;
  fallbackTone: 'green' | 'pink' | 'yellow';
  imageSource?: ImageSourcePropType;
}) {
  if (imageSource) {
    return (
      <ImageBackground imageStyle={styles.heroImageInner} source={imageSource} style={styles.heroImage}>
        <View style={styles.heroImageShade} />
        <View style={styles.heroImageContent}>{children}</View>
      </ImageBackground>
    );
  }

  return (
    <View
      style={[
        styles.hero,
        fallbackTone === 'pink'
          ? styles.heroPink
          : fallbackTone === 'yellow'
            ? styles.heroYellow
            : styles.heroGreen,
      ]}
    >
      {children}
    </View>
  );
}

function MetaPill({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.metaPill}>
      <Text style={styles.metaPillLabel}>{label}</Text>
      <Text numberOfLines={2} style={styles.metaPillValue}>
        {value}
      </Text>
    </View>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value}</Text>
    </View>
  );
}

function DetailTip({ text }: { text: string }) {
  return (
    <View style={styles.tipRow}>
      <View style={styles.tipDot} />
      <Text style={styles.tipText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  bodyText: {
    color: colors.text,
    fontSize: 15,
    lineHeight: 22,
  },
  detailLabel: {
    color: colors.textMuted,
    fontSize: 13,
    marginBottom: 4,
  },
  detailRow: {
    borderBottomColor: colors.border,
    borderBottomWidth: 1,
    paddingVertical: 12,
  },
  detailValue: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '600',
    lineHeight: 22,
  },
  hero: {
    borderRadius: 28,
    marginBottom: 16,
    overflow: 'hidden',
    padding: 22,
    position: 'relative',
  },
  heroArt: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 138,
  },
  heroActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 18,
  },
  heroBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  heroBadgeText: {
    color: colors.text,
    fontSize: 12,
    fontWeight: '700',
  },
  heroBody: {
    flexDirection: 'row',
  },
  heroCopy: {
    flex: 1,
    paddingRight: 10,
  },
  heroDescription: {
    color: '#FFF9F3',
    fontSize: 15,
    lineHeight: 22,
    marginTop: 10,
  },
  heroGreen: {
    backgroundColor: colors.surfaceGreen,
  },
  heroGlowBottom: {
    backgroundColor: 'rgba(255,255,255,0.22)',
    borderRadius: 999,
    bottom: -36,
    height: 130,
    position: 'absolute',
    right: 52,
    width: 130,
  },
  heroGlowTop: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 999,
    height: 170,
    position: 'absolute',
    right: -30,
    top: -24,
    width: 170,
  },
  heroImage: {
    borderRadius: 28,
    marginBottom: 16,
    minHeight: 340,
    overflow: 'hidden',
  },
  heroImageContent: {
    padding: 22,
  },
  heroImageInner: {
    borderRadius: 28,
  },
  heroImageShade: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(28, 24, 24, 0.28)',
  },
  heroMeta: {
    color: '#FFF4F6',
    fontSize: 14,
    fontWeight: '600',
    marginTop: 10,
  },
  heroPink: {
    backgroundColor: colors.softPink,
  },
  heroPrimaryButton: {
    backgroundColor: colors.primaryDeep,
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 11,
  },
  heroPrimaryButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  heroSecondaryButton: {
    backgroundColor: 'rgba(255,255,255,0.88)',
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 11,
  },
  heroSecondaryButtonText: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '700',
  },
  heroTitle: {
    color: '#FFFFFF',
    fontSize: 30,
    fontWeight: '700',
    letterSpacing: -0.5,
    lineHeight: 36,
    marginTop: 14,
  },
  heroYellow: {
    backgroundColor: '#FFF2BF',
  },
  metaPill: {
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderRadius: 20,
    borderWidth: 1,
    flex: 1,
    padding: 14,
  },
  metaPillLabel: {
    color: colors.textMuted,
    fontSize: 12,
    marginBottom: 6,
  },
  metaPillValue: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '700',
    lineHeight: 21,
  },
  metaRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  relatedAction: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '700',
  },
  relatedItem: {
    alignItems: 'center',
    borderBottomColor: colors.border,
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  relatedMeta: {
    color: colors.textMuted,
    fontSize: 13,
    marginTop: 4,
  },
  relatedTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '700',
  },
  supportText: {
    color: colors.textMuted,
    fontSize: 14,
    lineHeight: 20,
    marginTop: 10,
  },
  tipDot: {
    backgroundColor: colors.primary,
    borderRadius: 999,
    height: 8,
    marginTop: 8,
    width: 8,
  },
  tipRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 10,
  },
  tipText: {
    color: colors.text,
    flex: 1,
    fontSize: 14,
    lineHeight: 21,
  },
});
