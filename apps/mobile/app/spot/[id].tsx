import { useLocalSearchParams } from 'expo-router';

import { SpotDetailScreen } from '../../src/features/spot/screens/SpotDetailScreen';

export default function SpotDetailRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();

  return <SpotDetailScreen spotId={id ?? ''} />;
}
