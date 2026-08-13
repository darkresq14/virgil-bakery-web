import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { withPayload } from '@payloadcms/next/withPayload';
import type { NextConfig } from 'next';

const __filename = fileURLToPath(import.meta.url);
const dirname = path.dirname(__filename);

import { redirects } from './redirects';

const NEXT_PUBLIC_SERVER_URL = process.env.VERCEL_PROJECT_PRODUCTION_URL
  ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
  : process.env.__NEXT_PRIVATE_ORIGIN || 'http://localhost:3000';

const nextConfig: NextConfig = {
  // Temporarily required on Windows until Next.js fixes Turbopack Sass resolution.
  // See: https://github.com/vercel/next.js/issues/86431
  sassOptions: {
    loadPaths: ['./node_modules/@payloadcms/ui/dist/scss/'],
  },
  images: {
    localPatterns: [
      {
        pathname: '/api/media/file/**',
      },
    ],
    // See docs/adr/0003-image-optimization-strategy.md
    qualities: [75],
    // 31 days. Bounds transform count to catalog size, not traffic — the optimizer's
    // output cache must survive long enough for repeat visits to become Cache Reads.
    minimumCacheTTL: 60 * 60 * 24 * 31,
    // Trimmed to 3 distinct render widths. 750/1200 were visually redundant with
    // their neighbors and inflated the transform fan-out (see #32).
    deviceSizes: [640, 1080, 1920],
    // Small-display/icon widths. Trimmed from the 8-wide default — keeps a tiny
    // and a small width for thumbnails/icons without fanning every image to 13 keys.
    imageSizes: [32, 128],
    remotePatterns: [
      ...[NEXT_PUBLIC_SERVER_URL /* 'https://example.com' */].map((item) => {
        const url = new URL(item);

        return {
          hostname: url.hostname,
          protocol: url.protocol.replace(':', '') as 'http' | 'https',
        };
      }),
      {
        protocol: 'https',
        hostname: '*.blob.vercel-storage.com',
      },
    ],
  },
  webpack: (webpackConfig) => {
    webpackConfig.resolve.extensionAlias = {
      '.cjs': ['.cts', '.cjs'],
      '.js': ['.ts', '.tsx', '.js', '.jsx'],
      '.mjs': ['.mts', '.mjs'],
    };

    return webpackConfig;
  },
  reactStrictMode: true,
  redirects,
  turbopack: {
    root: path.resolve(dirname),
  },
};

export default withPayload(nextConfig, { devBundleServerPackages: false });
