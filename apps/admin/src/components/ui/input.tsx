import * as React from 'react';

import { cn } from '@/lib/utils';

export type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

export const Input = React.forwardRef<HTMLInputElement, InputProps>(({ className, type = 'text', ...props }, ref) => {
  return (
    <input
      ref={ref}
      type={type}
      className={cn(
        'flex h-11 w-full rounded-xl border border-[#D7DEE8] bg-white px-3.5 py-2 text-sm text-[#191F28] shadow-sm transition-colors placeholder:text-[#8B95A1] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3182F6]/20 disabled:cursor-not-allowed disabled:opacity-50',
        className,
      )}
      {...props}
    />
  );
});

Input.displayName = 'Input';
