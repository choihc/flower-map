import { StyleSheet, View } from 'react-native';

import { colors } from '../theme/colors';

type BloomArtProps = {
  size?: 'sm' | 'md' | 'lg';
  tone?: 'green' | 'pink' | 'yellow';
};

export function BloomArt({ size = 'md', tone = 'pink' }: BloomArtProps) {
  const palette =
    tone === 'yellow'
      ? {
          bloom: colors.softYellow,
          core: colors.warning,
        }
      : tone === 'green'
        ? {
          bloom: colors.surfaceMint,
          core: colors.accentPeach,
        }
        : {
            bloom: colors.surfaceRose,
            core: colors.secondary,
          };

  return (
    <View style={[styles.wrap, size === 'lg' ? styles.wrapLg : size === 'sm' ? styles.wrapSm : styles.wrapMd]}>
      <View style={[styles.petal, styles.petalTop, { backgroundColor: palette.bloom }]} />
      <View style={[styles.petal, styles.petalLeft, { backgroundColor: palette.bloom }]} />
      <View style={[styles.petal, styles.petalRight, { backgroundColor: palette.bloom }]} />
      <View style={[styles.petal, styles.petalBottom, { backgroundColor: palette.bloom }]} />
      <View style={[styles.core, { backgroundColor: palette.core }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  core: {
    borderRadius: 999,
    height: '26%',
    left: '37%',
    position: 'absolute',
    top: '37%',
    width: '26%',
  },
  petal: {
    borderRadius: 999,
    height: '34%',
    position: 'absolute',
    width: '34%',
  },
  petalBottom: {
    bottom: '12%',
    left: '33%',
  },
  petalLeft: {
    left: '12%',
    top: '33%',
  },
  petalRight: {
    right: '12%',
    top: '33%',
  },
  petalTop: {
    left: '33%',
    top: '12%',
  },
  wrap: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  wrapLg: {
    height: 168,
    width: 168,
  },
  wrapMd: {
    height: 112,
    width: 112,
  },
  wrapSm: {
    height: 72,
    width: 72,
  },
});
