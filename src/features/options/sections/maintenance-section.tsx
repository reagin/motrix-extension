import { useRef } from 'react';
import { CheckCircle2, FileDown, FileUp, RotateCcw, Trash2, Wrench } from 'lucide-react';

import type { StorageSnapshot } from '@/library/storage';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { sendRuntimeMessage } from '@/library/runtime';
import { ScrollArea } from '@/components/ui/scroll-area';

import type { OptionsTranslator } from '../types';

import { Section } from '../components/section';

interface MaintenanceSectionProps {
  compact: boolean;
  t: OptionsTranslator;
  snapshot: StorageSnapshot;
  exportSettings: () => void;
  refresh: () => Promise<void>;
  restoreDefaults: () => Promise<void>;
  importSettings: (file: File | undefined) => Promise<void>;
}

export function MaintenanceSection({
  compact,
  exportSettings,
  importSettings,
  refresh,
  restoreDefaults,
  snapshot,
  t,
}: MaintenanceSectionProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  return (
    <Section title={t('options.maintenance')} icon={Wrench} compact={compact}>
      <div className='grid grid-cols-4 gap-(--options-gap) max-[980px]:grid-cols-2 max-[640px]:grid-cols-1'>
        <Button className='h-11 justify-start' variant='outline' onClick={exportSettings}>
          <FileDown />
          {t('options.exportSettings')}
        </Button>
        <Button className='h-11 justify-start' variant='outline' onClick={() => fileInputRef.current?.click()}>
          <FileUp />
          {t('options.importSettings')}
        </Button>
        <Button className='h-11 justify-start' variant='outline' onClick={() => void sendRuntimeMessage({ type: 'clear-diagnostics' }).then(refresh)}>
          <Trash2 />
          {t('options.clearDiagnostics')}
        </Button>
        <Button className='h-11 justify-start' variant='destructive' onClick={() => void restoreDefaults()}>
          <RotateCcw />
          {t('options.restoreDefaults')}
        </Button>
        <input ref={fileInputRef} type='file' accept='application/json' className='hidden' onChange={(event) => void importSettings(event.target.files?.[0])} />
      </div>
      <div className='rounded-2xl border bg-(--m3-surface) p-(--options-field-pad)'>
        <div className='mb-3 flex items-center justify-between gap-3'>
          <div>
            <div className='text-sm font-semibold'>{t('options.extensionLogs')}</div>
            <div className='text-xs text-muted-foreground'>{t('options.diagnosticsCount', { count: snapshot.diagnostics.length })}</div>
          </div>
          <Badge variant={snapshot.diagnostics.some((event) => event.level === 'error') ? 'destructive' : 'quiet'}>
            {snapshot.diagnostics.length ? t('options.logsAvailable') : t('options.noDiagnostics')}
          </Badge>
        </div>
        <ScrollArea className='h-[420px] rounded-xl border bg-(--m3-surface-container-lowest)'>
          <div className='space-y-2 p-3'>
            {snapshot.diagnostics.map((event) => (
              <div key={event.id} className='rounded-lg border bg-(--m3-surface-container-low) p-3'>
                <div className='flex items-center justify-between gap-2'>
                  <div className='flex items-center gap-2'>
                    <Badge variant={event.level === 'error' ? 'destructive' : event.level === 'warn' ? 'warn' : 'quiet'}>{event.level}</Badge>
                    <span className='text-sm font-medium'>{event.code}</span>
                  </div>
                  <span className='text-xs text-muted-foreground'>{new Date(event.timestamp).toLocaleString()}</span>
                </div>
                <p className='mt-1 text-sm text-muted-foreground'>{event.message}</p>
                {event.context
                  ? (
                      <pre className='mt-2 max-h-24 overflow-auto rounded-md bg-background p-2 text-xs text-muted-foreground'>
                        {JSON.stringify(event.context, null, 2)}
                      </pre>
                    )
                  : null}
              </div>
            ))}
            {!snapshot.diagnostics.length
              ? (
                  <div className='flex h-40 items-center justify-center text-sm text-muted-foreground'>
                    <CheckCircle2 className='mr-2 size-4' />
                    {t('options.diagnostics')}
                  </div>
                )
              : null}
          </div>
        </ScrollArea>
      </div>
    </Section>
  );
}
