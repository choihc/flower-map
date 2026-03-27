import React from 'react';
import type { ReactNode } from 'react';

import { AdminSidebar } from './AdminSidebar';
import { AdminTopbar } from './AdminTopbar';

type DashboardShellProps = {
  title: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
};

export function DashboardShell({ title, description, actions, children }: DashboardShellProps) {
  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto grid min-h-screen max-w-[1600px] gap-6 px-5 py-5 lg:grid-cols-[280px_minmax(0,1fr)]">
        <AdminSidebar />
        <main className="min-w-0 flex flex-col gap-6">
          <AdminTopbar title={title} description={description} actions={actions} />
          <section>{children}</section>
        </main>
      </div>
    </div>
  );
}
