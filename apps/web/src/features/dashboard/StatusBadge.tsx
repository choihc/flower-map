import React from 'react';

import { Badge } from '@/components/ui/badge';
import type { SpotStatus } from '@/lib/types';

type StatusBadgeProps = {
  status: SpotStatus;
};

const statusLabelByValue: Record<SpotStatus, string> = {
  draft: '검토 중',
  published: '게시됨',
};

export function StatusBadge({ status }: StatusBadgeProps) {
  return (
    <Badge variant={status === 'published' ? 'default' : 'outline'} className="rounded-full px-2.5 py-1">
      {statusLabelByValue[status]}
    </Badge>
  );
}
