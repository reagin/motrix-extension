import { toast, Toaster } from 'sonner';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Activity, CheckCircle2, ChevronDown, Download, FileDown, FileUp, Languages, Paintbrush, Plug, RotateCcw, Save, Shield, Trash2, Wrench } from 'lucide-react';

import { cn } from '@/src/lib/utils';
import { useI18n } from '@/src/hooks/use-i18n';
import { useTheme } from '@/src/hooks/use-theme';
import { Badge } from '@/src/components/ui/badge';
import { Input } from '@/src/components/ui/input';
import { Label } from '@/src/components/ui/label';
import { Button } from '@/src/components/ui/button';
import { Switch } from '@/src/components/ui/switch';
import { sendRuntimeMessage } from '@/src/lib/runtime';
import { Textarea } from '@/src/components/ui/textarea';
import { Separator } from '@/src/components/ui/separator';
import { ScrollArea } from '@/src/components/ui/scroll-area';
import { StatusDot } from '@/src/components/motrix/status-dot';
import { localeDisplayEntries } from '@/src/lib/i18n/dictionaries';
import { DEFAULT_STORAGE, type SiteRule, type StorageSnapshot, StorageSnapshotSchema } from '@/src/lib/storage';
import { Sidebar, SidebarContent, SidebarGroup, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarProvider } from '@/src/components/ui/sidebar';

type SectionId = 'connection' | 'download' | 'rules' | 'appearance' | 'language' | 'maintenance';
type IconComponent = React.ComponentType<{ className?: string }>;
interface ConnectionResult { ok: boolean; message: string; latencyMs?: number }
interface SectionProps { title: string; compact: boolean; icon: IconComponent; children: React.ReactNode }
interface FieldProps { hint?: string; label: string; compact: boolean; children: React.ReactNode }
interface SettingSwitchProps {
  hint?: string;
  label: string;
  checked: boolean;
  compact?: boolean;
  onCheckedChange: (checked: boolean) => void;
}
interface ChoiceOptionProps {
  label: string;
  active: boolean;
  compact?: boolean;
  onClick: () => void;
  description?: string;
}
type ExtensionPanel = 'allowed' | 'blocked';

const sections: Array<{ id: SectionId; icon: IconComponent; key: string }> = [
  { id: 'connection', icon: Plug, key: 'options.connection' },
  { id: 'download', icon: Download, key: 'options.download' },
  { id: 'rules', icon: Shield, key: 'options.rules' },
  { id: 'appearance', icon: Paintbrush, key: 'options.appearance' },
  { id: 'language', icon: Languages, key: 'options.language' },
  { id: 'maintenance', icon: Wrench, key: 'options.maintenance' },
];
const CHROME_MV3_DOCS_URL = 'https://developer.chrome.com/docs/extensions/develop/migrate/what-is-mv3';
const ARIA2_RPC_DOCS_URL = 'https://aria2.github.io/manual/en/html/aria2c.html';
const badgeLinkClassName = 'rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background';

