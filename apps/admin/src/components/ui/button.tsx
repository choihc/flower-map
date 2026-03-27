import * as React from 'react';

import { cn } from '@/lib/utils';

type ButtonVariant = 'default' | 'secondary' | 'outline' | 'ghost' | 'destructive' | 'link';
type ButtonSize = 'default' | 'sm' | 'lg' | 'icon';

export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
};

const variantClasses: Record<ButtonVariant, string> = {
  default: 'bg-[#3182F6] text-white shadow-sm hover:bg-[#1F6FE5]',
  secondary: 'bg-[#EAF1FF] text-[#1F4B99] hover:bg-[#DDE8FF]',
  outline: 'border border-[#D7DEE8] bg-white text-[#191F28] hover:bg-[#F5F7FA]',
  ghost: 'bg-transparent text-[#4E5968] hover:bg-[#F2F4F6]',
  destructive: 'bg-[#E5484D] text-white hover:bg-[#CE2C31]',
  link: 'bg-transparent text-[#3182F6] underline-offset-4 hover:underline',
};

const sizeClasses: Record<ButtonSize, string> = {
  default: 'h-10 px-4 py-2',
  sm: 'h-9 rounded-xl px-3 text-sm',
  lg: 'h-11 rounded-xl px-5 text-base',
  icon: 'h-10 w-10',
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'default', type = 'button', ...props }, ref) => {
    return (
      <button
        ref={ref}
        type={type}
        className={cn(
          'inline-flex items-center justify-center gap-2 rounded-xl text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3182F6]/30 disabled:pointer-events-none disabled:opacity-50',
          variantClasses[variant],
          sizeClasses[size],
          className,
        )}
        {...props}
      />
    );
  },
);

Button.displayName = 'Button';
