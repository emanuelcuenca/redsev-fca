
import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
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
  // IMPLEMENTACIÓN DE CABECERAS DE SEGURIDAD ANTI-HACKEO
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY', // Protege contra Clickjacking
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff', // Protege contra MIME Sniffing
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin', // Protege rutas internas
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block', // Protección adicional contra XSS
          },
        ],
      },
    ];
  },
};

export default nextConfig;
