import { describe, expect, it } from 'vitest';

import { sanitizeRedirectTarget } from './redirect';

describe('sanitizeRedirectTarget', () => {
  it('keeps safe same-origin relative paths', () => {
    expect(sanitizeRedirectTarget('/flowers')).toBe('/flowers');
    expect(sanitizeRedirectTarget('/spots?tab=draft')).toBe('/spots?tab=draft');
  });

  it('falls back for absolute and protocol-relative urls', () => {
    expect(sanitizeRedirectTarget('https://evil.example/login')).toBe('/spots');
    expect(sanitizeRedirectTarget('//evil.example/login')).toBe('/spots');
  });

  it('falls back for non-path values', () => {
    expect(sanitizeRedirectTarget('spots')).toBe('/spots');
    expect(sanitizeRedirectTarget('javascript:alert(1)')).toBe('/spots');
    expect(sanitizeRedirectTarget('')).toBe('/spots');
  });
});
