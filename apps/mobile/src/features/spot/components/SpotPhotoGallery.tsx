import React, { useState } from 'react';
import {
  Dimensions,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import type { SpotPhoto } from '../../../shared/data/photoRepository';
import { colors } from '../../../shared/theme/colors';
import { SectionCard } from '../../../shared/ui/SectionCard';

type SpotPhotoGalleryProps = {
  photos: SpotPhoto[];
};

const SCREEN_WIDTH = Dimensions.get('window').width;
const THUMBNAIL_SIZE = 64;

export function SpotPhotoGallery({ photos }: SpotPhotoGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isViewerOpen, setIsViewerOpen] = useState(false);

  if (photos.length === 0) return null;

  const mainPhoto = photos[selectedIndex] ?? photos[0];

  return (
    <SectionCard title="사진">
      <Pressable
        onPress={() => setIsViewerOpen(true)}
        accessibilityRole="button"
        accessibilityLabel="사진 전체화면으로 보기"
      >
        <Image
          source={{ uri: mainPhoto.url }}
          style={styles.mainImage}
          resizeMode="cover"
        />
      </Pressable>

      {photos.length > 1 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.thumbnailRow}
          contentContainerStyle={styles.thumbnailContent}
        >
          {photos.map((photo, index) => (
            <Pressable
              key={photo.id}
              onPress={() => setSelectedIndex(index)}
              accessibilityRole="button"
              accessibilityLabel={`${index + 1}번째 사진 선택`}
            >
              <Image
                source={{ uri: photo.url }}
                style={[
                  styles.thumbnail,
                  index === selectedIndex && styles.thumbnailActive,
                ]}
                resizeMode="cover"
              />
            </Pressable>
          ))}
        </ScrollView>
      )}

      <Modal
        visible={isViewerOpen}
        transparent
        statusBarTranslucent
        onRequestClose={() => setIsViewerOpen(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setIsViewerOpen(false)}
          accessibilityRole="button"
          accessibilityLabel="닫기"
        >
          <SafeAreaView style={styles.modalContent} pointerEvents="box-none">
            <Image
              source={{ uri: mainPhoto.url }}
              style={styles.fullImage}
              resizeMode="contain"
            />
            {mainPhoto.caption != null && (
              <Text style={styles.caption}>{mainPhoto.caption}</Text>
            )}
            <View style={styles.closeHint}>
              <Text style={styles.closeHintText}>화면을 탭하면 닫힙니다</Text>
            </View>
          </SafeAreaView>
        </Pressable>
      </Modal>
    </SectionCard>
  );
}

const styles = StyleSheet.create({
  mainImage: {
    borderRadius: 16,
    height: SCREEN_WIDTH - 72,
    width: '100%',
  },
  thumbnailRow: {
    marginTop: 10,
  },
  thumbnailContent: {
    gap: 8,
    paddingHorizontal: 2,
  },
  thumbnail: {
    borderColor: colors.border,
    borderRadius: 10,
    borderWidth: 2,
    height: THUMBNAIL_SIZE,
    width: THUMBNAIL_SIZE,
  },
  thumbnailActive: {
    borderColor: colors.primary,
    borderWidth: 2.5,
  },
  modalOverlay: {
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.92)',
    flex: 1,
    justifyContent: 'center',
  },
  modalContent: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    width: '100%',
  },
  fullImage: {
    height: '75%',
    width: '100%',
  },
  caption: {
    color: '#fff',
    fontSize: 14,
    marginTop: 12,
    paddingHorizontal: 24,
    textAlign: 'center',
  },
  closeHint: {
    bottom: 40,
    position: 'absolute',
  },
  closeHintText: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 12,
  },
});
