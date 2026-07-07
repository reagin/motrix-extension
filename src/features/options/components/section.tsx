import { cn } from '@/library/utils';

import type { IconComponent } from '../types';

interface SectionProps {
  title: string;
  compact: boolean;
  icon: IconComponent;
  children: React.ReactNode;
}

export function Section({ title, icon: Icon, compact, children }: SectionProps) {
  return (
    <section className='mx-auto max-w-4xl space-y-(--options-section-gap)'>
      <div className='flex items-center gap-3 px-1'>
        <div className='flex size-11 items-center justify-center rounded-2xl bg-[color-mix(in_srgb,hsl(var(--primary))_12%,transparent)] text-primary'>
          <Icon className='size-5' />
        </div>
        <div>
          <h2 className='text-xl font-bold tracking-[-0.01em]'>{title}</h2>
          <div className='mt-1 h-1 w-10 rounded-full bg-primary/70' />
        </div>
      </div>
      <div className={cn('rounded-3xl border bg-(--m3-surface-container) p-(--options-card-pad) shadow-(--m3-shadow-card)', compact ? 'space-y-2' : 'space-y-3')}>
        {children}
      </div>
    </section>
  );
}
