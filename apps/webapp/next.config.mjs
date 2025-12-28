
import path from "path";
import { fileURLToPath } from "url";
import packageJson from "./package.json" with { type: "json" };

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    NEXT_TELEMETRY_DISABLED: '1',
    NEXT_PUBLIC_APP_VERSION: packageJson.version,
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
        source: '/settings',
        destination: '/settings/profile',
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
