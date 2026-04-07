import React, { useState } from 'react';
import { Image, ImageStyle, StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import type { FlowerSpot } from '@flower-map/flower-domain';

import { BloomArt } from './BloomArt';

const TONE_BG: Record<string, string> = {
  pink: '#FBE8F0',
  yellow: '#FBF0C0',
  green: '#E8F5E9',
};

type SpotImageProps = {
  spot: FlowerSpot;
  style?: StyleProp<ViewStyle>;
  bloomSize?: 'sm' | 'md' | 'lg';
};

export function SpotImage({ spot, style, bloomSize = 'md' }: SpotImageProps) {
  const [failed, setFailed] = useState(false);
  const uri = spot.thumbnailUrl ?? spot.flowerThumbnailUrl;

  if (!uri || failed) {
    return (
      <View
        style={[
          styles.placeholder,
          { backgroundColor: TONE_BG[spot.tone] ?? '#FBE8F0' },
          style,
        ]}
      >
        <BloomArt size={bloomSize} tone={spot.tone} />
      </View>
    );
  }

  return (
    <Image
      source={{ uri }}
      style={style as StyleProp<ImageStyle>}
      resizeMode="cover"
      onError={() => setFailed(true)}
    />
  );
}

const styles = StyleSheet.create({
  placeholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
