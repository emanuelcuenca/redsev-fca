
import type {Metadata, Viewport} from 'next';
import './globals.css';
import { FirebaseClientProvider } from '@/firebase/client-provider';
import { Toaster } from '@/components/ui/toaster';
import { PwaInstallPrompt } from '@/components/pwa-install-prompt';
import Script from 'next/script';

export const metadata: Metadata = {
  title: 'REDSEV FCA - Secretaría de Extensión y Vinculación',
  description: 'Repositorio Digital de la Secretaría de Extensión y Vinculación de la Facultad de Ciencias Agrarias - UNCA.',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'REDSEV FCA',
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport: Viewport = {
  themeColor: '#2e7d32',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Space+Grotesk:wght@500;600;700&display=swap" rel="stylesheet" />
        <link rel="manifest" href="/manifest.json" />
      </head>
      <body className="font-body antialiased" suppressHydrationWarning>
        <FirebaseClientProvider>
          {children}
          <Toaster />
          <PwaInstallPrompt />
        </FirebaseClientProvider>
        
        {/* Registro del Service Worker para soporte PWA */}
        <Script id="register-sw" strategy="afterInteractive">
          {`
            if ('serviceWorker' in navigator) {
              window.addEventListener('load', function() {
                navigator.serviceWorker.register('/sw.js').then(function(registration) {
                  console.log('SW registered');
                }, function(err) {
                  console.log('SW registration failed: ', err);
                });
              });
            }
          `}
        </Script>
      </body>
    </html>
  );
}
