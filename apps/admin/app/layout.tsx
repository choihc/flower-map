import './globals.css';

import type { ReactNode } from 'react';

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ko">
      <body className="bg-[#F6F7FB] text-[#191F28] antialiased">{children}</body>
    </html>
  );
}
