import * as React from 'react';

import { cn } from '@/lib/utils';

type BadgeVariant = 'default' | 'secondary' | 'outline' | 'destructive';

export type BadgeProps = React.HTMLAttributes<HTMLSpanElement> & {
  variant?: BadgeVariant;
};

const variantClasses: Record<BadgeVariant, string> = {
  default: 'bg-primary text-primary-foreground',
  secondary: 'bg-muted/20 text-foreground',
  outline: 'border border-border bg-background text-muted-foreground',
  destructive: 'bg-[#FDECEC] text-[#C6282D]',
};

export const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(({ className, variant = 'default', ...props }, ref) => {
  return (
    <span
      ref={ref}
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold leading-none',
        variantClasses[variant],
        className,
      )}
      {...props}
    />
  );
});

Badge.displayName = 'Badge';
