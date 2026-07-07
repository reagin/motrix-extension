import { cn } from '@/library/utils';

interface ProtocolToggleProps {
  label: string;
  checked: boolean;
  compact?: boolean;
  onCheckedChange: (checked: boolean) => void;
}

export function ProtocolToggle({ label, checked, onCheckedChange, compact = false }: ProtocolToggleProps) {
  return (
    <button
      type='button'
      onClick={() => onCheckedChange(!checked)}
      className={cn(
        'flex min-h-11 cursor-pointer items-center justify-between rounded-2xl border px-3.5 text-left text-sm font-semibold',
        compact ? 'py-2' : 'py-3',
        checked
          ? 'border-primary/40 bg-(--m3-primary-container) text-(--m3-on-primary-container)'
          : 'border-(--m3-outline-variant) bg-(--m3-surface) text-muted-foreground hover:text-foreground',
      )}
    >
      <span>{label}</span>
      <span className={cn('size-2.5 rounded-full', checked ? 'bg-primary' : 'bg-(--m3-outline-variant)')} />
    </button>
  );
}
