import { CheckCircle2 } from 'lucide-react';

import { cn } from '@/library/utils';

interface ChoiceOptionProps {
  label: string;
  active: boolean;
  compact?: boolean;
  onClick: () => void;
  description?: string;
}

export function ChoiceOption({ label, description, active, compact = false, onClick }: ChoiceOptionProps) {
  return (
    <button
      type='button'
      onClick={onClick}
      className={cn(
        'flex min-h-18 cursor-pointer flex-col items-start justify-center border-r px-4 text-left transition-[background-color,color,box-shadow] last:border-r-0 max-[760px]:border-r-0 max-[760px]:border-b max-[760px]:last:border-b-0',
        compact ? 'py-2.5' : 'py-3.5',
        active
          ? 'bg-(--m3-primary-container) text-(--m3-on-primary-container) shadow-[inset_0_0_0_1px_hsl(var(--primary))]'
          : 'text-muted-foreground hover:bg-[color-mix(in_srgb,var(--m3-on-surface)_6%,transparent)] hover:text-foreground',
      )}
    >
      <span className='flex items-center gap-2 text-sm font-semibold'>
        {active ? <CheckCircle2 className='size-4 text-primary' /> : null}
        {label}
      </span>
      {description ? <span className='mt-1 text-xs/relaxed opacity-70'>{description}</span> : null}
    </button>
  );
}
