import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/library/utils';

const badgeVariants = cva(
  'pointer-events-none inline-flex select-none items-center rounded-md border px-2 py-0.5 text-xs font-medium transition-colors',
  {
    variants: {
      variant: {
        default: 'border-transparent bg-primary text-primary-foreground',
        secondary: 'border-transparent bg-secondary text-secondary-foreground',
        outline: 'text-foreground',
        good: 'border-transparent bg-task-active/12 text-task-active',
        warn: 'border-transparent bg-task-waiting/15 text-task-waiting',
        quiet: 'border-transparent bg-muted text-muted-foreground',
        destructive: 'border-transparent bg-destructive/12 text-destructive',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
