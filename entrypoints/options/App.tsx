import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Activity,
  Braces,
  CheckCircle2,
  Download,
  FileDown,
  FileUp,
  Languages,
  Paintbrush,
  Plug,
  RotateCcw,
  Save,
  Shield,
  Trash2,
  Wrench,
} from 'lucide-react';
import { toast, Toaster } from 'sonner';
import { Button } from '@/src/components/ui/button';
import { Badge } from '@/src/components/ui/badge';
import { Input } from '@/src/components/ui/input';
import { Label } from '@/src/components/ui/label';
import { ScrollArea } from '@/src/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/src/components/ui/select';
import { Separator } from '@/src/components/ui/separator';
import { Switch } from '@/src/components/ui/switch';
import { Textarea } from '@/src/components/ui/textarea';
import { StatusDot } from '@/src/components/motrix/status-dot';
import { localeDisplayEntries, type Locale } from '@/src/lib/i18n/dictionaries';
import { parseRpcUrl } from '@/src/lib/rpc';
import { DEFAULT_STORAGE, StorageSnapshotSchema, type SiteRule, type StorageSnapshot } from '@/src/lib/storage';
import { sendRuntimeMessage } from '@/src/lib/runtime';
import { useI18n } from '@/src/hooks/use-i18n';
import { useTheme } from '@/src/hooks/use-theme';
import { cn } from '@/src/lib/utils';

type SectionId = 'connection' | 'download' | 'rules' | 'appearance' | 'language' | 'maintenance';

const sections: Array<{ id: SectionId; icon: React.ComponentType<{ className?: string }>; key: string }> = [
  { id: 'connection', icon: Plug, key: 'options.connection' },
  { id: 'download', icon: Download, key: 'options.download' },
  { id: 'rules', icon: Shield, key: 'options.rules' },
  { id: 'appearance', icon: Paintbrush, key: 'options.appearance' },
  { id: 'language', icon: Languages, key: 'options.language' },
  { id: 'maintenance', icon: Wrench, key: 'options.maintenance' },
];

