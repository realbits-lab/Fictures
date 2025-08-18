import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  experimental: {
    ppr: false,
    optimizePackageImports: ['@radix-ui/react-icons', 'lucide-react', 'date-fns'],
    bundlePagesRouterDependencies: true,
  },
  devIndicators: false,
  // Bundle optimization
  webpack: (config, { dev, isServer }) => {
    // Production optimizations
    if (!dev && !isServer) {
      config.optimization = {
        ...config.optimization,
        splitChunks: {
          chunks: 'all',
          cacheGroups: {
            // Separate chunk for hierarchy components
            hierarchy: {
              name: 'hierarchy-components',
              test: /[\\/]components[\\/]books[\\/]hierarchy/,
              chunks: 'all',
              priority: 20,
              enforce: true
            },
            // Separate chunk for editor components  
            editor: {
              name: 'editor-components',
              test: /[\\/]components[\\/]books[\\/]writing/,
              chunks: 'all',
              priority: 20,
              enforce: true
            },
            // Separate chunk for AI components
            ai: {
              name: 'ai-components', 
              test: /[\\/]lib[\\/]ai/,
              chunks: 'all',
              priority: 20,
              enforce: true
            },
            // Vendor libraries
            vendor: {
              name: 'vendor',
              test: /[\\/]node_modules[\\/]/,
              chunks: 'all',
              priority: 10,
              enforce: true
            },
            // Default
            default: {
              minChunks: 2,
              priority: -10,
              reuseExistingChunk: true
            }
          }
        }
      };
    }

    return config;
  },
  // Image optimization
  images: {
    remotePatterns: [
      {
        hostname: 'avatar.vercel.sh',
      },
      {
        hostname: 'lh3.googleusercontent.com',
      },
      {
        protocol: 'https',
        hostname: 'avatars.githubusercontent.com',
      },
      {
        protocol: 'https',
        hostname: 'vercel.blob.store',
      },
    ],
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },
  // Performance optimizations
  compress: true,
  poweredByHeader: false,
  // Static optimization
  trailingSlash: false,
};

export default nextConfig;
