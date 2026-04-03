import React from 'react';
import { StyleSheet, View } from 'react-native';

type BloomArtProps = {
  size?: 'sm' | 'md' | 'lg';
  tone?: 'green' | 'pink' | 'yellow';
};

const PALETTE = {
  pink: { bloom: '#FBEAF0', core: '#F26D85' },
  yellow: { bloom: '#FBF0C0', core: '#F4C542' },
  green: { bloom: '#E4EFDF', core: '#FAE5D8' },
};

export function BloomArt({ size = 'md', tone = 'pink' }: BloomArtProps) {
  const palette = PALETTE[tone];
  return (
    <View style={[styles.wrap, sizeStyle[size]]}>
      <View style={[styles.petal, styles.petalTop, { backgroundColor: palette.bloom }]} />
      <View style={[styles.petal, styles.petalLeft, { backgroundColor: palette.bloom }]} />
      <View style={[styles.petal, styles.petalRight, { backgroundColor: palette.bloom }]} />
      <View style={[styles.petal, styles.petalBottom, { backgroundColor: palette.bloom }]} />
      <View style={[styles.core, { backgroundColor: palette.core }]} />
    </View>
  );
}

const sizeStyle = {
  sm: { width: 72, height: 72 },
  md: { width: 112, height: 112 },
  lg: { width: 168, height: 168 },
};

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', justifyContent: 'center', position: 'relative' },
  petal: { borderRadius: 999, height: '34%', position: 'absolute', width: '34%' },
  petalTop: { left: '33%', top: '12%' },
  petalLeft: { left: '12%', top: '33%' },
  petalRight: { right: '12%', top: '33%' },
  petalBottom: { bottom: '12%', left: '33%' },
  core: { borderRadius: 999, height: '26%', left: '37%', position: 'absolute', top: '37%', width: '26%' },
});
