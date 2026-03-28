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
    <div className="bg-background lg:h-screen lg:overflow-hidden">
      <div className="mx-auto flex max-w-[1600px] flex-col-reverse gap-6 px-4 py-4 lg:grid lg:h-full lg:grid-cols-[280px_minmax(0,1fr)] lg:gap-6 lg:px-5 lg:py-5">
        <AdminSidebar />
        <main className="min-w-0 flex flex-col gap-6 lg:overflow-y-auto lg:pr-1">
          <AdminTopbar title={title} description={description} actions={actions} />
          <section className="pb-6">{children}</section>
        </main>
      </div>
    </div>
  );
}
