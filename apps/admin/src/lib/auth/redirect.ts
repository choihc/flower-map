const DEFAULT_REDIRECT_TARGET = '/spots';

export function sanitizeRedirectTarget(value: string | null | undefined) {
  if (typeof value !== 'string' || value.length === 0) {
    return DEFAULT_REDIRECT_TARGET;
  }

  if (!value.startsWith('/') || value.startsWith('//')) {
    return DEFAULT_REDIRECT_TARGET;
  }

  return value;
}
