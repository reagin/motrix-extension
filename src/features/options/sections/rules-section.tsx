import { useMemo, useState } from 'react';
import { ChevronDown, Save, Shield, Trash2 } from 'lucide-react';

import type { SiteRule, StorageSnapshot } from '@/library/storage';

import { cn } from '@/library/utils';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';

import type { ExtensionPanel, OptionsTranslator } from '../types';

import { Field } from '../components/field';
import { Section } from '../components/section';

interface RulesSectionProps {
  compact: boolean;
  t: OptionsTranslator;
  snapshot: StorageSnapshot;
  persistSettings: () => Promise<void>;
  persistRules: (siteRules?: SiteRule[]) => Promise<void>;
  updateSettings: (patch: Partial<StorageSnapshot['settings']>) => void;
}

export function RulesSection({
  compact,
  persistRules,
  persistSettings,
  snapshot,
  t,
  updateSettings,
}: RulesSectionProps) {
  const [rulePattern, setRulePattern] = useState('');
  const [ruleAction, setRuleAction] = useState<'allow' | 'block'>('block');
  const [extensionPanel, setExtensionPanel] = useState<ExtensionPanel>('allowed');

  const blockedExtensions = useMemo(() => snapshot.settings.blockedExtensions.join('\n'), [snapshot.settings.blockedExtensions]);
  const allowedExtensions = useMemo(() => snapshot.settings.allowedExtensions.join('\n'), [snapshot.settings.allowedExtensions]);

  const addRule = async () => {
    const pattern = rulePattern.trim();
    if (!pattern) return;
    const siteRules: SiteRule[] = [
      ...snapshot.siteRules,
      { id: crypto.randomUUID(), pattern, action: ruleAction, enabled: true },
    ];
    setRulePattern('');
    await persistRules(siteRules);
  };

  return (
    <Section title={t('options.rules')} icon={Shield} compact={compact}>
      <div className='rounded-2xl border bg-(--m3-surface) p-(--options-field-pad)'>
        <div className='grid grid-cols-[minmax(0,1fr)_minmax(9rem,12rem)_auto] items-end gap-3 max-[860px]:grid-cols-1'>
          <Field label={t('options.rulePattern')} compact={compact}>
            <Input value={rulePattern} placeholder={t('options.rulePatternPlaceholder')} onChange={(event) => setRulePattern(event.target.value)} />
          </Field>
          <Field label={t('options.ruleAction')} compact={compact}>
            <div className='grid grid-cols-2 overflow-hidden rounded-md border bg-background'>
              <button
                type='button'
                onClick={() => setRuleAction('allow')}
                className={cn(
                  'h-9 cursor-pointer border-r px-3 text-sm font-medium',
                  ruleAction === 'allow'
                    ? 'bg-[color-mix(in_srgb,var(--m3-success)_16%,transparent)] text-(--m3-success)'
                    : 'text-muted-foreground hover:bg-[color-mix(in_srgb,var(--m3-on-surface)_6%,transparent)]',
                )}
              >
                {t('options.allow')}
              </button>
              <button
                type='button'
                onClick={() => setRuleAction('block')}
                className={cn(
                  'h-9 cursor-pointer px-3 text-sm font-medium',
                  ruleAction === 'block'
                    ? 'bg-destructive/12 text-destructive'
                    : 'text-muted-foreground hover:bg-[color-mix(in_srgb,var(--m3-on-surface)_6%,transparent)]',
                )}
              >
                {t('options.block')}
              </button>
            </div>
          </Field>
          <Button className='h-full min-h-20 self-stretch max-[860px]:min-h-11' onClick={() => void addRule()}>
            {t('common.add')}
          </Button>
        </div>
      </div>
      <div className='space-y-2'>
        {snapshot.siteRules.map((rule) => (
          <div key={rule.id} className='flex items-center gap-3 rounded-xl border bg-(--m3-surface) p-3'>
            <Switch
              checked={rule.enabled}
              onCheckedChange={(enabled) => {
                void persistRules(
                  snapshot.siteRules.map((item) => item.id === rule.id ? { ...item, enabled } : item),
                );
              }}
            />
            <Badge variant={rule.action === 'allow' ? 'good' : 'destructive'}>{rule.action}</Badge>
            <span className='min-w-0 flex-1 truncate text-sm'>{rule.pattern}</span>
            <Button variant='quiet' size='icon' onClick={() => void persistRules(snapshot.siteRules.filter((item) => item.id !== rule.id))}><Trash2 /></Button>
          </div>
        ))}
      </div>
      {!snapshot.siteRules.length
        ? (
            <div className='rounded-xl border border-dashed bg-(--m3-surface) p-4 text-sm text-muted-foreground'>
              {t('options.noRules')}
            </div>
          )
        : null}
      <Separator />
      <div className='rounded-2xl border bg-(--m3-surface) p-(--options-field-pad)'>
        <div className='mb-3 flex items-center justify-between gap-3 max-[640px]:flex-col max-[640px]:items-stretch'>
          <div>
            <div className='text-sm font-semibold'>{t('options.extensionFilters')}</div>
            <div className='text-xs text-muted-foreground'>{t('options.extensionFilterHint')}</div>
          </div>
          <div className='grid grid-cols-2 overflow-hidden rounded-lg border bg-background'>
            <button
              type='button'
              onClick={() => setExtensionPanel('allowed')}
              className={cn(
                'flex min-h-10 cursor-pointer items-center justify-center gap-2 border-r px-3 text-sm font-semibold',
                extensionPanel === 'allowed'
                  ? 'bg-(--m3-primary-container) text-(--m3-on-primary-container)'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              {t('options.allowedExtensions')}
              <ChevronDown className={cn('size-4 transition-transform', extensionPanel === 'allowed' && 'rotate-180')} />
            </button>
            <button
              type='button'
              onClick={() => setExtensionPanel('blocked')}
              className={cn(
                'flex min-h-10 cursor-pointer items-center justify-center gap-2 px-3 text-sm font-semibold',
                extensionPanel === 'blocked'
                  ? 'bg-(--m3-primary-container) text-(--m3-on-primary-container)'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              {t('options.blockedExtensions')}
              <ChevronDown className={cn('size-4 transition-transform', extensionPanel === 'blocked' && 'rotate-180')} />
            </button>
          </div>
        </div>
        {extensionPanel === 'allowed'
          ? (
              <Field label={t('options.allowedExtensions')} compact={compact}>
                <Textarea
                  className='min-h-28'
                  value={allowedExtensions}
                  onChange={(event) => updateSettings({
                    allowedExtensions: splitLines(event.target.value),
                  })}
                />
              </Field>
            )
          : (
              <Field label={t('options.blockedExtensions')} compact={compact}>
                <Textarea
                  className='min-h-28'
                  value={blockedExtensions}
                  onChange={(event) => updateSettings({
                    blockedExtensions: splitLines(event.target.value),
                  })}
                />
              </Field>
            )}
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

function splitLines(value: string): string[] {
  return value
    .split(/\n|,/)
    .map((item) => item.trim().replace(/^\./, '').toLowerCase())
    .filter(Boolean);
}
