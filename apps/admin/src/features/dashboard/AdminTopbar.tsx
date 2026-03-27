import React from 'react';
import type { ReactNode } from 'react';

import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

type AdminTopbarProps = {
  title: string;
  description?: string;
  actions?: ReactNode;
};

export function AdminTopbar({ title, description, actions }: AdminTopbarProps) {
  return (
    <Card className="bg-white/80 px-7 py-6 backdrop-blur">
      <header className="flex flex-col gap-4">
        <div className="flex items-start justify-between gap-6">
          <div>
            <p className="text-sm font-medium text-[#8B95A1]">운영 대시보드</p>
            <h1 className="mt-2 text-[32px] font-semibold tracking-[-0.03em] text-[#191F28]">{title}</h1>
            {description ? <p className="mt-2 text-sm text-[#4E5968]">{description}</p> : null}
          </div>
          {actions ? <div className="shrink-0">{actions}</div> : null}
        </div>
        <Separator />
      </header>
    </Card>
  );
}
