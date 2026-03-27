import * as React from 'react';

import { cn } from '@/lib/utils';

type DivProps = React.HTMLAttributes<HTMLDivElement>;

export const Card = React.forwardRef<HTMLDivElement, DivProps>(({ className, ...props }, ref) => {
  return <div ref={ref} className={cn('rounded-[28px] border border-black/5 bg-white shadow-[0_12px_40px_rgba(15,23,42,0.04)]', className)} {...props} />;
});

Card.displayName = 'Card';

export const CardHeader = React.forwardRef<HTMLDivElement, DivProps>(({ className, ...props }, ref) => {
  return <div ref={ref} className={cn('flex flex-col space-y-1.5 p-6', className)} {...props} />;
});

CardHeader.displayName = 'CardHeader';

export const CardTitle = React.forwardRef<HTMLHeadingElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => {
    return <h3 ref={ref} className={cn('text-base font-semibold leading-none tracking-[-0.02em] text-[#191F28]', className)} {...props} />;
  },
);

CardTitle.displayName = 'CardTitle';

export const CardDescription = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => {
    return <p ref={ref} className={cn('text-sm text-[#6B7684]', className)} {...props} />;
  },
);

CardDescription.displayName = 'CardDescription';

export const CardContent = React.forwardRef<HTMLDivElement, DivProps>(({ className, ...props }, ref) => {
  return <div ref={ref} className={cn('p-6 pt-0', className)} {...props} />;
});

CardContent.displayName = 'CardContent';

export const CardFooter = React.forwardRef<HTMLDivElement, DivProps>(({ className, ...props }, ref) => {
  return <div ref={ref} className={cn('flex items-center p-6 pt-0', className)} {...props} />;
});

CardFooter.displayName = 'CardFooter';
