import { useCallback } from 'react';
import { useFocusEffect } from 'expo-router';

import { StayListScreen } from '../../src/features/stays/screens/StayListScreen';
import { useFeatureSeen } from '../../src/shared/lib/useFeatureSeen';

export default function StaysTabRoute() {
  const { markSeen } = useFeatureSeen('stays');

  useFocusEffect(
    useCallback(() => {
      void markSeen();
    }, [markSeen]),
  );

  return <StayListScreen />;
}
