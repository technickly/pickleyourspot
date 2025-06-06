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