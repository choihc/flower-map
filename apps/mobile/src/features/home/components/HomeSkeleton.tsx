import { StyleSheet, View } from 'react-native';

import { SkeletonBox } from '../../../shared/ui/SkeletonBox';

export function HomeSkeleton() {
  return (
    <View testID="home-skeleton" style={styles.container}>
      <SkeletonBox height={150} borderRadius={20} />
      <View style={styles.row}>
        <SkeletonBox testID="home-skeleton-card" height={78} borderRadius={16} width="31%" />
        <SkeletonBox testID="home-skeleton-card" height={78} borderRadius={16} width="31%" />
        <SkeletonBox testID="home-skeleton-card" height={78} borderRadius={16} width="31%" />
      </View>
      <SkeletonBox height={92} borderRadius={18} />
      <SkeletonBox height={92} borderRadius={18} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 16,
  },
  row: {
    flexDirection: 'row',
    gap: 10,
  },
});
