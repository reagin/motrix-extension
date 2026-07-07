import { CheckCircle2, Languages } from 'lucide-react';

import type { StorageSnapshot } from '@/library/storage';

import { cn } from '@/library/utils';
import { localeDisplayEntries } from '@/library/i18n/dictionaries';

import type { OptionsTranslator } from '../types';

import { Section } from '../components/section';

interface LanguageSectionProps {
  compact: boolean;
  t: OptionsTranslator;
  snapshot: StorageSnapshot;
  persistUi: (patch?: StorageSnapshot['ui']) => Promise<void>;
}

export function LanguageSection({ compact, persistUi, snapshot, t }: LanguageSectionProps) {
  return (
    <Section title={t('options.language')} icon={Languages} compact={compact}>
      <div className='grid w-full grid-cols-2 gap-(--options-gap) max-[760px]:grid-cols-1'>
        {localeDisplayEntries.map((entry) => {
          const activeLocale = snapshot.ui.locale === entry.id;
          const label = entry.endonym === entry.exonym ? entry.endonym : `${entry.endonym} / ${entry.exonym}`;
          return (
            <button
              key={entry.id}
              type='button'
              onClick={() => void persistUi({ ...snapshot.ui, locale: entry.id })}
              className={cn(
                'flex min-h-24 w-full cursor-pointer items-center gap-3 rounded-[10px] border px-4 py-3 text-left transition-[background-color,border-color,box-shadow,color]',
                activeLocale
                  ? 'border-primary bg-(--m3-primary-container) text-(--m3-on-primary-container) shadow-[0_0_0_1px_hsl(var(--primary))]'
                  : 'border-(--m3-outline-variant) bg-transparent hover:bg-(--m3-surface-container-high)',
              )}
            >
              <div className='flex size-9 shrink-0 items-center justify-center rounded-full bg-[color-mix(in_srgb,hsl(var(--primary))_12%,transparent)] text-primary'>
                <Languages className='size-4' />
              </div>
              <div className='min-w-0 flex-1'>
                <div className='text-sm font-medium'>{label}</div>
                <div className='mt-0.5 text-xs opacity-65'>{entry.description}</div>
              </div>
              {activeLocale ? <CheckCircle2 className='size-[18px] shrink-0 text-primary' /> : null}
            </button>
          );
        })}
      </div>
    </Section>
  );
}
