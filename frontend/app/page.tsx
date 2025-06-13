'use client';

import { useSession, signIn } from 'next-auth/react';
import Link from 'next/link';
import { FaGoogle, FaComments, FaDollarSign, FaEnvelope, FaShare, FaDiscord } from 'react-icons/fa';

export default function HomePage() {
  const { data: session, status } = useSession();

  const handleSignIn = async () => {
    await signIn('google', { callbackUrl: '/' });
  };

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="pt-12 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-6">
            Coordinate Pickleball Games
            <span className="block text-primary mt-2">in San Francisco</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Effortlessly manage court time, organize tournaments, and coordinate with friends. From reservations to payment tracking, we've got your pickleball plans covered.
          </p>
          {status === 'loading' ? (
            <div className="animate-pulse">Loading...</div>
          ) : !session ? (
            <button
              onClick={handleSignIn}
              className="bg-primary text-white px-8 py-4 rounded-full font-semibold text-lg hover:bg-primary-hover transition-colors inline-flex items-center gap-2 shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-200"
            >
              <FaGoogle className="text-xl" />
              Get Started Free
            </button>
          ) : (
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/courts"
                className="bg-primary text-white px-8 py-4 rounded-full font-semibold text-lg hover:bg-primary-hover transition-colors shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-200"
              >
                New Reservation
              </Link>
              <Link
                href="/my-reservations"
                className="bg-primary text-white px-8 py-4 rounded-full font-semibold text-lg hover:bg-primary-hover transition-colors shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-200"
              >
                My Reservations
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="glass-card p-6 rounded-2xl shadow-lg hover:shadow-xl transition-shadow">
              <div className="text-primary text-2xl mb-4">
                <FaComments />
              </div>
              <h3 className="text-xl font-semibold mb-2 text-gray-900">Group Chats</h3>
              <p className="text-gray-600">
                Keep everyone in the loop. Share court details, confirm times, and stay connected with your playing group.
              </p>
            </div>

            <div className="glass-card p-6 rounded-2xl shadow-lg hover:shadow-xl transition-shadow">
              <div className="text-primary text-2xl mb-4">
                <FaDollarSign />
              </div>
              <h3 className="text-xl font-semibold mb-2 text-gray-900">Split Payments</h3>
              <p className="text-gray-600">
                Track and split court fees between players. Keep everything organized in one place.
              </p>
            </div>

            <div className="glass-card p-6 rounded-2xl shadow-lg hover:shadow-xl transition-shadow">
              <div className="text-primary text-2xl mb-4">
                <FaEnvelope />
              </div>
              <h3 className="text-xl font-semibold mb-2 text-gray-900">Email Notifications</h3>
              <p className="text-gray-600">
                Get reminders about your planned games and stay updated when plans change.
              </p>
            </div>

            <div className="glass-card p-6 rounded-2xl shadow-lg hover:shadow-xl transition-shadow">
              <div className="text-primary text-2xl mb-4">
                <FaShare />
              </div>
              <h3 className="text-xl font-semibold mb-2 text-gray-900">One-Click Sharing</h3>
              <p className="text-gray-600">
                Share your game details instantly. Court info, time, and participants - all in one shareable link.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-6 text-gray-900">Get in Touch</h2>
          <p className="text-xl text-gray-600 mb-8">
            Got any suggestions or recommendations? We'd love to hear from you!
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <a
              href="mailto:technickly@gmail.com"
              className="inline-flex items-center gap-2 text-primary hover:text-primary-dark transition-colors"
            >
              <FaEnvelope className="text-xl" />
              technickly@gmail.com
            </a>
            <span className="hidden sm:inline text-gray-400">|</span>
            <a
              href="https://discord.com/channels/1380819915467919420/1380819915467919423"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-primary hover:text-primary-dark transition-colors"
            >
              <FaDiscord className="text-xl" />
              Join our Discord
            </a>
          </div>
        </div>
      </section>
    </div>
  );
} 