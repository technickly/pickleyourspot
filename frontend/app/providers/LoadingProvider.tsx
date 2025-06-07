'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import LoadingScreen from '../components/LoadingScreen';

interface LoadingContextType {
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
}

const LoadingContext = createContext<LoadingContextType>({
  isLoading: false,
  setIsLoading: () => {},
});

export const useLoading = () => useContext(LoadingContext);

export default function LoadingProvider({ children }: { children: React.ReactNode }) {
  const [isLoading, setIsLoading] = useState(false);
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    // Only show loading for major route changes
    // Explicitly define routes that should show loading
    const showLoadingPaths = [
      '/',
      '/login',
      '/signup',
      '/settings',
      '/courts',
      '/upgrade'
    ];

    // Check if current path exactly matches a route that should show loading
    const shouldShowLoading = showLoadingPaths.some(path => 
      pathname === path || // Exact match
      (pathname?.startsWith(path) && path !== '/') // Subpath match, but not for root
    );

    if (!shouldShowLoading) {
      return;
    }

    setIsLoading(true);
    const timer = setTimeout(() => setIsLoading(false), 500);
    return () => clearTimeout(timer);
  }, [pathname]);

  return (
    <LoadingContext.Provider value={{ isLoading, setIsLoading }}>
      {isLoading && <LoadingScreen />}
      {children}
    </LoadingContext.Provider>
  );
} 