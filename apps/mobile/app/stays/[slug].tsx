import { useLocalSearchParams } from 'expo-router';

import NotFoundScreen from '../+not-found';
import { StayDetailScreen } from '../../src/features/stays/screens/StayDetailScreen';
import { resolveStaySlug } from '../../src/features/stays/stayDetailRoute';

export default function StayDetailRoute() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const resolvedSlug = resolveStaySlug(slug);

  if (!resolvedSlug) {
    return <NotFoundScreen />;
  }

  return <StayDetailScreen slug={resolvedSlug} />;
}
