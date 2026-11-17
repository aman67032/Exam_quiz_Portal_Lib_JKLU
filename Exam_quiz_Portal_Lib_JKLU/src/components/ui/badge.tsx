import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-mono-tabular font-medium transition-colors',
  {
    variants: {
      variant: {
        default:
          'border-[#E5E2DC] dark:border-[#232329] bg-[#FAF9F6] dark:bg-[#0A0A0C] text-[#0A0A0C] dark:text-[#F5F4F0]',
        vermilion:
          'border-[#E04F33]/30 bg-[#E04F33]/10 text-[#E04F33]',
        indigo:
          'border-[#4F46E5]/30 bg-[#4F46E5]/10 text-[#4F46E5] dark:text-[#818CF8]',
        emerald:
          'border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400',
        outline:
          'border-[#E5E2DC] dark:border-[#232329] text-[#5C5B57] dark:text-[#94938E]',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
