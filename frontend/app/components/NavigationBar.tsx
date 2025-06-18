'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { signIn, signOut, useSession } from 'next-auth/react';
import { FaGoogle } from 'react-icons/fa';
import { useState, useEffect } from 'react';
import { HiMenu, HiX } from 'react-icons/hi';
import Image from 'next/image';

export default function NavigationBar() {
  const pathname = usePathname();
  const { data: session, status } = useSession();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const isCurrentPath = (path: string) => pathname === path;

  const handleSignIn = async () => {
    await signIn('google', { callbackUrl: '/' });
  };

  const handleSignOut = async () => {
    try {
      // Clear any stored OAuth state
      if (typeof window !== 'undefined') {
        // Clear any Google OAuth related storage
        sessionStorage.clear();
        localStorage.removeItem('next-auth.callback-url');
        localStorage.removeItem('next-auth.csrf-token');
      }
      
      // Use custom sign out endpoint that properly clears cookies
      const response = await fetch('/api/auth/signout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (response.ok) {
        // Force page refresh to ensure session is cleared
        window.location.href = '/';
      } else {
        // Fallback to NextAuth sign out
        await signOut({ 
          callbackUrl: '/',
          redirect: true 
        });
      }
    } catch (error) {
      console.error('Error signing out:', error);
      // Fallback: force page refresh to clear session
      if (typeof window !== 'undefined') {
        window.location.href = '/';
      }
    }
  };

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const closeMenu = () => {
    setIsMenuOpen(false);
  };

  return (
    <nav className={`nav-bar ${isScrolled ? 'shadow-md' : ''}`}>
      <div className="max-w-6xl mx-auto w-full flex items-center justify-between">
        <Link 
          href="/" 
          className="text-lg font-semibold text-primary hover:text-primary-dark transition-colors"
          onClick={closeMenu}
        >
          Pickle Your Spot
        </Link>

        {/* Mobile menu button */}
        {status === 'authenticated' && (
          <button
            onClick={toggleMenu}
            className="md:hidden p-1.5 rounded-md hover:bg-gray-100 transition-colors"
            aria-label="Toggle menu"
          >
            {isMenuOpen ? (
              <HiX className="h-5 w-5 text-gray-600" />
            ) : (
              <HiMenu className="h-5 w-5 text-gray-600" />
            )}
          </button>
        )}

        {/* Desktop navigation */}
        <div className="hidden md:flex items-center gap-3">
          {status === 'authenticated' ? (
            <>
              <div className="flex items-center gap-2">
                {!isCurrentPath('/my-account') && (
                  <Link
                    href="/my-account"
                    className="button-primary"
                  >
                    My Account
                  </Link>
                )}
                {!isCurrentPath('/my-reservations') && (
                  <Link
                    href="/my-reservations"
                    className="button-primary"
                  >
                    My Events
                  </Link>
                )}
                {session?.user?.role === 'ADMIN' && !isCurrentPath('/admin') && (
                  <Link
                    href="/admin"
                    className="button-primary"
                  >
                    Admin
                  </Link>
                )}

                {session ? (
                  <button
                    onClick={handleSignOut}
                    className="button-secondary"
                  >
                    Sign Out
                  </button>
                ) : (
                  <button
                    onClick={() => signIn('google')}
                    className="button-primary"
                  >
                    Sign In
                  </button>
                )}
              </div>

              <div className="user-info">
                {session.user?.image && (
                  <Image
                    src={session.user.image}
                    alt={session.user.name || 'User'}
                    width={24}
                    height={24}
                    className="rounded-full"
                  />
                )}
                <span className="user-name hidden sm:inline">
                  {session.user?.name?.split(' ')[0] || 'Guest'}
                </span>
              </div>
            </>
          ) : (
            <div className="text-sm text-gray-600">Loading...</div>
          )}
        </div>

        {/* Mobile navigation menu */}
        {status === 'authenticated' && (
          <div 
            className={`mobile-menu ${isMenuOpen ? '' : 'hidden'}`}
            onClick={closeMenu}
          >
            <div className="flex flex-col gap-2">
              {!isCurrentPath('/my-account') && (
                <Link
                  href="/my-account"
                  className="button-primary"
                >
                  My Account
                </Link>
              )}
              {!isCurrentPath('/my-reservations') && (
                <Link
                  href="/my-reservations"
                  className="button-primary"
                >
                  My Events
                </Link>
              )}
              {session?.user?.role === 'ADMIN' && !isCurrentPath('/admin') && (
                <Link
                  href="/admin"
                  className="button-primary"
                >
                  Admin
                </Link>
              )}

              <div className="flex items-center justify-between pt-2 mt-2 border-t border-gray-200">
                <div className="flex items-center gap-2">
                  {session.user?.image && (
                    <Image
                      src={session.user.image}
                      alt={session.user.name || 'User'}
                      width={24}
                      height={24}
                      className="rounded-full"
                    />
                  )}
                  <span className="text-sm text-gray-700">
                    {session.user?.name?.split(' ')[0] || 'Guest'}
                  </span>
                </div>
                {session ? (
                  <button
                    onClick={handleSignOut}
                    className="text-sm text-red-600 hover:text-red-700 transition-colors"
                  >
                    Sign Out
                  </button>
                ) : (
                  <button
                    onClick={() => signIn('google')}
                    className="text-sm text-red-600 hover:text-red-700 transition-colors"
                  >
                    Sign In
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Mobile sign in */}
        {status === 'unauthenticated' && (
          <div className="md:hidden">
            <button
              onClick={handleSignIn}
              className="button-primary"
            >
              <FaGoogle className="text-sm" />
              <span className="hidden sm:inline">Sign in with Google</span>
              <span className="sm:hidden">Sign in</span>
            </button>
          </div>
        )}
      </div>
    </nav>
  );
} 