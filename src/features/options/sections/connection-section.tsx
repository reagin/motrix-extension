import { Activity, Plug, Save } from 'lucide-react';

import type { StorageSnapshot } from '@/library/storage';

import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { StatusDot } from '@/components/motrix/status-dot';

import type { ConnectionResult, OptionsTranslator } from '../types';

import { Field } from '../components/field';
import { Section } from '../components/section';

interface ConnectionSectionProps {
  compact: boolean;
  t: OptionsTranslator;
  snapshot: StorageSnapshot;
  testConnection: () => Promise<void>;
  persistConnection: () => Promise<void>;
  connectionResult: ConnectionResult | null;
  updateConnection: (patch: Partial<StorageSnapshot['connection']>) => void;
}

export function ConnectionSection({
  compact,
  connectionResult,
  persistConnection,
  snapshot,
  t,
  testConnection,
  updateConnection,
}: ConnectionSectionProps) {
  return (
    <Section title={t('options.connection')} icon={Plug} compact={compact}>
      <div className='grid grid-cols-3 gap-(--options-gap) max-[860px]:grid-cols-1'>
        <Field label={t('options.host')} compact={compact}>
          <Input
            value={snapshot.connection.host}
            onChange={(event) => updateConnection({ host: event.target.value })}
          />
        </Field>
        <Field label={t('options.port')} compact={compact}>
          <Input
            type='number'
            value={snapshot.connection.port}
            onChange={(event) => updateConnection({ port: Number(event.target.value) })}
          />
        </Field>
        <Field label={t('options.path')} compact={compact}>
          <Input
            value={snapshot.connection.path}
            onChange={(event) => updateConnection({ path: event.target.value })}
          />
        </Field>
      </div>
      <Field label={t('options.secret')} compact={compact}>
        <Input
          type='password'
          value={snapshot.connection.secret}
          onChange={(event) => updateConnection({ secret: event.target.value })}
        />
      </Field>
      <div className='flex items-center justify-between gap-3 rounded-xl border bg-(--m3-surface) p-(--options-field-pad) max-[760px]:flex-col max-[760px]:items-stretch'>
        <div className='flex items-center gap-2'>
          {connectionResult ? <StatusDot ok={connectionResult.ok} /> : <Activity className='size-4 text-muted-foreground' />}
          <span className='text-sm'>
            {connectionResult?.message ?? `${snapshot.connection.host}:${snapshot.connection.port}${snapshot.connection.path}`}
          </span>
        </div>
        <div className='flex gap-2 max-[760px]:justify-end'>
          <Button variant='outline' onClick={() => void testConnection()}>{t('common.test')}</Button>
          <Button onClick={() => void persistConnection()}>
            <Save />
            {t('common.save')}
          </Button>
        </div>
      </div>
    </Section>
  );
}
