/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Enable experimental optimizations
  experimental: {
    optimizePackageImports: [
      'lucide-react',
      '@mui/material',
      '@mui/icons-material',
      '@emotion/react',
      '@emotion/styled',
      '@radix-ui/react-accordion',
      '@radix-ui/react-dialog',
      '@radix-ui/react-dropdown-menu',
      '@radix-ui/react-select',
      '@radix-ui/react-tabs',
      '@tabler/icons-react',
    ],
  },
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error', 'warn'],
    } : false,
  },
  // Enable compression
  compress: true,
  // Optimized webpack configuration
  webpack: (config, { isServer, webpack }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      };
      
      // Optimize chunk splitting - fewer, larger chunks for better HTTP/2 performance
      config.optimization = {
        ...config.optimization,
        moduleIds: 'deterministic',
        runtimeChunk: 'single',
        splitChunks: {
          chunks: 'all',
          maxInitialRequests: 25,
          minSize: 40000,
          maxSize: 200000,
          cacheGroups: {
            // Framework code (React, Next.js)
            framework: {
              test: /[\\/]node_modules[\\/](react|react-dom|scheduler|next)[\\/]/,
              name: 'framework',
              priority: 40,
              enforce: true,
            },
            // ArcGIS - separate for lazy loading
            arcgis: {
              test: /[\\/]node_modules[\\/]@arcgis[\\/]/,
              name: 'arcgis',
              priority: 35,
              reuseExistingChunk: true,
            },
            // MUI and Emotion
            mui: {
              test: /[\\/]node_modules[\\/](@mui|@emotion)[\\/]/,
              name: 'mui',
              priority: 30,
              reuseExistingChunk: true,
            },
            // Radix UI components
            radix: {
              test: /[\\/]node_modules[\\/]@radix-ui[\\/]/,
              name: 'radix',
              priority: 25,
              reuseExistingChunk: true,
            },
            // Icons
            icons: {
              test: /[\\/]node_modules[\\/](@tabler\/icons-react|lucide-react)[\\/]/,
              name: 'icons',
              priority: 20,
              reuseExistingChunk: true,
            },
            // Heavy libraries (PDF, Excel, Charts)
            heavy: {
              test: /[\\/]node_modules[\\/](jspdf|xlsx|chart\.js|html2canvas)[\\/]/,
              name: 'heavy-libs',
              priority: 15,
              reuseExistingChunk: true,
            },
            // Other vendor code
            vendor: {
              test: /[\\/]node_modules[\\/]/,
              name: 'vendor',
              priority: 10,
              reuseExistingChunk: true,
            },
            // Common code shared between pages
            common: {
              minChunks: 2,
              priority: 5,
              reuseExistingChunk: true,
              name: 'common',
            },
          },
        },
      };

      // Add compression plugin for production
      if (process.env.NODE_ENV === 'production') {
        config.plugins.push(
          new webpack.optimize.MinChunkSizePlugin({
            minChunkSize: 30000,
          })
        );
      }
    }
    return config;
  },
  images: {
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 60 * 60 * 24 * 365, // 1 year for better caching
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'images.pexels.com',
      },
      {
        protocol: 'https',
        hostname: 'picsum.photos',
      },
      {
        protocol: 'https',
        hostname: 'flagcdn.com',
      },
      {
        protocol: 'https',
        hostname: 'www.keproba.go.ke',
      },
      {
        protocol: 'https',
        hostname: 'ui-avatars.com',
      },
      {
        protocol: 'https',
        hostname: 'api.dicebear.com',
      },
      {
        protocol: 'https',
        hostname: 'via.placeholder.com',
      },
      {
        protocol: 'https',
        hostname: '**.vercel.app',
      },
      // RustFS S3-compatible object storage
      {
        protocol: 'http',
        hostname: '161.97.178.128',
        port: '9101',
      },
      {
        protocol: 'https',
        hostname: '161.97.178.128',
        port: '9101',
      },
      // Self-referencing for the app domain
      {
        protocol: 'https',
        hostname: 'trade-directory-161.97.178.128.sslip.io',
      },
    ],
  },
  // Generate ETags for caching
  generateEtags: true,
  // Enable powered by header removal in production
  poweredByHeader: false,
  // Enable React strict mode for better development experience
  reactStrictMode: true,
  // Production settings
  productionBrowserSourceMaps: false,
  // Trailing slash for better SEO
  trailingSlash: false,
  // Redirects for SEO
  async redirects() {
    return [];
  },
  // Headers for caching and security
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
        ],
      },
      {
        source: '/api/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-store, must-revalidate',
          },
        ],
      },
      // Never cache auth/register pages — always serve fresh HTML
      {
        source: '/register',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-store, no-cache, must-revalidate, proxy-revalidate',
          },
          {
            key: 'Surrogate-Control',
            value: 'no-store',
          },
        ],
      },
      {
        source: '/login',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-store, no-cache, must-revalidate, proxy-revalidate',
          },
          {
            key: 'Surrogate-Control',
            value: 'no-store',
          },
        ],
      },
      // Cache static assets aggressively
      {
        source: '/_next/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      // Cache images
      {
        source: '/uploads/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      // Cache public assets
      {
        source: '/:path*.{jpg,jpeg,png,gif,webp,avif,ico,svg}',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      // Cache fonts
      {
        source: '/:path*.{woff,woff2,ttf,otf,eot}',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
