import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  experimental: {
    // @ts-expect-error nodeMiddleware is available since Next.js 15.1 but not yet typed
    nodeMiddleware: true,
  },
};

export default nextConfig;
