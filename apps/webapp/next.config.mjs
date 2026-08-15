/* global process */
import path from 'path';
import {fileURLToPath} from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    // Serve modern formats (AVIF first, then WebP) for significantly smaller thumbnails
    formats: ['image/avif', 'image/webp'],
    // Cache optimized images for 1 hour even if the signed URL has a short TTL.
    // This is safe because each signed URL contains unique query params that act
    // as a natural cache-buster when the page refreshes with new signed URLs.
    minimumCacheTTL: 3600,
    remotePatterns: [
      // Production object storage (Cloudflare R2 / S3-compatible via storageapi.dev)
      {
        protocol: 'https',
        hostname: '**.storageapi.dev',
      },
      // Local development with self-hosted MinIO.
      {
        protocol: 'http',
        hostname: 'localhost',
        pathname: '/**',
      },
      {
        protocol: 'http',
        hostname: '127.0.0.1',
        pathname: '/**',
      },
      ...(process.env.ATTACHMENT_STORAGE_HOST
        ? [
            {
              protocol: 'https',
              hostname: process.env.ATTACHMENT_STORAGE_HOST,
              pathname: '/**',
            },
          ]
        : []),
    ],
  },
  transpilePackages: ['better-auth'],
  turbopack: {
    resolveAlias: {
      'better-auth/react$': path.resolve(__dirname, 'node_modules/better-auth/dist/client/react/index.cjs'),
    },
  },
  async redirects() {
    return [
      // Basic app redirects
      {
        source: '/',
        destination: '/dashboard',
        permanent: false,
      },
      {
        source: '/settings',
        destination: '/settings/profile',
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
