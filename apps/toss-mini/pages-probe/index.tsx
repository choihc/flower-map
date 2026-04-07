import { createRoute } from '@granite-js/react-native';
import React from 'react';

import { BootProbeScreen } from '../src/shared/components/BootProbeScreen';

export const Route = createRoute('/', {
  component: ProbePage,
});

function ProbePage() {
  return <BootProbeScreen />;
}
