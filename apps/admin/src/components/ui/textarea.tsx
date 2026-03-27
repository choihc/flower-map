import * as React from 'react';

import { cn } from '@/lib/utils';

export type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement>;

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(({ className, ...props }, ref) => {
  return (
    <textarea
      ref={ref}
      className={cn(
        'flex min-h-[120px] w-full rounded-xl border border-[#D7DEE8] bg-white px-3.5 py-3 text-sm text-[#191F28] shadow-sm transition-colors placeholder:text-[#8B95A1] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3182F6]/20 disabled:cursor-not-allowed disabled:opacity-50',
        className,
      )}
      {...props}
    />
  );
});

Textarea.displayName = 'Textarea';
