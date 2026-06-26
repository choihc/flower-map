import { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import type { StyleProp, ViewStyle } from 'react-native';
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
  /** 레이아웃 제어용(여백·정렬 등). 간격은 박스가 아닌 부모가 관리한다. */
  style?: StyleProp<ViewStyle>;
};

export function SkeletonBox({
  height,
  borderRadius = 16,
  width = '100%',
  testID,
  style,
}: SkeletonBoxProps) {
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
      style={[styles.base, { height, borderRadius, width: width as any }, style, animatedStyle]}
    />
  );
}

const styles = StyleSheet.create({
  base: {
    backgroundColor: '#F2EDE6',
  },
});
