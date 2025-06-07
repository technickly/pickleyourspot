'use client';

import { useSession, signIn } from 'next-auth/react';
import Link from 'next/link';
import Image from 'next/image';
import { FaGoogle, FaComments, FaDollarSign, FaEnvelope, FaShare } from 'react-icons/fa';

export default function Home() {
  const { data: session } = useSession();

  const handleSignIn = async () => {
    await signIn('google', { callbackUrl: '/' });
  };

  return (
    <main className="min-h-screen p-4">
      <h1 className="text-4xl font-bold mb-8">Welcome to Pickle Your Spot</h1>
      <p className="text-lg">Find and reserve your next pickleball court.</p>
    </main>
  );
} 