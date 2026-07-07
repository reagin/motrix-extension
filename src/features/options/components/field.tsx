import { cn } from '@/library/utils';
import { Label } from '@/components/ui/label';

interface FieldProps {
  hint?: string;
  label: string;
  compact: boolean;
  children: React.ReactNode;
}

export function Field({ label, hint, compact, children }: FieldProps) {
  return (
    <div className='rounded-2xl border bg-(--m3-surface) p-(--options-field-pad)'>
      <div className={cn('flex items-baseline justify-between gap-3', compact ? 'mb-1.5' : 'mb-2')}>
        <Label className='text-[13px]'>{label}</Label>
        {hint ? <p className='max-w-[60%] text-right text-xs/relaxed text-muted-foreground'>{hint}</p> : null}
      </div>
      {children}
    </div>
  );
}
