import './globals.css';
import './modern-theme.css';
import { Inter } from 'next/font/google';
import AuthProvider from './providers/AuthProvider';
import { Toaster } from 'react-hot-toast';
import NavigationBar from './components/NavigationBar';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'Pickle Your Spot',
  description: 'Reserve your next pickleball match in San Francisco',
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
  themeColor: '#FFDE59',
  viewport: 'width=device-width, initial-scale=1.0',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} modern-theme`}>
        <AuthProvider>
          <NavigationBar />
          <main className="min-h-screen">
            {children}
          </main>
          <Toaster />
        </AuthProvider>
      </body>
    </html>
  );
} 