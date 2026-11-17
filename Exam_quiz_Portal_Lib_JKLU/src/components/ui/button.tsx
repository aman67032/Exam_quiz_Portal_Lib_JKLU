import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E04F33] disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98]',
  {
    variants: {
      variant: {
        default:
          'bg-[#0A0A0C] text-[#FAF9F6] hover:bg-[#E04F33] dark:bg-[#F5F4F0] dark:text-[#0A0A0C] dark:hover:bg-[#E04F33] dark:hover:text-white shadow-sm',
        destructive:
          'bg-[#E04F33] text-white hover:bg-[#c94127] shadow-sm',
        outline:
          'border border-[#E5E2DC] dark:border-[#232329] bg-white/80 dark:bg-[#121216]/80 hover:border-[#0A0A0C] dark:hover:border-[#F5F4F0] text-[#0A0A0C] dark:text-[#F5F4F0]',
        secondary:
          'bg-[#F3F1EA] dark:bg-[#1C1C22] text-[#0A0A0C] dark:text-[#F5F4F0] hover:bg-[#E5E2DC] dark:hover:bg-[#27272F]',
        ghost:
          'hover:bg-[#F3F1EA] dark:hover:bg-white/5 text-[#5C5B57] dark:text-[#94938E] hover:text-[#0A0A0C] dark:hover:text-[#F5F4F0]',
        link: 'text-[#E04F33] underline-offset-4 hover:underline',
      },
      size: {
        default: 'h-10 px-4 py-2',
        sm: 'h-8 rounded-md px-3 text-xs',
        lg: 'h-11 rounded-lg px-6 text-sm',
        icon: 'h-9 w-9',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => (
    <button
      ref={ref}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
);
Button.displayName = 'Button';

export { Button, buttonVariants };
