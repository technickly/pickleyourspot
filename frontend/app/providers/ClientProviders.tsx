'use client';

import { SessionProvider } from 'next-auth/react';
import AuthProvider from './AuthProvider';
import { Toaster } from 'react-hot-toast';
import NavigationBar from '../components/NavigationBar';
import LoadingOverlay from '../components/LoadingOverlay';

export default function ClientProviders({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SessionProvider>
      <AuthProvider>
        <NavigationBar />
        {children}
        <Toaster />
        <LoadingOverlay />
      </AuthProvider>
    </SessionProvider>
  );
} 