import packageJson from './package.json' with {type: 'json'};

/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    // The root flat config is enforced by the workspace lint gate; Next 15 cannot reliably detect its plugin.
    ignoreDuringBuilds: true,
  },
  env: {
    NEXT_TELEMETRY_DISABLED: '1',
    NEXT_PUBLIC_APP_VERSION: packageJson.version,
  },
  images: {
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      {protocol: 'https', hostname: '**', pathname: '/**'},
      {protocol: 'http', hostname: '**', pathname: '/**'},
    ],
  },
  transpilePackages: ['better-auth'],
  async redirects() {
    return [
      {source: '/', destination: '/dashboard', permanent: false},
      {source: '/settings', destination: '/settings/profile', permanent: false},
    ];
  },
};

export default nextConfig;
