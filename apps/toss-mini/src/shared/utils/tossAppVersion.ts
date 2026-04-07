const INLINE_AD_MIN_VERSION = '5.241.0';

export function compareAppVersions(a: string, b: string) {
  const aParts = a.split('.').map((part) => Number.parseInt(part, 10) || 0);
  const bParts = b.split('.').map((part) => Number.parseInt(part, 10) || 0);
  const maxLength = Math.max(aParts.length, bParts.length);

  for (let index = 0; index < maxLength; index += 1) {
    const aPart = aParts[index] ?? 0;
    const bPart = bParts[index] ?? 0;

    if (aPart > bPart) return 1;
    if (aPart < bPart) return -1;
  }

  return 0;
}

export function isInlineAdSupported(appVersion?: string) {
  if (!appVersion) {
    return false;
  }

  return compareAppVersions(appVersion, INLINE_AD_MIN_VERSION) >= 0;
}
