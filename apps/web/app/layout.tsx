import './globals.css';

import type { ReactNode } from 'react';

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ko">
      <head>
        <meta name="agd-partner-manual-verification" />
      </head>
      <body className="antialiased">{children}</body>
    </html>
  );
}