export default function App() {
  const [snapshot, setSnapshot] = useState<StorageSnapshot>(DEFAULT_STORAGE);
  const [active, setActive] = useState<SectionId>('connection');
  const [rulePattern, setRulePattern] = useState('');
  const [ruleAction, setRuleAction] = useState<'allow' | 'block'>('block');
  const [extensionPanel, setExtensionPanel] = useState<ExtensionPanel>('allowed');
  const [connectionResult, setConnectionResult] = useState<ConnectionResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const { t } = useI18n(snapshot.ui.locale);
  useTheme(snapshot.ui);
  const compact = snapshot.ui.density === 'compact';

  const refresh = useCallback(async () => {
    const response = await sendRuntimeMessage({ type: 'settings-snapshot' });
    if (response.ok && response.snapshot) setSnapshot(response.snapshot);
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const updateConnection = useCallback((patch: Partial<StorageSnapshot['connection']>) => {
    setSnapshot((current) => ({ ...current, connection: { ...current.connection, ...patch } }));
  }, []);

  const updateSettings = useCallback((patch: Partial<StorageSnapshot['settings']>) => {
    setSnapshot((current) => ({ ...current, settings: { ...current.settings, ...patch } }));
  }, []);

  const persistConnection = useCallback(async () => {
    const response = await sendRuntimeMessage({ type: 'update-connection', patch: snapshot.connection });
    if (response.ok && response.snapshot) setSnapshot(response.snapshot);
    toast.success(t('common.saved'));
  }, [snapshot.connection, t]);

  const persistSettings = useCallback(async () => {
    const response = await sendRuntimeMessage({ type: 'update-settings', patch: snapshot.settings });
    if (response.ok && response.snapshot) setSnapshot(response.snapshot);
    toast.success(t('common.saved'));
  }, [snapshot.settings, t]);

  const persistUi = useCallback(async (patch = snapshot.ui) => {
    const response = await sendRuntimeMessage({ type: 'update-ui', patch });
    if (response.ok && response.snapshot) setSnapshot(response.snapshot);
  }, [snapshot.ui]);

  const persistRules = useCallback(async (siteRules = snapshot.siteRules) => {
    const response = await sendRuntimeMessage({ type: 'save-site-rules', siteRules });
    if (response.ok && response.snapshot) setSnapshot(response.snapshot);
  }, [snapshot.siteRules]);

  const testConnection = useCallback(async () => {
    setConnectionResult({ ok: false, message: t('common.checking') });
    const response = await sendRuntimeMessage({ type: 'test-connection', connection: snapshot.connection });
    if (response.ok && response.result && typeof response.result === 'object') {
      setConnectionResult(response.result as ConnectionResult);
    } else {
      setConnectionResult({ ok: false, message: response.ok ? t('status.invalid') : response.message });
    }
  }, [snapshot.connection, t]);

  const addRule = useCallback(async () => {
    const pattern = rulePattern.trim();
    if (!pattern) return;
    const siteRules: SiteRule[] = [
      ...snapshot.siteRules,
      { id: crypto.randomUUID(), pattern, action: ruleAction, enabled: true },
    ];
    setRulePattern('');
    await persistRules(siteRules);
  }, [persistRules, ruleAction, rulePattern, snapshot.siteRules]);

  const exportSettings = useCallback(() => {
    const blob = new Blob([JSON.stringify(snapshot, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'motrix-extension-settings.json';
    link.click();
    URL.revokeObjectURL(url);
  }, [snapshot]);

  const importSettings = useCallback(async (file: File | undefined) => {
    if (!file) return;
    try {
      const parsed = StorageSnapshotSchema.parse(JSON.parse(await file.text()));
      const response = await sendRuntimeMessage({ type: 'replace-snapshot', snapshot: parsed });
      if (response.ok && response.snapshot) setSnapshot(response.snapshot);
      toast.success(t('common.saved'));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : String(error));
    }
  }, [t]);

  const restoreDefaults = useCallback(async () => {
    const response = await sendRuntimeMessage({ type: 'restore-defaults' });
    if (response.ok && response.snapshot) setSnapshot(response.snapshot);
    toast.success(t('common.saved'));
  }, [t]);

  const blockedExtensions = useMemo(() => snapshot.settings.blockedExtensions.join('\n'), [snapshot.settings.blockedExtensions]);
  const allowedExtensions = useMemo(() => snapshot.settings.allowedExtensions.join('\n'), [snapshot.settings.allowedExtensions]);

  return (
    <div className='flex min-h-dvh flex-col bg-(--m3-surface) text-foreground' data-density={snapshot.ui.density}>
      <Toaster richColors position='top-center' />
      <a
        href='#options-content'
        className='sr-only focus:not-sr-only focus:absolute focus:top-3 focus:left-3 focus:z-50 focus:rounded-md focus:bg-primary focus:px-3 focus:py-2 focus:text-sm focus:text-primary-foreground'
      >
        {t('options.skipToContent')}
      </a>
      <header className='border-b bg-(--m3-surface-container-low) px-8 pt-7 pb-4 max-[640px]:px-4 max-[640px]:pt-5'>
        <div className='flex items-center justify-between'>
          <div className='flex items-center gap-3.5'>
            <div className='flex size-10 items-center justify-center rounded-full text-primary'>
              <Activity className='size-7' />
            </div>
            <div>
              <h1 className='text-[22px] font-bold tracking-[-0.01em]'>{t('options.title')}</h1>
              <p className='mt-0.5 text-[13px] text-muted-foreground'>{t('options.subtitle')}</p>
            </div>
          </div>
          <div className='flex items-center gap-2'>
            <a
              href={CHROME_MV3_DOCS_URL}
              target='_blank'
              rel='noreferrer'
              className={badgeLinkClassName}
            >
              <Badge variant='secondary'>Chrome MV3</Badge>
            </a>
            <a
              href={ARIA2_RPC_DOCS_URL}
              target='_blank'
              rel='noreferrer'
              className={badgeLinkClassName}
            >
              <Badge variant='outline'>aria2 RPC</Badge>
            </a>
          </div>
        </div>
      </header>

      <main className='flex flex-1 py-(--options-main-y) max-[640px]:p-0'>
        <SidebarProvider className='min-h-0 flex-1 max-[640px]:flex-col' style={{ '--sidebar-width': '16rem' } as React.CSSProperties}>
          <Sidebar className='border-border max-[640px]:w-full max-[640px]:border-r-0 max-[640px]:border-b'>
            <SidebarContent className='py-2 max-[640px]:py-0'>
              <SidebarGroup className='px-3 py-2 max-[640px]:px-3'>
                <SidebarMenu className='items-center gap-(--options-nav-gap) max-[640px]:flex-row max-[640px]:items-stretch max-[640px]:overflow-x-auto'>
                  {sections.map((section) => {
                    const Icon = section.icon;
                    const isActive = active === section.id;
                    return (
                      <SidebarMenuItem key={section.id} className='w-full max-[640px]:w-auto'>
                        <SidebarMenuButton
                          type='button'
                          isActive={isActive}
                          aria-current={isActive ? 'page' : undefined}
                          onClick={() => setActive(section.id)}
                          className='group mx-auto min-h-12 w-44 justify-start gap-3 rounded-2xl border border-transparent px-3.5 py-(--options-nav-item-y) text-[15px] font-semibold data-[active=true]:border-primary/35 data-[active=true]:shadow-(--m3-shadow-elevated) max-[640px]:min-w-36 max-[640px]:px-3 max-[640px]:py-2 max-[640px]:text-sm'
                        >
                          <span className='flex size-9 shrink-0 items-center justify-center rounded-xl max-[640px]:size-8'>
                            <Icon className='size-5 max-[640px]:size-4' />
                          </span>
                          <span className='min-w-0 truncate'>{t(section.key)}</span>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    );
                  })}
                </SidebarMenu>
              </SidebarGroup>
            </SidebarContent>
          </Sidebar>

          <div id='options-content' className='min-w-0 flex-1 px-6 pt-1 pb-8 max-[640px]:px-4 max-[640px]:pt-4'>
            {active === 'connection'
              ? (
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
                )
              : null}

            {active === 'download'
              ? (
                  <Section title={t('options.download')} icon={Download} compact={compact}>
                    <div className={cn('grid gap-(--options-gap)', compact ? 'grid-cols-2 max-[860px]:grid-cols-1' : 'grid-cols-1')}>
                      <SettingSwitch
                        compact={compact}
                        label={t('popup.interception')}
                        hint={snapshot.settings.enabled ? t('popup.captureOn') : t('popup.captureOff')}
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
                    <Button className='self-start' onClick={() => void persistSettings()}>
                      <Save />
                      {t('common.save')}
                    </Button>
                  </Section>
                )
              : null}

            {active === 'rules'
              ? (
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
                    <Button className='self-start' onClick={() => void persistSettings()}>
                      <Save />
                      {t('common.save')}
                    </Button>
                  </Section>
                )
              : null}

            {active === 'appearance'
              ? (
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
                )
              : null}

            {active === 'language'
              ? (
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
                )
              : null}

            {active === 'maintenance'
              ? (
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
                )
              : null}
          </div>
        </SidebarProvider>
      </main>
    </div>
  );
}

function Section({ title, icon: Icon, compact, children }: SectionProps) {
  return (
    <section className='mx-auto max-w-4xl space-y-(--options-section-gap)'>
      <div className='flex items-center gap-3 px-1'>
        <div className='flex size-11 items-center justify-center rounded-2xl bg-[color-mix(in_srgb,hsl(var(--primary))_12%,transparent)] text-primary'>
          <Icon className='size-5' />
        </div>
        <div>
          <h2 className='text-xl font-bold tracking-[-0.01em]'>{title}</h2>
          <div className='mt-1 h-1 w-10 rounded-full bg-primary/70' />
        </div>
      </div>
      <div className={cn('rounded-3xl border bg-(--m3-surface-container) p-(--options-card-pad) shadow-(--m3-shadow-card)', compact ? 'space-y-2' : 'space-y-3')}>
        {children}
      </div>
    </section>
  );
}

function Field({ label, hint, compact, children }: FieldProps) {
  return (
    <div className='rounded-2xl border bg-(--m3-surface) p-(--options-field-pad)'>
      <div className={cn('flex items-baseline justify-between gap-3', compact ? 'mb-1.5' : 'mb-2')}>
        <Label className='text-[13px]'>{label}</Label>
        {hint ? <p className='max-w-[60%] text-right text-xs/relaxed text-muted-foreground'>{hint}</p> : null}
      </div>
      {children}
    </div>
  );
}

function SettingSwitch({ label, hint, checked, onCheckedChange, compact = false }: SettingSwitchProps) {
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

function ProtocolToggle({ label, checked, onCheckedChange, compact = false }: SettingSwitchProps) {
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

function ChoiceOption({ label, description, active, compact = false, onClick }: ChoiceOptionProps) {
  return (
    <button
      type='button'
      onClick={onClick}
      className={cn(
        'flex min-h-18 cursor-pointer flex-col items-start justify-center border-r px-4 text-left transition-[background-color,color,box-shadow] last:border-r-0 max-[760px]:border-r-0 max-[760px]:border-b max-[760px]:last:border-b-0',
        compact ? 'py-2.5' : 'py-3.5',
        active
          ? 'bg-(--m3-primary-container) text-(--m3-on-primary-container) shadow-[inset_0_0_0_1px_hsl(var(--primary))]'
          : 'text-muted-foreground hover:bg-[color-mix(in_srgb,var(--m3-on-surface)_6%,transparent)] hover:text-foreground',
      )}
    >
      <span className='flex items-center gap-2 text-sm font-semibold'>
        {active ? <CheckCircle2 className='size-4 text-primary' /> : null}
        {label}
      </span>
      {description ? <span className='mt-1 text-xs/relaxed opacity-70'>{description}</span> : null}
    </button>
  );
}

function splitLines(value: string): string[] {
  return value
    .split(/\n|,/)
    .map((item) => item.trim().replace(/^\./, '').toLowerCase())
    .filter(Boolean);
}
