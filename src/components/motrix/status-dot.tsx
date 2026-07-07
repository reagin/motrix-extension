import { cn } from '@/src/lib/utils';

export function StatusDot({ ok, checking = false }: { ok: boolean; checking?: boolean }) {
  return (
    <span
      className={cn(
        'relative inline-flex size-2.5 rounded-full ring-2 ring-background',
        ok ? 'bg-task-active' : 'bg-destructive',
        checking && 'bg-task-waiting',
      )}
    />
  );
}
