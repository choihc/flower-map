import { useLocalSearchParams } from 'expo-router';

import NotFoundScreen from '../+not-found';
import { SpotDetailScreen } from '../../src/features/spot/screens/SpotDetailScreen';
import { resolveSpotSlug } from '../../src/features/spot/spotDetailRoute';

export default function SpotDetailRoute() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const resolvedSlug = resolveSpotSlug(slug);

  if (!resolvedSlug) {
    return <NotFoundScreen />;
  }

  return <SpotDetailScreen slug={resolvedSlug} />;
}
