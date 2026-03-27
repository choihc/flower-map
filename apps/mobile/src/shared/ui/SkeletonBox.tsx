import { StyleSheet, View } from 'react-native';

type SkeletonBoxProps = {
  height: number;
  borderRadius?: number;
  width?: string | number;
};

export function SkeletonBox({ height, borderRadius = 16, width = '100%' }: SkeletonBoxProps) {
  return (
    <View
      style={[
        styles.base,
        { height, borderRadius, width: width as any },
      ]}
    />
  );
}

const styles = StyleSheet.create({
  base: {
    backgroundColor: '#EDE5DC',
    marginBottom: 12,
  },
});
