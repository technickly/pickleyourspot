'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { signIn, signOut, useSession } from 'next-auth/react';
import { FaGoogle } from 'react-icons/fa';
import { useState } from 'react';
import { HiMenu, HiX } from 'react-icons/hi';

export default function NavigationBar() {
  const pathname = usePathname();
  const { data: session, status } = useSession();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const isCurrentPath = (path: string) => pathname === path;

  const handleSignIn = async () => {
    await signIn('google', { callbackUrl: '/' });
  };

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <nav className="nav-bar py-4 px-6">
      <div className="max-w-6xl mx-auto w-full">
        <div className="flex justify-between items-center">
          <Link href="/" className="text-2xl font-bold text-primary hover:text-primary-dark transition-colors">
            Pickle Your Spot
          </Link>

          {/* Mobile menu button */}
          {status === 'authenticated' && (
            <button
              onClick={toggleMenu}
              className="md:hidden p-2 rounded hover:bg-gray-100"
              aria-label="Toggle menu"
            >
              {isMenuOpen ? (
                <HiX className="h-6 w-6 text-gray-600" />
              ) : (
                <HiMenu className="h-6 w-6 text-gray-600" />
              )}
            </button>
          )}

          {/* Desktop navigation */}
          <div className="hidden md:flex items-center gap-4">
            {status === 'authenticated' ? (
              <>
                <div className="flex items-center gap-4">
                  {!isCurrentPath('/') && (
                    <Link
                      href="/"
                      className="button-primary hover-lift"
                    >
                      Home
                    </Link>
                  )}
                  
                  {!isCurrentPath('/courts') && (
                    <Link
                      href="/courts"
                      className="button-primary hover-lift"
                    >
                      Make New Reservation
                    </Link>
                  )}

                  {!isCurrentPath('/my-reservations') && (
                    <Link
                      href="/my-reservations"
                      className="button-primary hover-lift"
                    >
                      My Reservations
                    </Link>
                  )}
                </div>

                <div className="user-info">
                  <span className="user-name">
                    Hello, {session?.user?.name?.split(' ')[0] || 'Guest'}
                  </span>
                  <button
                    onClick={() => signOut()}
                    className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-all duration-300 hover-lift"
                  >
                    Logout
                  </button>
                </div>
              </>
            ) : status === 'loading' ? (
              <div className="text-gray-600">Loading...</div>
            ) : (
              <button
                onClick={handleSignIn}
                className="button-primary hover-lift inline-flex items-center gap-2"
              >
                <FaGoogle />
                Sign in with Google
              </button>
            )}
          </div>
        </div>

        {/* Mobile navigation menu */}
        {status === 'authenticated' && (
          <div className={`md:hidden ${isMenuOpen ? 'block' : 'hidden'} mt-4 space-y-2 glass-card p-4 rounded-xl`}>
            {!isCurrentPath('/') && (
              <Link
                href="/"
                className="block button-primary w-full text-center mb-2"
              >
                Home
              </Link>
            )}
            
            {!isCurrentPath('/courts') && (
              <Link
                href="/courts"
                className="block button-primary w-full text-center mb-2"
              >
                Make New Reservation
              </Link>
            )}

            {!isCurrentPath('/my-reservations') && (
              <Link
                href="/my-reservations"
                className="block button-primary w-full text-center mb-2"
              >
                My Reservations
              </Link>
            )}

            <div className="pt-2 mt-2 border-t border-gray-200">
              <div className="text-gray-700 mb-2">
                Hello, {session?.user?.name?.split(' ')[0] || 'Guest'}
              </div>
              <button
                onClick={() => signOut()}
                className="w-full bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-all duration-300"
              >
                Logout
              </button>
            </div>
          </div>
        )}

        {/* Mobile sign in */}
        {status === 'unauthenticated' && (
          <div className="md:hidden mt-4">
            <button
              onClick={handleSignIn}
              className="w-full button-primary inline-flex items-center justify-center gap-2"
            >
              <FaGoogle />
              Sign in with Google
            </button>
          </div>
        )}
      </div>
    </nav>
  );
} 