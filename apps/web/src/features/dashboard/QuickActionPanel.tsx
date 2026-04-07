import React from 'react';
import Link from 'next/link';

import { Card } from '@/components/ui/card';

type QuickAction = {
  href: string;
  label: string;
  description: string;
};

const quickActions: QuickAction[] = [
  { href: '/admin/flowers', label: '꽃 관리', description: '꽃 마스터를 추가하고 정리합니다.' },
  { href: '/admin/spots', label: '명소 관리', description: '명소 초안과 공개 상태를 다룹니다.' },
  { href: '/admin/spots/import', label: 'JSON 등록', description: '외부 JSON을 검증하고 초안으로 저장합니다.' },
];

export function QuickActionPanel() {
  return (
    <Card className="p-5">
      <div className="space-y-4">
        <div>
          <h2 className="text-sm font-semibold text-foreground">바로가기</h2>
          <p className="mt-1 text-sm text-muted-foreground">자주 쓰는 관리 화면으로 바로 이동합니다.</p>
        </div>
        <div className="space-y-2">
          {quickActions.map((action) => (
            <Link
              key={action.href}
              href={action.href}
              className="flex items-start justify-between gap-4 rounded-2xl border border-border bg-background px-4 py-3 transition hover:bg-muted/20"
            >
              <div className="space-y-1">
                <div className="text-sm font-semibold text-foreground">{action.label}</div>
                <p className="text-sm text-muted-foreground">{action.description}</p>
              </div>
              <span className="pt-0.5 text-sm font-medium text-muted-foreground">→</span>
            </Link>
          ))}
        </div>
      </div>
    </Card>
  );
}
