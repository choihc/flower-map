import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useQuery } from '@tanstack/react-query';

import {
  getPublishedSpotBySlug,
  getPublishedSpots,
  spotKeys,
} from '../../../shared/data/spotRepository';
import { openNaverNavigation } from '../../../shared/lib/naverMap';
import { resolveSpotImage } from '../../../shared/lib/resolveSpotImage';
import { colors } from '../../../shared/theme/colors';
import { SectionCard } from '../../../shared/ui/SectionCard';
import { ScreenShell } from '../../../shared/ui/ScreenShell';
import { SkeletonBox } from '../../../shared/ui/SkeletonBox';
import { SpotHeroCard } from '../../../shared/ui/SpotHeroCard';
import { NativeSpotAd } from '../../../shared/ui/NativeSpotAd';
import { LikeButton } from '../components/LikeButton';
import { SpotPhotoGallery } from '../components/SpotPhotoGallery';
import { getPhotosBySpotId, photoKeys } from '../../../shared/data/photoRepository';

type SpotDetailScreenProps = {
  slug: string;
};

export function SpotDetailScreen({ slug }: SpotDetailScreenProps) {
  const router = useRouter();
  const { data: spot, isLoading } = useQuery({
    queryKey: spotKeys.detail(slug),
    queryFn: () => getPublishedSpotBySlug(slug),
  });

  const { data: allSpots = [] } = useQuery({
    queryKey: spotKeys.all,
    queryFn: getPublishedSpots,
  });

  const { data: photos = [] } = useQuery({
    queryKey: photoKeys.bySpot(spot?.id ?? ''),
    queryFn: () => getPhotosBySpotId(spot!.id),
    enabled: spot !== undefined,
  });

  if (isLoading) {
    return (
      <ScreenShell showBack title="">
        <SkeletonBox height={280} borderRadius={28} />
        <SkeletonBox height={100} borderRadius={20} />
        <SkeletonBox height={80} borderRadius={20} />
        <SkeletonBox height={60} borderRadius={20} />
      </ScreenShell>
    );
  }

  if (!spot) {
    return (
      <ScreenShell showBack title="명소를 찾을 수 없어요" subtitle="다른 명소를 탐색해 보세요.">
        {null}
      </ScreenShell>
    );
  }

  return (
    <ScreenShell showBack title={spot.place} subtitle={`${spot.flower} · ${spot.location}`}>
      <SpotHeroCard
        badge={spot.badge}
        description={spot.description}
        imageSource={resolveSpotImage(spot) ?? undefined}
        infoPills={[spot.flower + ' · ' + spot.bloomStatus, spot.eventEndsIn ?? '상시 운영']}
        title={spot.place}
        tone={spot.tone}
        primaryButton={{
          label: '길찾기',
          onPress: () => openNaverNavigation({ latitude: spot.latitude, longitude: spot.longitude, name: spot.place }),
        }}
        secondaryButton={{ label: '지도에서 보기', onPress: () => router.push({ pathname: '/map', params: { spotSlug: slug } }) }}
      />

      <SpotPhotoGallery photos={photos} />

      <LikeButton spotId={spot.id} />

      <View style={styles.metaRow}>
        <MetaPill label="축제 일정" value={spot.festivalDate} />
        <MetaPill label="입장료" value={spot.fee} />
      </View>

      <SectionCard title="방문 정보">
        <DetailRow label="주소" value={spot.location} />
        <DetailRow label="주차" value={spot.parking} />
        <DetailRow label="행사 상태" value={spot.eventEndsIn ? `${spot.eventEndsIn} · 종료 전 방문 추천` : '상시 방문 가능'} />
      </SectionCard>

      <NativeSpotAd />

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
        {(() => {
          const related = allSpots.filter((item) => item.id !== spot.id && item.flower === spot.flower);
          if (related.length === 0) {
            return <Text style={styles.emptyText}>등록된 {spot.flower} 명소가 없어요.</Text>;
          }
          return related.map((item) => (
            <Pressable key={item.id} onPress={() => router.push(`/spot/${item.slug}`)} style={styles.relatedItem}>
              <View>
                <Text style={styles.relatedTitle}>{item.place}</Text>
                <Text style={styles.relatedMeta}>
                  {item.flower} · {item.location}
                </Text>
              </View>
              <Text style={styles.relatedAction}>보기</Text>
            </Pressable>
          ));
        })()}
      </SectionCard>
    </ScreenShell>
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
  emptyText: {
    color: colors.textMuted,
    fontSize: 14,
    paddingVertical: 8,
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
