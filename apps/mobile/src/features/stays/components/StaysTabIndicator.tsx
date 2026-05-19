import { useEffect, useRef } from 'react';
import { AccessibilityInfo, Animated, StyleSheet, View } from 'react-native';

import { colors } from '../../../shared/theme/colors';

const DOT_SIZE = 8;
const RING_WIDTH = 2;
const ENTER_DURATION_MS = 200;

type StaysTabIndicatorProps = {
  seen: boolean | undefined;
};

export function StaysTabIndicator({ seen }: StaysTabIndicatorProps) {
  const scale = useRef(new Animated.Value(0.6)).current;

  useEffect(() => {
    if (seen !== false) return;
    let cancelled = false;
    AccessibilityInfo.isReduceMotionEnabled?.()
      .then((reduce) => {
        if (cancelled) return;
        if (reduce) {
          scale.setValue(1);
          return;
        }
        Animated.spring(scale, {
          toValue: 1,
          useNativeDriver: true,
          speed: 18,
          bounciness: 6,
        }).start();
      })
      .catch(() => {
        scale.setValue(1);
      });
    return () => {
      cancelled = true;
    };
  }, [scale, seen]);

  if (seen !== false) return null;

  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      pointerEvents="none"
      style={styles.wrap}
      testID="stays-tab-new-dot"
    >
      <Animated.View style={[styles.dot, { transform: [{ scale }] }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  dot: {
    backgroundColor: colors.secondary,
    borderColor: colors.backgroundTint,
    borderRadius: 999,
    borderWidth: RING_WIDTH,
    height: DOT_SIZE + RING_WIDTH * 2,
    width: DOT_SIZE + RING_WIDTH * 2,
  },
  wrap: {
    position: 'absolute',
    right: 2,
    top: 2,
  },
});
