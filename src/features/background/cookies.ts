export async function getCookieHeader(url: string): Promise<string | undefined> {
  try {
    const cookies = await browser.cookies.getAll({ url });
    if (!cookies.length) return undefined;
    return cookies.map((cookie) => `${cookie.name}=${cookie.value}`).join('; ');
  } catch {
    return undefined;
  }
}
