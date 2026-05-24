'use client';

import React from 'react';

import { PLATFORM_LABEL, type Platform } from './designTokens';

type Props = {
  value: Platform;
  onChange: (next: Platform) => void;
};

export function PlatformToggle({ value, onChange }: Props) {
  const platforms: Platform[] = ['ios', 'android'];
  return (
    <div
      role="tablist"
      aria-label="플랫폼 선택"
      className="inline-flex rounded-full border border-border bg-background p-1 text-sm"
    >
      {platforms.map((p) => {
        const active = value === p;
        return (
          <button
            key={p}
            role="tab"
            aria-selected={active}
            onClick={() => onChange(p)}
            className={
              'px-4 py-1.5 rounded-full transition ' +
              (active
                ? 'bg-foreground text-background font-semibold'
                : 'text-muted-foreground hover:text-foreground')
            }
          >
            {PLATFORM_LABEL[p]}
          </button>
        );
      })}
    </div>
  );
}
