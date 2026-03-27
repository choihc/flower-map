import React from 'react';
import Link from 'next/link';

import { Card } from '@/components/ui/card';

const navItems = [
  { href: '/', label: '대시보드' },
  { href: '/flowers', label: '꽃 관리' },
  { href: '/spots', label: '명소 관리' },
  { href: '/spots/import', label: 'JSON 등록' },
];

export function AdminSidebar() {
  return (
    <aside className="min-w-0">
      <Card className="sticky top-5 flex min-h-[calc(100vh-40px)] flex-col p-4">
        <div className="px-3 py-4">
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-[#8B95A1]">Flower Map</p>
          <h2 className="mt-2 text-xl font-semibold tracking-[-0.03em] text-[#191F28]">꽃 어디 Admin</h2>
        </div>
        <nav aria-label="관리 메뉴" className="mt-4 flex flex-1 flex-col gap-1">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-2xl px-3 py-3 text-sm font-medium text-[#4E5968] transition hover:bg-[#F2F4F6] hover:text-[#191F28]"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </Card>
    </aside>
  );
}
