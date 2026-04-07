import * as React from 'react';

import { cn } from '@/lib/utils';

export type SeparatorProps = React.HTMLAttributes<HTMLDivElement> & {
  orientation?: 'horizontal' | 'vertical';
};

export const Separator = React.forwardRef<HTMLDivElement, SeparatorProps>(
  ({ className, orientation = 'horizontal', ...props }, ref) => {
    return (
      <div
        ref={ref}
        role="separator"
        aria-orientation={orientation}
        className={cn(
          orientation === 'horizontal' ? 'h-px w-full' : 'h-full w-px',
          'shrink-0 bg-border',
          className,
        )}
        {...props}
      />
    );
  },
);

Separator.displayName = 'Separator';
