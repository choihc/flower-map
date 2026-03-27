import React from 'react';

import { Card } from '@/components/ui/card';

type MetricCardProps = {
  label: string;
  value: number | string;
  caption?: string;
};

export function MetricCard({ label, value, caption }: MetricCardProps) {
  return (
    <Card className="p-5">
      <div className="space-y-2">
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
        <div className="text-[32px] font-semibold tracking-[-0.03em] text-foreground">{value}</div>
        {caption ? <p className="text-sm text-muted-foreground">{caption}</p> : null}
      </div>
    </Card>
  );
}
