/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  reactStrictMode: true,
  transpilePackages: ['@budgetbuddyde/api', '@budgetbuddyde/types'],
};

export default nextConfig;
