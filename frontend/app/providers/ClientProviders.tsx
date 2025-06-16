'use client';

import AuthProvider from './AuthProvider';
import { Toaster } from 'react-hot-toast';
import NavigationBar from '../components/NavigationBar';
import LoadingOverlay from '../components/LoadingOverlay';
import { useSession } from 'next-auth/react';

export default function ClientProviders({
  children,
}: {
  children: React.ReactNode;
}) {
  const { status } = useSession();

  if (status === 'loading') {
    return <LoadingOverlay />;
  }

  return (
    <AuthProvider>
      <NavigationBar />
      {children}
      <Toaster />
      <LoadingOverlay />
    </AuthProvider>
  );
} 