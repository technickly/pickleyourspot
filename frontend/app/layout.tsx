import './globals.css';
import './modern-theme.css';
import { Inter } from 'next/font/google';
import type { Metadata } from 'next';
import ClientProviders from './providers/ClientProviders';

const inter = Inter({ subsets: ['latin'] });

export const viewport = {
  themeColor: '#FFDE59',
  width: 'device-width',
  initialScale: 1.0,
};

export const metadata: Metadata = {
  title: 'Pickle Your Spot',
  description: 'Find and reserve pickleball courts in your area',
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: '32x32', type: 'image/x-icon' },
      { url: '/icon.png', sizes: '192x192', type: 'image/png' },
    ],
    apple: [
      { url: '/apple-icon.png', sizes: '180x180', type: 'image/png' },
    ],
    shortcut: [{ url: '/favicon.ico' }],
  },
  manifest: '/manifest.json',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.className} modern-theme`} suppressHydrationWarning>
        <ClientProviders>
          {children}
        </ClientProviders>
      </body>
    </html>
  );
} 