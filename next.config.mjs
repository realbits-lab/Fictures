import { createMDX } from 'fumadocs-mdx/next';

const config = {
  experimental: {
    staleTimes: {
      dynamic: 0,
      static: 0,
    },
  },
  // Configure image domains for Vercel Blob storage and placeholder images
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.public.blob.vercel-storage.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'picsum.photos',
        port: '',
        pathname: '/**',
      },
    ],
  },
  // Disable all caching
  headers: async () => {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-cache, no-store, must-revalidate',
          },
          {
            key: 'Pragma',
            value: 'no-cache',
          },
          {
            key: 'Expires',
            value: '0',
          },
        ],
      },
    ];
  },
};

const withMDX = createMDX();
export default withMDX(config);
