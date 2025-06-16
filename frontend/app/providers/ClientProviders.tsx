'use client';

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
    <AuthProvider>
      <NavigationBar />
      {children}
      <Toaster />
      <LoadingOverlay />
    </AuthProvider>
  );
} 