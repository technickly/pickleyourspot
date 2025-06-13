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
      {/* Notification Banner */}
      <div className="bg-yellow-100 border-b border-yellow-200">
        <div className="max-w-7xl mx-auto py-3 px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center">
            <p className="text-yellow-800 text-center font-medium">
              Note: Book your court through the facility's website first, then use this app to organize your group!
            </p>
          </div>
        </div>
      </div>

      {/* Hero Section */}
      <section className="pt-12 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-6">
            Already Booked Your Court?
            <span className="block text-primary mt-2">Let's Get Your Group Together!</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            <span className="font-bold">Pickle Your Spot</span> helps you manage your court time, organize tournaments, and coordinate with friends. Book your court through your facility first, then use our app to bring everyone together!
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
                New Event
              </Link>
              <Link
                href="/my-reservations"
                className="bg-primary text-white px-8 py-4 rounded-full font-semibold text-lg hover:bg-primary-hover transition-colors shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-200"
              >
                My Events
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">How It Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="bg-white p-6 rounded-2xl shadow-lg mb-4">
                <div className="text-4xl mb-2">✅</div>
                <h3 className="text-xl font-semibold mb-2">Book Your Court</h3>
                <p className="text-gray-600">Reserve your court at your favorite facility's website</p>
              </div>
            </div>
            <div className="text-center">
              <div className="bg-white p-6 rounded-2xl shadow-lg mb-4">
                <div className="text-4xl mb-2">👥</div>
                <h3 className="text-xl font-semibold mb-2">Invite Friends</h3>
                <p className="text-gray-600">Create your group and invite players here</p>
              </div>
            </div>
            <div className="text-center">
              <div className="bg-white p-6 rounded-2xl shadow-lg mb-4">
                <div className="text-4xl mb-2">🎉</div>
                <h3 className="text-xl font-semibold mb-2">Game Time!</h3>
                <p className="text-gray-600">Everyone's informed, payments sorted - let's play!</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features at a Glance */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">Features at a Glance</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="glass-card p-6 rounded-2xl shadow-lg hover:shadow-xl transition-shadow">
              <div className="text-primary text-2xl mb-4">
                <FaComments />
              </div>
              <h3 className="text-xl font-semibold mb-2 text-gray-900">Group Chat</h3>
              <p className="text-gray-600">
                Stay connected with your group.
              </p>
            </div>

            <div className="glass-card p-6 rounded-2xl shadow-lg hover:shadow-xl transition-shadow">
              <div className="text-primary text-2xl mb-4">
                <FaDollarSign />
              </div>
              <h3 className="text-xl font-semibold mb-2 text-gray-900">Split Costs</h3>
              <p className="text-gray-600">
                Track & Divide fees.
              </p>
            </div>

            <div className="glass-card p-6 rounded-2xl shadow-lg hover:shadow-xl transition-shadow">
              <div className="text-primary text-2xl mb-4">
                <FaEnvelope />
              </div>
              <h3 className="text-xl font-semibold mb-2 text-gray-900">Notifications</h3>
              <p className="text-gray-600">
                Never miss a game.
              </p>
            </div>

            <div className="glass-card p-6 rounded-2xl shadow-lg hover:shadow-xl transition-shadow">
              <div className="text-primary text-2xl mb-4">
                <FaShare />
              </div>
              <h3 className="text-xl font-semibold mb-2 text-gray-900">Quick Invite</h3>
              <p className="text-gray-600">
                One link to share and join.
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