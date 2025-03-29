import { createMDX } from 'fumadocs-mdx/next';

const withMDX = createMDX();

/** @type {import('next').NextConfig} */
const config = {
  reactStrictMode: true,
  rewrites() {
    return {
      beforeFiles: [
        // if the host is `newdocs.budget-buddy.de`,
        // this rewrite will be applied
        {
          source: '/:path*',
          has: [
            {
              type: 'host',
              value: 'docs.budget-buddy.de',
            },
          ],
          destination: '/docs/:path*',
        },
      ],
    };
  },
  assetPrefix: 'https://new.budget-buddy.de',
};

export default withMDX(config);
