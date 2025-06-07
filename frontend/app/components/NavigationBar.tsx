'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { signIn, signOut, useSession } from 'next-auth/react';
import { FaGoogle } from 'react-icons/fa';
import { useState, useEffect } from 'react';
import { HiMenu, HiX } from 'react-icons/hi';
import Image from 'next/image';

// Sign Out Confirmation Dialog Component
function SignOutConfirmationDialog({
  isOpen,
  onClose,
  onConfirm,
}: {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <h3 className="text-lg font-semibold mb-4">Sign Out Confirmation</h3>
        <p className="text-gray-600 mb-6">Are you sure you want to sign out?</p>
        <div className="flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 hover:text-gray-800"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
          >
            Sign Out
          </button>
        </div>
      </div>
    </div>
  );
}

export default function NavigationBar() {
  const pathname = usePathname();
  const { data: session, status } = useSession();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [showSignOutConfirmation, setShowSignOutConfirmation] = useState(false);

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

  const handleSignOut = () => {
    setShowSignOutConfirmation(true);
  };

  const confirmSignOut = async () => {
    await signOut();
    setShowSignOutConfirmation(false);
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

      {/* Sign Out Confirmation Dialog */}
      <SignOutConfirmationDialog
        isOpen={showSignOutConfirmation}
        onClose={() => setShowSignOutConfirmation(false)}
        onConfirm={confirmSignOut}
      />
    </nav>
  );
} 