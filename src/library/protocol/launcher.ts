export async function wakeMotrix(): Promise<void> {
  await browser.tabs.create({ url: 'motrix://', active: false });
}

export async function openMotrixNewTask(url: string): Promise<void> {
  const target = `motrix://new-task?uri=${encodeURIComponent(url)}&silent=true`;
  await browser.tabs.create({ url: target, active: false });
}
