import React from 'react';
import Link from 'next/link';
import type { ReactNode } from 'react';

type DashboardShellProps = {
  title: string;
  children: ReactNode;
};

const links = [
  { href: '/flowers', label: '꽃 관리' },
  { href: '/spots', label: '명소 관리' },
  { href: '/spots/import', label: 'JSON 등록' },
];

export function DashboardShell({ title, children }: DashboardShellProps) {
  return (
    <main>
      <header>
        <p>꽃 어디 어드민</p>
        <h1>{title}</h1>
        <nav aria-label="관리 메뉴">
          <ul>
            {links.map((link) => (
              <li key={link.href}>
                <Link href={link.href}>{link.label}</Link>
              </li>
            ))}
          </ul>
        </nav>
      </header>
      <section>{children}</section>
    </main>
  );
}
