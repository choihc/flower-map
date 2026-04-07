import type { ReactNode } from 'react';

import { ConditionalShell } from '@/features/public/ConditionalShell';

export default function PublicLayout({ children }: { children: ReactNode }) {
  return <ConditionalShell>{children}</ConditionalShell>;
}
