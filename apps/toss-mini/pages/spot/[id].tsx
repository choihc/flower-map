import { Badge, Icon, Loader, PageNavbar } from '@toss/tds-react-native';
import { useQuery } from '@tanstack/react-query';
import { createRoute, openURL } from '@granite-js/react-native';
import React from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { getSpotById } from '@flower-map/flower-domain';

import { BloomArt } from '../../src/shared/components/BloomArt';
import { useStorage } from '../../src/shared/hooks/useStorage';

const TONE_BG: Record<string, string> = {
  pink: '#FBE8F0',
  yellow: '#FBF0C0',
  green: '#E8F5E9',
};

export const Route = createRoute('/spot/:id', {
  validateParams: (params) => params as { id: string },
  component: SpotDetailPage,
});

function SpotDetailPage() {
  const { id } = Route.useParams();
  const { isSaved, save, remove } = useStorage();

  const { data: spot, isPending, isError } = useQuery({
    queryKey: ['spot', id],
    queryFn: () => getSpotById(id),
    enabled: Boolean(id),
  });

  const handleDirections = () => {
    if (!spot) return;
    const url = `nmap://route/walk?dlat=${spot.latitude}&dlng=${spot.longitude}&dname=${encodeURIComponent(spot.place)}&appname=flower-map`;
    openURL(url).catch(() => {
      const kakaoUrl = `kakaomap://route?ep=${spot.latitude},${spot.longitude}&by=FOOT`;
      openURL(kakaoUrl);
    });
  };

  const handleSaveToggle = () => {
    if (!spot) return;
    if (isSaved(spot.id)) {
      remove(spot.id);
    } else {
      save(spot.id);
    }
  };

  if (isPending) {
    return (
      <View style={styles.center}>
        <Loader size="large" type="primary" />
      </View>
    );
  }

  if (isError || !spot) {
    return (
      <View style={styles.center}>
        <PageNavbar><PageNavbar.Title>명소 상세</PageNavbar.Title></PageNavbar>
        <Text style={styles.errorText}>명소 정보를 불러올 수 없습니다.</Text>
      </View>
    );
  }

  const saved = isSaved(spot.id);

  return (
    <View style={styles.page}>
      <PageNavbar>
        <PageNavbar.Title>{spot.place}</PageNavbar.Title>
      </PageNavbar>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {(spot.thumbnailUrl ?? spot.flowerThumbnailUrl) ? (
          <Image
            source={{ uri: (spot.thumbnailUrl ?? spot.flowerThumbnailUrl)! }}
            style={styles.image}
            resizeMode="cover"
          />
        ) : (
          <View style={[styles.image, styles.imagePlaceholder, { backgroundColor: TONE_BG[spot.tone] ?? '#FBE8F0' }]}>
            <BloomArt size="lg" tone={spot.tone} />
          </View>
        )}

        <View style={styles.body}>
          <View style={styles.badgeRow}>
            <Badge size="small" type="red" badgeStyle="weak">{spot.flower}</Badge>
            <Badge size="small" type="elephant" badgeStyle="weak">{spot.badge}</Badge>
          </View>

          <Text style={styles.place}>{spot.place}</Text>
          <Text style={styles.meta}>{spot.location} · {spot.bloomStatus}</Text>
          <Text style={styles.period}>🌸 {spot.bloomStartAt} ~ {spot.bloomEndAt}</Text>

          {spot.description ? <Text style={styles.description}>{spot.description}</Text> : null}

          {spot.helper ? (
            <View style={styles.tipBox}>
              <Text style={styles.tipText}>💡 {spot.helper}</Text>
            </View>
          ) : null}

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>입장료</Text>
            <Text style={styles.infoValue}>{spot.fee}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>주차</Text>
            <Text style={styles.infoValue}>{spot.parking}</Text>
          </View>

          <View style={styles.actions}>
            <Pressable style={styles.btnDirections} onPress={handleDirections}>
              <Icon name="icon-map-mono" size={20} color="#FFFFFF" />
              <Text style={styles.btnDirectionsText}>길찾기</Text>
            </Pressable>
            <Pressable
              style={[styles.btnSave, saved && styles.btnSaveActive]}
              onPress={handleSaveToggle}
            >
              <Icon
                name="icon-heart-mono"
                size={20}
                color={saved ? '#FFFFFF' : '#C45C7E'}
              />
              <Text style={[styles.btnSaveText, saved && styles.btnSaveTextActive]}>
                {saved ? '저장됨' : '저장하기'}
              </Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: '#FFF5F8' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  scrollContent: { paddingBottom: 32 },
  image: { width: '100%', height: 260 },
  imagePlaceholder: { alignItems: 'center', justifyContent: 'center' },
  body: { padding: 20, gap: 12 },
  badgeRow: { flexDirection: 'row', gap: 8 },
  place: { fontSize: 24, fontWeight: '800', color: '#3D1A27' },
  meta: { fontSize: 14, color: '#8B5A6E' },
  period: { fontSize: 13, color: '#C45C7E' },
  description: { fontSize: 15, color: '#333', lineHeight: 22 },
  tipBox: { backgroundColor: '#FDE8F0', borderRadius: 12, padding: 14 },
  tipText: { fontSize: 14, color: '#8B3A55', lineHeight: 20 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between' },
  infoLabel: { fontSize: 14, color: '#888' },
  infoValue: { fontSize: 14, color: '#333', fontWeight: '500' },
  actions: { flexDirection: 'row', marginTop: 8, gap: 10 },
  btnDirections: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 52,
    borderRadius: 14,
    backgroundColor: '#C45C7E',
  },
  btnDirectionsText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  btnSave: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 52,
    borderRadius: 14,
    backgroundColor: '#FDE8F0',
    borderWidth: 1,
    borderColor: '#F0C0D4',
  },
  btnSaveActive: {
    backgroundColor: '#C45C7E',
    borderColor: '#C45C7E',
  },
  btnSaveText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#C45C7E',
  },
  btnSaveTextActive: {
    color: '#FFFFFF',
  },
  errorText: { color: '#888', fontSize: 15 },
});
