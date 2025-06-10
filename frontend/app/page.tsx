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
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-8 inline-block">
            <p className="text-yellow-800 font-medium">
              Note: Book your court through the facility's website first, then use this app to organize your group!
            </p>
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-6">
            Got Your Court Booked?
            <span className="block text-primary mt-2">Let's Get Your Friends Together!</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Already booked your court? Perfect! Use <span className="text-primary font-semibold">Pickle Your Spot</span> to organize your group, manage payments, and keep everyone in the loop. From casual games to tournaments, we've got your back!
          </p>
          {status === 'loading' ? (
            <div className="animate-pulse">Loading...</div>
          ) : !session ? (
            <button
              onClick={handleSignIn}
              className="bg-primary text-white px-8 py-4 rounded-full font-semibold text-lg hover:bg-primary-hover transition-colors inline-flex items-center gap-2 shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-200"
            >
              <FaGoogle className="text-xl" />
              Get Started
            </button>
          ) : (
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/courts"
                className="bg-primary text-white px-8 py-4 rounded-full font-semibold text-lg hover:bg-primary-hover transition-colors shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-200"
              >
                Organize Event
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
      <section className="py-12 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-5xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-8">How It Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="text-4xl text-primary mb-4">🎾</div>
              <h3 className="text-lg font-semibold mb-2">Book Your Court</h3>
              <p className="text-gray-600">Reserve your court at your favorite facility's website</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="text-4xl text-primary mb-4">👥</div>
              <h3 className="text-lg font-semibold mb-2">Invite Friends</h3>
              <p className="text-gray-600">Create your group and invite players here</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="text-4xl text-primary mb-4">🎉</div>
              <h3 className="text-lg font-semibold mb-2">Game Time!</h3>
              <p className="text-gray-600">Everyone's informed, payments sorted - let's play!</p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold mb-8 text-center">Features at a Glance</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-xl shadow-sm hover:shadow-md transition-shadow text-center">
              <div className="text-primary text-2xl mb-2 flex justify-center">
                <FaComments />
              </div>
              <h3 className="text-base font-semibold mb-1 text-gray-900">Group Chat</h3>
              <p className="text-sm text-gray-600">
                Stay connected with your group
              </p>
            </div>

            <div className="bg-white p-4 rounded-xl shadow-sm hover:shadow-md transition-shadow text-center">
              <div className="text-primary text-2xl mb-2 flex justify-center">
                <FaDollarSign />
              </div>
              <h3 className="text-base font-semibold mb-1 text-gray-900">Split Costs</h3>
              <p className="text-sm text-gray-600">
                Track & divide fees easily
              </p>
            </div>

            <div className="bg-white p-4 rounded-xl shadow-sm hover:shadow-md transition-shadow text-center">
              <div className="text-primary text-2xl mb-2 flex justify-center">
                <FaEnvelope />
              </div>
              <h3 className="text-base font-semibold mb-1 text-gray-900">Notifications</h3>
              <p className="text-sm text-gray-600">
                Never miss a game
              </p>
            </div>

            <div className="bg-white p-4 rounded-xl shadow-sm hover:shadow-md transition-shadow text-center">
              <div className="text-primary text-2xl mb-2 flex justify-center">
                <FaShare />
              </div>
              <h3 className="text-base font-semibold mb-1 text-gray-900">Quick Invite</h3>
              <p className="text-sm text-gray-600">
                One link to join in
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