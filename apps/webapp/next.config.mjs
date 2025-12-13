
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    NEXT_TELEMETRY_DISABLED: '1',
  },
  eslint: {
    ignoreDuringBuilds: true
  },
  transpilePackages: ["better-auth"],
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
        source: '/stocks',
        destination: '/dashboard/stocks',
        permanent: false,
      },
      {
        source: '/settings',
        destination: '/settings/profile',
        permanent: false,
      },
      // Basic auth redirects
      // {
      //   source: '/auth',
      //   destination: '/auth/sign-in',
      //   permanent: false,
      // },
      // {
      //   source: '/sign-in',
      //   destination: '/auth/sign-in',
      //   permanent: false,
      // },
      // {
      //   source: '/sign-up',
      //   destination: '/auth/sign-up',
      //   permanent: false,
      // },
      // Wildcard path matching
      // {
      //   source: '/blog/:slug',
      //   destination: '/news/:slug',
      //   permanent: true,
      // },
    ];
  },
};

export default nextConfig;
