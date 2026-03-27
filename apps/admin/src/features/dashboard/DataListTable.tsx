import React from 'react';
import type { ReactNode } from 'react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableHeader, TableRow } from '@/components/ui/table';

type DataListTableProps = {
  title: string;
  description?: string;
  columns: ReactNode;
  children: ReactNode;
  hasItems: boolean;
  emptyState: ReactNode;
};

export function DataListTable({
  title,
  description,
  columns,
  children,
  hasItems,
  emptyState,
}: DataListTableProps) {
  return (
    <Card className="overflow-hidden">
      <CardHeader className="px-5 py-5">
        <CardTitle>{title}</CardTitle>
        {description ? <CardDescription>{description}</CardDescription> : null}
      </CardHeader>
      <CardContent className="px-0 pb-0">
        <Table>
          <TableHeader>
            <TableRow>{columns}</TableRow>
          </TableHeader>
          <TableBody>
            {hasItems ? (
              children
            ) : (
              <TableRow>{emptyState}</TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
