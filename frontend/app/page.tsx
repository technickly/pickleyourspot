'use client';

import { useSession, signIn } from 'next-auth/react';
import Link from 'next/link';
import Image from 'next/image';
import { FaGoogle, FaComments, FaDollarSign, FaEnvelope, FaShare } from 'react-icons/fa';

export default function Home() {
  const { data: session, status } = useSession();

  const handleSignIn = async () => {
    await signIn('google', { callbackUrl: '/' });
  };

  return (
    <main className="min-h-screen p-4 md:p-8 max-w-7xl mx-auto">
      <div className="text-center">
        <h1 className="text-4xl md:text-5xl font-bold mb-8">Welcome to Pickle Your Spot</h1>
        <p className="text-lg md:text-xl mb-8">Find and reserve your next pickleball court.</p>
        
        {status === 'loading' ? (
          <div className="animate-pulse">Loading...</div>
        ) : !session ? (
          <button
            onClick={handleSignIn}
            className="bg-primary hover:bg-primary-dark text-white font-bold py-3 px-6 rounded-lg inline-flex items-center space-x-2"
          >
            <FaGoogle />
            <span>Sign in with Google</span>
          </button>
        ) : (
          <Link
            href="/my-reservations"
            className="bg-primary hover:bg-primary-dark text-white font-bold py-3 px-6 rounded-lg inline-block"
          >
            View My Reservations
          </Link>
        )}
      </div>
    </main>
  );
} 