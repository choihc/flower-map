import { describe, expect, it } from 'vitest';

import { sanitizeRedirectTarget } from './redirect';

describe('sanitizeRedirectTarget', () => {
  it('keeps safe same-origin relative paths', () => {
    expect(sanitizeRedirectTarget('/admin/flowers')).toBe('/admin/flowers');
    expect(sanitizeRedirectTarget('/admin/spots?tab=draft')).toBe('/admin/spots?tab=draft');
  });

  it('falls back for absolute and protocol-relative urls', () => {
    expect(sanitizeRedirectTarget('https://evil.example/login')).toBe('/admin/spots');
    expect(sanitizeRedirectTarget('//evil.example/login')).toBe('/admin/spots');
  });

  it('falls back for non-path values', () => {
    expect(sanitizeRedirectTarget('spots')).toBe('/admin/spots');
    expect(sanitizeRedirectTarget('javascript:alert(1)')).toBe('/admin/spots');
    expect(sanitizeRedirectTarget('')).toBe('/admin/spots');
  });
});
