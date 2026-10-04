/** @type {import('next').NextConfig} */
const nextConfig = {
  agentRules: false,
  output: 'standalone',
  redirects() {
    return [
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
