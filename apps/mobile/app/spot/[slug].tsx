import { useLocalSearchParams } from 'expo-router';

import { SpotDetailScreen } from '../../src/features/spot/screens/SpotDetailScreen';

export default function SpotDetailRoute() {
  const { slug } = useLocalSearchParams<{ slug: string }>();

  return <SpotDetailScreen slug={slug ?? ''} />;
}
