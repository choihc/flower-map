import * as React from 'react';

import { cn } from '@/lib/utils';

export type SelectProps = React.SelectHTMLAttributes<HTMLSelectElement>;

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(({ className, children, ...props }, ref) => {
  return (
    <select
      ref={ref}
      className={cn(
        'flex h-11 w-full rounded-xl border border-[#D7DEE8] bg-white px-3.5 py-2 text-sm text-[#191F28] shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3182F6]/20 disabled:cursor-not-allowed disabled:opacity-50',
        className,
      )}
      {...props}
    >
      {children}
    </select>
  );
});

Select.displayName = 'Select';
