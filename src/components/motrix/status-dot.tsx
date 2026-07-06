import { cn } from '@/src/lib/utils';

export function StatusDot({ ok, checking = false }: { ok: boolean; checking?: boolean }) {
  return (
    <span
      className={cn(
        'relative inline-flex size-2.5 rounded-full',
        ok ? 'bg-task-active' : 'bg-destructive',
        checking && 'bg-task-waiting',
      )}
    >
      {ok ? <span className="absolute inset-0 animate-ping rounded-full bg-task-active/45" /> : null}
    </span>
  );
}
