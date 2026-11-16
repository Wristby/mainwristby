/** Saved text must never become an executable URL when it is opened. */
export function safeExternalUrl(value: string | null | undefined, allowBareDomain = false): string | undefined {
  if (!value || /[\u0000-\u001f\u007f]/.test(value)) return undefined;
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  const hasScheme = /^[a-z][a-z\d+.-]*:/i.test(trimmed);
  if (!hasScheme && !allowBareDomain) return undefined;
  try {
    const url = new URL(hasScheme ? trimmed : `https://${trimmed}`);
    if (url.protocol !== "https:" && url.protocol !== "http:") return undefined;
    if (!url.hostname || url.username || url.password) return undefined;
    return url.href;
  } catch {
    return undefined;
  }
}
