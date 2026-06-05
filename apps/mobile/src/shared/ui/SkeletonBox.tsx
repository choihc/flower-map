import { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

type SkeletonBoxProps = {
  height: number;
  borderRadius?: number;
  width?: string | number;
  testID?: string;
};

export function SkeletonBox({ height, borderRadius = 16, width = '100%', testID }: SkeletonBoxProps) {
  const opacity = useSharedValue(1);

  useEffect(() => {
    opacity.value = withRepeat(
      withTiming(0.45, { duration: 800, easing: Easing.inOut(Easing.ease) }),
      -1,
      true,
    );
  }, [opacity]);

  const animatedStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return (
    <Animated.View
      testID={testID}
      style={[styles.base, { height, borderRadius, width: width as any }, animatedStyle]}
    />
  );
}

const styles = StyleSheet.create({
  base: {
    backgroundColor: '#F2EDE6',
    marginBottom: 12,
  },
});
