import { cn } from '@/library/utils';
import { Switch } from '@/components/ui/switch';

interface SettingSwitchProps {
  hint?: string;
  label: string;
  checked: boolean;
  compact?: boolean;
  onCheckedChange: (checked: boolean) => void;
}

export function SettingSwitch({ label, hint, checked, onCheckedChange, compact = false }: SettingSwitchProps) {
  return (
    <div className={cn('flex items-center justify-between gap-5 rounded-2xl border bg-(--m3-surface) px-4', compact ? 'py-2.5' : 'py-3.5')}>
      <div className='min-w-0'>
        <div className='text-sm font-semibold'>{label}</div>
        {hint ? <div className='mt-0.5 text-xs text-muted-foreground'>{hint}</div> : null}
      </div>
      <Switch checked={checked} onCheckedChange={onCheckedChange} />
    </div>
  );
}
