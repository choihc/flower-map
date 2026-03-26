import { Text } from 'react-native';

import { ScreenShell } from '../../../shared/ui/ScreenShell';
import { SectionCard } from '../../../shared/ui/SectionCard';

export function MeScreen() {
  return (
    <ScreenShell title="My page" subtitle="Profile, auth state, alerts, and support links live here.">
      <SectionCard title="Planned items">
        <Text>- Login / logout</Text>
        <Text>- Interested flower types</Text>
        <Text>- Notification settings</Text>
        <Text>- App info</Text>
      </SectionCard>
    </ScreenShell>
  );
}
