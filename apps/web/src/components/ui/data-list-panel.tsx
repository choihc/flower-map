import React from 'react';
import type { ReactNode } from 'react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './card';

type DataListPanelProps = {
  title: string;
  description?: string;
  emptyState: ReactNode;
  hasItems: boolean;
  children: ReactNode;
};

export function DataListPanel({ title, description, emptyState, hasItems, children }: DataListPanelProps) {
  return (
    <Card className="overflow-hidden">
      <CardHeader className="px-5 py-5">
        <CardTitle>{title}</CardTitle>
        {description ? <CardDescription>{description}</CardDescription> : null}
      </CardHeader>
      <CardContent className="space-y-3 px-5 pb-5">
        {hasItems ? children : emptyState}
      </CardContent>
    </Card>
  );
}
