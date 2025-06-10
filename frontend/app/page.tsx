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
              Note: This app does not make court reservations. Book your court first, then use this app to coordinate with players.
            </p>
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-6">
            Pickleball Group
            <span className="block text-primary mt-2">Coordination Made Easy</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            After you've booked your court elsewhere, use this app to coordinate players, track payments, and manage event details. Perfect for both casual games and tournaments.
          </p>
          {status === 'loading' ? (
            <div className="animate-pulse">Loading...</div>
          ) : !session ? (
            <button
              onClick={handleSignIn}
              className="bg-primary text-white px-8 py-4 rounded-full font-semibold text-lg hover:bg-primary-hover transition-colors inline-flex items-center gap-2 shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-200"
            >
              <FaGoogle className="text-xl" />
              Coordinate Games
            </button>
          ) : (
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/courts"
                className="bg-primary text-white px-8 py-4 rounded-full font-semibold text-lg hover:bg-primary-hover transition-colors shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-200"
              >
                Organize Group
              </Link>
              <Link
                href="/my-reservations"
                className="bg-primary text-white px-8 py-4 rounded-full font-semibold text-lg hover:bg-primary-hover transition-colors shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-200"
              >
                My Groups
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
              <div className="text-2xl font-bold text-primary mb-2">1</div>
              <h3 className="text-lg font-semibold mb-2">Book Your Court</h3>
              <p className="text-gray-600">First, reserve your court through the facility's own booking system</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="text-2xl font-bold text-primary mb-2">2</div>
              <h3 className="text-lg font-semibold mb-2">Create Group</h3>
              <p className="text-gray-600">Use this app to set up your group and invite players</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="text-2xl font-bold text-primary mb-2">3</div>
              <h3 className="text-lg font-semibold mb-2">Coordinate</h3>
              <p className="text-gray-600">Manage players, payments, and communications in one place</p>
            </div>
          </div>
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
              <h3 className="text-xl font-semibold mb-2 text-gray-900">Group Chat</h3>
              <p className="text-gray-600">
                Keep your group in sync with dedicated chat channels. Share court details and coordinate with players after booking your court.
              </p>
            </div>

            <div className="glass-card p-6 rounded-2xl shadow-lg hover:shadow-xl transition-shadow">
              <div className="text-primary text-2xl mb-4">
                <FaDollarSign />
              </div>
              <h3 className="text-xl font-semibold mb-2 text-gray-900">Split Costs</h3>
              <p className="text-gray-600">
                Track and divide court fees, tournament costs, or any group expenses. Automated payment tracking and reminders.
              </p>
            </div>

            <div className="glass-card p-6 rounded-2xl shadow-lg hover:shadow-xl transition-shadow">
              <div className="text-primary text-2xl mb-4">
                <FaEnvelope />
              </div>
              <h3 className="text-xl font-semibold mb-2 text-gray-900">Notifications</h3>
              <p className="text-gray-600">
                Automated reminders for your scheduled games. Keep everyone informed about game times and any changes.
              </p>
            </div>

            <div className="glass-card p-6 rounded-2xl shadow-lg hover:shadow-xl transition-shadow">
              <div className="text-primary text-2xl mb-4">
                <FaShare />
              </div>
              <h3 className="text-xl font-semibold mb-2 text-gray-900">Quick Invite</h3>
              <p className="text-gray-600">
                Share your group details instantly with a single link. Players can easily join and view all the information.
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