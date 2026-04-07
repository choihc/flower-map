'use client';

import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';

import { PublicShell } from './PublicShell';

const NO_SHELL_PATHS = ['/landing'];

export function ConditionalShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const noShell = NO_SHELL_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`));
  if (noShell) return <>{children}</>;
  return <PublicShell>{children}</PublicShell>;
}
