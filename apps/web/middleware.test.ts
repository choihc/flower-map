import { describe, expect, it } from 'vitest';
import { NextRequest } from 'next/server';

import { middleware } from './middleware';

describe('middleware', () => {
  it('redirects unauthenticated admin requests to login with redirect target', () => {
    const request = new NextRequest('https://example.com/admin/spots');

    const response = middleware(request);

    expect(response.status).toBe(307);
    expect(response.headers.get('location')).toBe(
      'https://example.com/login?redirectTo=%2Fadmin%2Fspots',
    );
  });

  it('allows public routes without a session cookie', () => {
    const request = new NextRequest('https://example.com/');

    const response = middleware(request);

    expect(response.status).toBe(200);
    expect(response.headers.get('location')).toBeNull();
  });
});
