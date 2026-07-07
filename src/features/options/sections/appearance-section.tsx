import { Paintbrush } from 'lucide-react';

import type { StorageSnapshot } from '@/library/storage';

import type { OptionsTranslator } from '../types';

import { Section } from '../components/section';
import { ChoiceOption } from '../components/choice-option';
import { SettingSwitch } from '../components/setting-switch';

interface AppearanceSectionProps {
  compact: boolean;
  t: OptionsTranslator;
  snapshot: StorageSnapshot;
  persistUi: (patch?: StorageSnapshot['ui']) => Promise<void>;
}

export function AppearanceSection({ compact, persistUi, snapshot, t }: AppearanceSectionProps) {
  return (
    <Section title={t('options.appearance')} icon={Paintbrush} compact={compact}>
      <SettingSwitch compact={compact} label={t('options.motion')} checked={snapshot.ui.motion} onCheckedChange={(motion) => void persistUi({ ...snapshot.ui, motion })} />
      <div className='grid gap-(--options-gap)'>
        <div className='rounded-2xl border bg-(--m3-surface) p-(--options-field-pad)'>
          <div className='mb-2 text-[13px] font-medium'>{t('options.theme')}</div>
          <div className='grid grid-cols-3 overflow-hidden rounded-xl border bg-background max-[760px]:grid-cols-1'>
            <ChoiceOption
              compact={compact}
              active={snapshot.ui.theme === 'system'}
              label={t('options.themeSystem')}
              description={t('options.themeSystemHint')}
              onClick={() => void persistUi({ ...snapshot.ui, theme: 'system' })}
            />
            <ChoiceOption
              compact={compact}
              active={snapshot.ui.theme === 'light'}
              label={t('options.themeLight')}
              description={t('options.themeLightHint')}
              onClick={() => void persistUi({ ...snapshot.ui, theme: 'light' })}
            />
            <ChoiceOption
              compact={compact}
              active={snapshot.ui.theme === 'dark'}
              label={t('options.themeDark')}
              description={t('options.themeDarkHint')}
              onClick={() => void persistUi({ ...snapshot.ui, theme: 'dark' })}
            />
          </div>
        </div>
        <div className='rounded-2xl border bg-(--m3-surface) p-(--options-field-pad)'>
          <div className='mb-2 text-[13px] font-medium'>{t('options.density')}</div>
          <div className='grid grid-cols-2 overflow-hidden rounded-xl border bg-background max-[760px]:grid-cols-1'>
            <ChoiceOption
              compact={compact}
              active={snapshot.ui.density === 'comfortable'}
              label={t('options.densityComfortable')}
              description={t('options.densityComfortableHint')}
              onClick={() => void persistUi({ ...snapshot.ui, density: 'comfortable' })}
            />
            <ChoiceOption
              compact={compact}
              active={snapshot.ui.density === 'compact'}
              label={t('options.densityCompact')}
              description={t('options.densityCompactHint')}
              onClick={() => void persistUi({ ...snapshot.ui, density: 'compact' })}
            />
          </div>
        </div>
      </div>
    </Section>
  );
}
