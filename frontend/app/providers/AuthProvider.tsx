'use client';

import { SessionProvider } from 'next-auth/react';
import { useSession } from 'next-auth/react';

export default function AuthProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session, status } = useSession();

  return (
    <SessionProvider session={session}>
      {children}
    </SessionProvider>
  );
} 