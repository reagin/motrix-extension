const MOTRIX_WAKE_URL = 'motrix://';

export async function wakeMotrix(): Promise<void> {
  await browser.tabs.create({ url: MOTRIX_WAKE_URL, active: false });
}

export async function openMotrixNewTask(url: string): Promise<void> {
  const target = `motrix://new-task?uri=${encodeURIComponent(url)}&silent=true`;
  await browser.tabs.create({ url: target, active: false });
}

export function triggerMotrixProtocol(): void {
  if (typeof document === 'undefined' || !document.body) {
    throw new Error('Unable to launch Motrix protocol outside a document context');
  }

  const link = document.createElement('a');
  link.href = MOTRIX_WAKE_URL;
  link.rel = 'noreferrer';
  link.style.display = 'none';

  document.body.append(link);
  link.click();
  link.remove();
}
