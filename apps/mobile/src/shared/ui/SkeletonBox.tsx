import { StyleSheet, View } from 'react-native';

type SkeletonBoxProps = {
  height: number;
  borderRadius?: number;
  width?: string | number;
  testID?: string;
};

export function SkeletonBox({ height, borderRadius = 16, width = '100%', testID }: SkeletonBoxProps) {
  return (
    <View
      testID={testID}
      style={[
        styles.base,
        { height, borderRadius, width: width as any },
      ]}
    />
  );
}

const styles = StyleSheet.create({
  base: {
    backgroundColor: '#F2EDE6',
    marginBottom: 12,
  },
});
