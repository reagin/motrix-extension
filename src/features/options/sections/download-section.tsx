import { Download, Save } from 'lucide-react';

import type { StorageSnapshot } from '@/library/storage';

import { cn } from '@/library/utils';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';

import type { OptionsTranslator } from '../types';

import { Field } from '../components/field';
import { Section } from '../components/section';
import { SettingSwitch } from '../components/setting-switch';
import { ProtocolToggle } from '../components/protocol-toggle';

interface DownloadSectionProps {
  compact: boolean;
  t: OptionsTranslator;
  snapshot: StorageSnapshot;
  persistSettings: () => Promise<void>;
  updateSettings: (patch: Partial<StorageSnapshot['settings']>) => void;
}

export function DownloadSection({ compact, persistSettings, snapshot, t, updateSettings }: DownloadSectionProps) {
  return (
    <Section title={t('options.download')} icon={Download} compact={compact}>
      <div className={cn('grid gap-(--options-gap)', compact ? 'grid-cols-2 max-[860px]:grid-cols-1' : 'grid-cols-1')}>
        <SettingSwitch
          compact={compact}
          label={t('popup.interception')}
          checked={snapshot.settings.enabled}
          onCheckedChange={(enabled) => updateSettings({ enabled })}
        />
        <SettingSwitch
          compact={compact}
          label={t('options.hideChromeDownload')}
          checked={snapshot.settings.hideChromeDownload}
          onCheckedChange={(hideChromeDownload) => updateSettings({ hideChromeDownload })}
        />
      </div>

      <div className='rounded-2xl border bg-(--m3-surface) p-(--options-field-pad)'>
        <div className='mb-2 text-xs font-semibold tracking-[0.06em] text-muted-foreground uppercase'>{t('options.protocols')}</div>
        <div className={cn('grid gap-2', compact ? 'grid-cols-4 max-[760px]:grid-cols-2' : 'grid-cols-2 max-[760px]:grid-cols-1')}>
          <ProtocolToggle
            compact={compact}
            label='HTTP'
            checked={snapshot.settings.interceptHttp}
            onCheckedChange={(interceptHttp) => updateSettings({ interceptHttp })}
          />
          <ProtocolToggle
            compact={compact}
            label='magnet'
            checked={snapshot.settings.interceptMagnet}
            onCheckedChange={(interceptMagnet) => updateSettings({ interceptMagnet })}
          />
          <ProtocolToggle
            compact={compact}
            label='ed2k'
            checked={snapshot.settings.interceptEd2k}
            onCheckedChange={(interceptEd2k) => updateSettings({ interceptEd2k })}
          />
          <ProtocolToggle
            compact={compact}
            label='thunder'
            checked={snapshot.settings.interceptThunder}
            onCheckedChange={(interceptThunder) => updateSettings({ interceptThunder })}
          />
        </div>
      </div>
      <Separator />
      <div className={cn('grid gap-(--options-gap)', compact ? 'grid-cols-3 max-[920px]:grid-cols-1' : 'grid-cols-1')}>
        <SettingSwitch
          compact={compact}
          label={t('options.forwardCookies')}
          checked={snapshot.settings.forwardCookies}
          onCheckedChange={(forwardCookies) => updateSettings({ forwardCookies })}
        />
        <SettingSwitch
          compact={compact}
          label={t('options.forwardHeaders')}
          checked={snapshot.settings.forwardHeaders}
          onCheckedChange={(forwardHeaders) => updateSettings({ forwardHeaders })}
        />
        <SettingSwitch
          compact={compact}
          label={t('options.autoLaunch')}
          checked={snapshot.settings.autoLaunchApp}
          onCheckedChange={(autoLaunchApp) => updateSettings({ autoLaunchApp })}
        />
      </div>
      <div className={cn('grid gap-(--options-gap)', compact ? 'grid-cols-[1.4fr_0.8fr] max-[860px]:grid-cols-1' : 'grid-cols-2 max-[760px]:grid-cols-1')}>
        <Field label={t('options.defaultDir')} hint={t('options.defaultDirHint')} compact={compact}>
          <Input
            value={snapshot.settings.defaultDir}
            onChange={(event) => updateSettings({ defaultDir: event.target.value })}
          />
        </Field>
        <Field label={t('options.minSize')} hint={t('options.minSizeHint')} compact={compact}>
          <Input
            type='number'
            value={snapshot.settings.minFileSizeBytes}
            onChange={(event) => updateSettings({ minFileSizeBytes: Number(event.target.value) })}
          />
        </Field>
      </div>
      <div className='flex justify-end'>
        <Button onClick={() => void persistSettings()}>
          <Save />
          {t('common.save')}
        </Button>
      </div>
    </Section>
  );
}
