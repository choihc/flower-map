import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import LandingPage from './page';

describe('LandingPage', () => {
  it('renders the marketing landing page under /landing', async () => {
    render(<LandingPage />);

    expect(screen.getByRole('heading', { name: /봄꽃 명소를.*감성 있게, 빠르게/ })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /App Store/ })).toHaveAttribute(
      'href',
      expect.stringContaining('apps.apple.com'),
    );
    expect(screen.getByRole('link', { name: /Google Play/ })).toHaveAttribute(
      'href',
      expect.stringContaining('play.google.com'),
    );
  });
});