export default function App() {
  const [snapshot, setSnapshot] = useState<StorageSnapshot>(DEFAULT_STORAGE);
  const [active, setActive] = useState<SectionId>('connection');
  const [rpcUrl, setRpcUrl] = useState('');
  const [rulePattern, setRulePattern] = useState('');
  const [ruleAction, setRuleAction] = useState<'allow' | 'block'>('block');
  const [connectionResult, setConnectionResult] = useState<{ ok: boolean; message: string; latencyMs?: number } | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const { t } = useI18n(snapshot.ui.locale);
  useTheme(snapshot.ui);

  useEffect(() => {
    void refresh();
  }, []);

  const refresh = async () => {
    const response = await sendRuntimeMessage({ type: 'settings-snapshot' });
    if (response.ok && response.snapshot) setSnapshot(response.snapshot);
  };

  const persistConnection = async () => {
    const response = await sendRuntimeMessage({ type: 'update-connection', patch: snapshot.connection });
    if (response.ok && response.snapshot) setSnapshot(response.snapshot);
    toast.success(t('common.saved'));
  };

  const persistSettings = async () => {
    const response = await sendRuntimeMessage({ type: 'update-settings', patch: snapshot.settings });
    if (response.ok && response.snapshot) setSnapshot(response.snapshot);
    toast.success(t('common.saved'));
  };

  const persistUi = async (patch = snapshot.ui) => {
    const response = await sendRuntimeMessage({ type: 'update-ui', patch });
    if (response.ok && response.snapshot) setSnapshot(response.snapshot);
  };

  const persistRules = async (siteRules = snapshot.siteRules) => {
    const response = await sendRuntimeMessage({ type: 'save-site-rules', siteRules });
    if (response.ok && response.snapshot) setSnapshot(response.snapshot);
  };

  const testConnection = async () => {
    setConnectionResult({ ok: false, message: t('common.checking') });
    const response = await sendRuntimeMessage({ type: 'test-connection', connection: snapshot.connection });
    if (response.ok && response.result && typeof response.result === 'object') {
      setConnectionResult(response.result as { ok: boolean; message: string; latencyMs?: number });
    } else {
      setConnectionResult({ ok: false, message: response.ok ? t('status.invalid') : response.message });
    }
  };

  const applyRpcUrl = () => {
    try {
      const patch = parseRpcUrl(rpcUrl);
      setSnapshot((current) => ({ ...current, connection: { ...current.connection, ...patch } }));
      toast.success(t('common.saved'));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : String(error));
    }
  };

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

  const exportSettings = () => {
    const blob = new Blob([JSON.stringify(snapshot, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'motrix-extension-settings.json';
    link.click();
    URL.revokeObjectURL(url);
  };

  const importSettings = async (file: File | undefined) => {
    if (!file) return;
    try {
      const parsed = StorageSnapshotSchema.parse(JSON.parse(await file.text()));
      const response = await sendRuntimeMessage({ type: 'replace-snapshot', snapshot: parsed });
      if (response.ok && response.snapshot) setSnapshot(response.snapshot);
      toast.success(t('common.saved'));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : String(error));
    }
  };

  const restoreDefaults = async () => {
    const response = await sendRuntimeMessage({ type: 'restore-defaults' });
    if (response.ok && response.snapshot) setSnapshot(response.snapshot);
    toast.success(t('common.saved'));
  };

  const blockedExtensions = useMemo(() => snapshot.settings.blockedExtensions.join('\n'), [snapshot.settings.blockedExtensions]);
  const allowedExtensions = useMemo(() => snapshot.settings.allowedExtensions.join('\n'), [snapshot.settings.allowedExtensions]);

  return (
    <div className="flex min-h-screen flex-col bg-[var(--m3-surface)] text-foreground">
      <Toaster richColors position="top-center" />
      <header className="border-b bg-[var(--m3-surface-container-low)] px-8 pb-4 pt-7">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3.5">
            <div className="flex size-10 items-center justify-center rounded-full text-primary">
              <Activity className="size-7" />
            </div>
            <div>
              <h1 className="text-[22px] font-bold tracking-[-0.01em]">{t('options.title')}</h1>
              <p className="mt-0.5 text-[13px] text-muted-foreground">{t('options.subtitle')}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary">Chrome MV3</Badge>
            <Badge variant="outline">aria2 RPC</Badge>
          </div>
        </div>
      </header>

      <main className="flex flex-1 px-6 py-4 max-[640px]:flex-col max-[640px]:px-0 max-[640px]:py-0">
        <nav className="flex min-w-[170px] flex-1 flex-col gap-0.5 p-2 max-[640px]:w-full max-[640px]:min-w-0 max-[640px]:flex-row max-[640px]:overflow-x-auto max-[640px]:px-3">
          {sections.map((section) => {
            const Icon = section.icon;
            return (
              <button
                key={section.id}
                onClick={() => setActive(section.id)}
                className={cn(
                  'flex w-full items-center gap-2.5 rounded-[10px] px-3.5 py-2.5 text-left text-[13px] font-medium transition-colors max-[640px]:min-w-16 max-[640px]:flex-col max-[640px]:gap-1 max-[640px]:text-center max-[640px]:text-[11px]',
                  active === section.id
                    ? 'bg-[var(--m3-primary-container)] text-[var(--m3-on-primary-container)] hover:brightness-95'
                    : 'text-muted-foreground hover:bg-[color-mix(in_srgb,var(--m3-on-surface)_6%,transparent)] hover:text-foreground',
                )}
              >
                <Icon className="size-4" />
                {t(section.key)}
              </button>
            );
          })}
        </nav>

        <div className="min-w-0 flex-[3] border-l border-border px-4 pb-8 pt-2 max-[640px]:border-l-0 max-[640px]:px-4 max-[640px]:pt-4">
          {active === 'connection' ? (
            <Section title={t('options.connection')} icon={Plug}>
              <div className="grid grid-cols-3 gap-4">
                <Field label={t('options.host')}>
                  <Input value={snapshot.connection.host} onChange={(event) => setSnapshot((s) => ({ ...s, connection: { ...s.connection, host: event.target.value } }))} />
                </Field>
                <Field label={t('options.port')}>
                  <Input type="number" value={snapshot.connection.port} onChange={(event) => setSnapshot((s) => ({ ...s, connection: { ...s.connection, port: Number(event.target.value) } }))} />
                </Field>
                <Field label={t('options.path')}>
                  <Input value={snapshot.connection.path} onChange={(event) => setSnapshot((s) => ({ ...s, connection: { ...s.connection, path: event.target.value } }))} />
                </Field>
              </div>
              <Field label={t('options.secret')}>
                <Input type="password" value={snapshot.connection.secret} onChange={(event) => setSnapshot((s) => ({ ...s, connection: { ...s.connection, secret: event.target.value } }))} />
              </Field>
              <div className="grid grid-cols-[1fr_auto] gap-2">
                <Field label={t('options.rpcUrl')}>
                  <Input value={rpcUrl} placeholder={t('options.rpcUrlPlaceholder')} onChange={(event) => setRpcUrl(event.target.value)} />
                </Field>
                <Button className="mt-6" variant="outline" onClick={applyRpcUrl}>
                  <Braces />
                  {t('options.parseRpcUrl')}
                </Button>
              </div>
              <div className="flex items-center justify-between rounded-xl border bg-[var(--m3-surface)] p-3">
                <div className="flex items-center gap-2">
                  {connectionResult ? <StatusDot ok={connectionResult.ok} /> : <Activity className="size-4 text-muted-foreground" />}
                  <span className="text-sm">
                    {connectionResult?.message ?? `${snapshot.connection.host}:${snapshot.connection.port}${snapshot.connection.path}`}
                  </span>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => void testConnection()}>{t('common.test')}</Button>
                  <Button onClick={() => void persistConnection()}><Save />{t('common.save')}</Button>
                </div>
              </div>
            </Section>
          ) : null}

          {active === 'download' ? (
            <Section title={t('options.download')} icon={Download}>
              <SettingSwitch label={t('popup.interception')} checked={snapshot.settings.enabled} onCheckedChange={(enabled) => setSnapshot((s) => ({ ...s, settings: { ...s.settings, enabled } }))} />
              <div className="grid grid-cols-2 gap-3">
                <SettingSwitch label="HTTP / HTTPS" checked={snapshot.settings.interceptHttp} onCheckedChange={(value) => setSnapshot((s) => ({ ...s, settings: { ...s.settings, interceptHttp: value } }))} />
                <SettingSwitch label="magnet" checked={snapshot.settings.interceptMagnet} onCheckedChange={(value) => setSnapshot((s) => ({ ...s, settings: { ...s.settings, interceptMagnet: value } }))} />
                <SettingSwitch label="ed2k" checked={snapshot.settings.interceptEd2k} onCheckedChange={(value) => setSnapshot((s) => ({ ...s, settings: { ...s.settings, interceptEd2k: value } }))} />
                <SettingSwitch label="thunder" checked={snapshot.settings.interceptThunder} onCheckedChange={(value) => setSnapshot((s) => ({ ...s, settings: { ...s.settings, interceptThunder: value } }))} />
              </div>
              <Separator />
              <div className="grid grid-cols-2 gap-3">
                <SettingSwitch label={t('options.forwardCookies')} checked={snapshot.settings.forwardCookies} onCheckedChange={(value) => setSnapshot((s) => ({ ...s, settings: { ...s.settings, forwardCookies: value } }))} />
                <SettingSwitch label={t('options.forwardHeaders')} checked={snapshot.settings.forwardHeaders} onCheckedChange={(value) => setSnapshot((s) => ({ ...s, settings: { ...s.settings, forwardHeaders: value } }))} />
                <SettingSwitch label={t('options.autoLaunch')} checked={snapshot.settings.autoLaunchApp} onCheckedChange={(value) => setSnapshot((s) => ({ ...s, settings: { ...s.settings, autoLaunchApp: value } }))} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Field label={t('options.defaultDir')} hint={t('options.defaultDirHint')}>
                  <Input value={snapshot.settings.defaultDir} onChange={(event) => setSnapshot((s) => ({ ...s, settings: { ...s.settings, defaultDir: event.target.value } }))} />
                </Field>
                <Field label={t('options.minSize')} hint={t('options.minSizeHint')}>
                  <Input type="number" value={snapshot.settings.minFileSizeBytes} onChange={(event) => setSnapshot((s) => ({ ...s, settings: { ...s.settings, minFileSizeBytes: Number(event.target.value) } }))} />
                </Field>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Allowed extensions">
                  <Textarea value={allowedExtensions} onChange={(event) => setSnapshot((s) => ({ ...s, settings: { ...s.settings, allowedExtensions: splitLines(event.target.value) } }))} />
                </Field>
                <Field label="Blocked extensions">
                  <Textarea value={blockedExtensions} onChange={(event) => setSnapshot((s) => ({ ...s, settings: { ...s.settings, blockedExtensions: splitLines(event.target.value) } }))} />
                </Field>
              </div>
              <Button className="self-start" onClick={() => void persistSettings()}><Save />{t('common.save')}</Button>
            </Section>
          ) : null}

          {active === 'rules' ? (
            <Section title={t('options.rules')} icon={Shield}>
              <div className="grid grid-cols-[1fr_140px_auto] items-end gap-2">
                <Field label={t('options.rulePattern')}>
                  <Input value={rulePattern} placeholder={t('options.rulePatternPlaceholder')} onChange={(event) => setRulePattern(event.target.value)} />
                </Field>
                <Field label={t('options.ruleAction')}>
                  <Select value={ruleAction} onValueChange={(value) => setRuleAction(value as 'allow' | 'block')}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="allow">{t('options.allow')}</SelectItem>
                      <SelectItem value="block">{t('options.block')}</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>
                <Button onClick={() => void addRule()}>{t('common.add')}</Button>
              </div>
              <div className="space-y-2">
                {snapshot.siteRules.map((rule) => (
                  <div key={rule.id} className="flex items-center gap-3 rounded-xl border bg-[var(--m3-surface)] p-3">
                    <Switch checked={rule.enabled} onCheckedChange={(enabled) => void persistRules(snapshot.siteRules.map((item) => item.id === rule.id ? { ...item, enabled } : item))} />
                    <Badge variant={rule.action === 'allow' ? 'good' : 'destructive'}>{rule.action}</Badge>
                    <span className="min-w-0 flex-1 truncate text-sm">{rule.pattern}</span>
                    <Button variant="quiet" size="icon" onClick={() => void persistRules(snapshot.siteRules.filter((item) => item.id !== rule.id))}><Trash2 /></Button>
                  </div>
                ))}
              </div>
            </Section>
          ) : null}

          {active === 'appearance' ? (
            <Section title={t('options.appearance')} icon={Paintbrush}>
              <div className="grid grid-cols-2 gap-4">
                <Field label={t('options.theme')}>
                  <Select value={snapshot.ui.theme} onValueChange={(theme) => void persistUi({ ...snapshot.ui, theme: theme as StorageSnapshot['ui']['theme'] })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="system">System</SelectItem>
                      <SelectItem value="light">Light</SelectItem>
                      <SelectItem value="dark">Dark</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>
                <Field label={t('options.density')}>
                  <Select value={snapshot.ui.density} onValueChange={(density) => void persistUi({ ...snapshot.ui, density: density as StorageSnapshot['ui']['density'] })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="comfortable">Comfortable</SelectItem>
                      <SelectItem value="compact">Compact</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>
              </div>
              <SettingSwitch label={t('options.motion')} checked={snapshot.ui.motion} onCheckedChange={(motion) => void persistUi({ ...snapshot.ui, motion })} />
            </Section>
          ) : null}

          {active === 'language' ? (
            <Section title={t('options.language')} icon={Languages}>
              <div className="flex max-w-xl flex-col gap-1.5">
                {localeDisplayEntries.map((entry) => {
                  const activeLocale = snapshot.ui.locale === entry.id;
                  const label = entry.endonym === entry.exonym ? entry.endonym : `${entry.endonym} / ${entry.exonym}`;
                  return (
                    <button
                      key={entry.id}
                      type="button"
                      onClick={() => void persistUi({ ...snapshot.ui, locale: entry.id })}
                      className={cn(
                        'flex w-full items-center gap-3 rounded-[10px] border px-4 py-3 text-left transition-[background-color,border-color,box-shadow,color]',
                        activeLocale
                          ? 'border-primary bg-[var(--m3-primary-container)] text-[var(--m3-on-primary-container)] shadow-[0_0_0_1px_hsl(var(--primary))]'
                          : 'border-[var(--m3-outline-variant)] bg-transparent hover:bg-[var(--m3-surface-container-high)]',
                      )}
                    >
                      <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-[color-mix(in_srgb,hsl(var(--primary))_12%,transparent)] text-primary">
                        <Languages className="size-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-medium">{label}</div>
                        <div className="mt-0.5 text-xs opacity-65">{entry.description}</div>
                      </div>
                      {activeLocale ? <CheckCircle2 className="size-[18px] shrink-0 text-primary" /> : null}
                    </button>
                  );
                })}
              </div>
            </Section>
          ) : null}

          {active === 'maintenance' ? (
            <Section title={t('options.maintenance')} icon={Wrench}>
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" onClick={exportSettings}><FileDown />{t('options.exportSettings')}</Button>
                <Button variant="outline" onClick={() => fileInputRef.current?.click()}><FileUp />{t('options.importSettings')}</Button>
                <Button variant="outline" onClick={() => void sendRuntimeMessage({ type: 'clear-diagnostics' }).then(refresh)}><Trash2 />{t('options.clearDiagnostics')}</Button>
                <Button variant="destructive" onClick={() => void restoreDefaults()}><RotateCcw />{t('options.restoreDefaults')}</Button>
                <input ref={fileInputRef} type="file" accept="application/json" className="hidden" onChange={(event) => void importSettings(event.target.files?.[0])} />
              </div>
              <ScrollArea className="h-[420px] rounded-xl border bg-[var(--m3-surface)]">
                <div className="space-y-2 p-3">
                  {snapshot.diagnostics.map((event) => (
                    <div key={event.id} className="rounded-lg border bg-[var(--m3-surface-container-low)] p-3">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <Badge variant={event.level === 'error' ? 'destructive' : event.level === 'warn' ? 'warn' : 'quiet'}>{event.level}</Badge>
                          <span className="text-sm font-medium">{event.code}</span>
                        </div>
                        <span className="text-xs text-muted-foreground">{new Date(event.timestamp).toLocaleString()}</span>
                      </div>
                      <p className="mt-1 text-sm text-muted-foreground">{event.message}</p>
                    </div>
                  ))}
                  {!snapshot.diagnostics.length ? (
                    <div className="flex h-40 items-center justify-center text-sm text-muted-foreground">
                      <CheckCircle2 className="mr-2 size-4" />
                      {t('options.diagnostics')}
                    </div>
                  ) : null}
                </div>
              </ScrollArea>
            </Section>
          ) : null}
        </div>
      </main>
      <footer className="border-t py-4 text-center text-xs text-muted-foreground opacity-60">
        Motrix Extension v0.1.0
      </footer>
    </div>
  );
}

function Section({ title, icon: Icon, children }: { title: string; icon: React.ComponentType<{ className?: string }>; children: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <h2 className="text-[13px] font-semibold uppercase tracking-[0.05em] text-muted-foreground">{title}</h2>
      <div className="space-y-5 rounded-2xl border bg-[var(--m3-surface-container)] p-5 shadow-[var(--m3-shadow-card)]">
        <div className="flex items-center gap-2">
          <div className="flex size-9 items-center justify-center rounded-xl bg-[color-mix(in_srgb,hsl(var(--primary))_12%,transparent)] text-primary">
            <Icon className="size-4" />
          </div>
          <h3 className="text-base font-semibold">{title}</h3>
        </div>
        {children}
      </div>
    </section>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      {children}
      {hint ? <p className="text-xs leading-relaxed text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

function SettingSwitch({ label, checked, onCheckedChange }: { label: string; checked: boolean; onCheckedChange: (checked: boolean) => void }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border bg-[var(--m3-surface)] p-3">
      <span className="text-sm font-medium">{label}</span>
      <Switch checked={checked} onCheckedChange={onCheckedChange} />
    </div>
  );
}

function splitLines(value: string): string[] {
  return value
    .split(/\n|,/)
    .map((item) => item.trim().replace(/^\./, '').toLowerCase())
    .filter(Boolean);
}
