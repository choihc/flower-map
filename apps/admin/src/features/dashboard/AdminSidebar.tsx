import React from 'react';
import Link from 'next/link';

import { Card } from '@/components/ui/card';

const primaryNavItems = [
  { href: '/', label: '대시보드' },
  { href: '/flowers', label: '꽃 관리' },
  { href: '/spots', label: '명소 관리' },
  { href: '/spots/import', label: 'JSON 등록' },
  { href: '/settings', label: '설정' },
];

export function AdminSidebar() {
  return (
    <aside className="min-w-0 lg:sticky lg:top-5">
      <Card className="flex flex-col p-4 lg:min-h-[calc(100vh-40px)]">
        <div className="px-3 py-4">
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">Flower Map</p>
          <h2 className="mt-2 text-xl font-semibold tracking-[-0.03em] text-foreground">꽃 어디 Admin</h2>
        </div>
        <div className="mt-4 flex flex-1 flex-col gap-6">
          <nav aria-label="관리 메뉴" className="flex flex-col gap-1">
            <p className="px-3 text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">주요 메뉴</p>
            {primaryNavItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-2xl px-3 py-3 text-sm font-medium text-muted-foreground transition hover:bg-muted/20 hover:text-foreground"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      </Card>
    </aside>
  );
}
