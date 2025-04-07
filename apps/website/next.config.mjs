import { createMDX } from 'fumadocs-mdx/next';

const withMDX = createMDX();

/** @type {import('next').NextConfig} */
const config = {
  reactStrictMode: true,
  // rewrites() {
  //   return {
  //     beforeFiles: [
  //       // Wenn der Host `docs.budget-buddy.de` ist,
  //       // wird der `/docs`-Teil aus der URL entfernt und auf die neue URL umgeschrieben
  //       {
  //         source: '/docs/:path*',
  //         has: [
  //           {
  //             type: 'host',
  //             value: 'docs.budget-buddy.de',
  //           },
  //         ],
  //         destination: 'https://docs.budget-buddy.de/:path*',
  //       },
  //     ],
  //   };
  // },
  // assetPrefix: 'https://new.budget-buddy.de',
};

export default withMDX(config);
