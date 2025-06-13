'use client';

import { FaCrown, FaStar, FaCheck } from 'react-icons/fa';
import { toast } from 'react-hot-toast';

interface MembershipTierProps {
  currentTier: string;
}

export default function MembershipTiers({ currentTier }: MembershipTierProps) {
  const handleUpgrade = (tier: string) => {
    toast.success('Stripe payment integration coming soon! Stay tuned for upgrades.');
  };

  return (
    <div className="py-12 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Choose Your Plan</h2>
          <p className="text-xl text-gray-600 mb-8">
            Select the perfect membership tier for your pickleball journey
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Free Tier */}
          <div className="bg-white rounded-2xl shadow-lg p-8 relative">
            <div className="text-center">
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Free</h3>
              <p className="text-gray-600 mb-6">Perfect for getting started</p>
              <div className="text-4xl font-bold text-gray-900 mb-6">
                $0
                <span className="text-gray-500 text-base font-normal">/month</span>
              </div>
            </div>
            <ul className="space-y-4 mb-8">
              <li className="flex items-center gap-3">
                <FaCheck className="text-green-500 flex-shrink-0" />
                <span>Up to 3 active reservations</span>
              </li>
              <li className="flex items-center gap-3">
                <FaCheck className="text-green-500 flex-shrink-0" />
                <span>Basic participant management</span>
              </li>
              <li className="flex items-center gap-3">
                <FaCheck className="text-green-500 flex-shrink-0" />
                <span>Payment tracking</span>
              </li>
              <li className="flex items-center gap-3">
                <FaCheck className="text-green-500 flex-shrink-0" />
                <span>Access to SF public courts</span>
              </li>
            </ul>
            <div className="text-center">
              {currentTier === 'FREE' ? (
                <span className="inline-block w-full px-6 py-3 text-gray-700 bg-gray-100 rounded-full font-semibold">
                  Current Plan
                </span>
              ) : (
                <button
                  onClick={() => handleUpgrade('FREE')}
                  className="w-full px-6 py-3 text-gray-700 bg-gray-100 rounded-full font-semibold hover:bg-gray-200 transition-colors"
                >
                  Switch to Free
                </button>
              )}
            </div>
          </div>

          {/* Basic Tier */}
          <div className="bg-white rounded-2xl shadow-lg p-8 relative transform hover:scale-105 transition-transform duration-300">
            <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
              <span className="bg-primary text-white px-4 py-1 rounded-full text-sm font-semibold">
                Most Popular
              </span>
            </div>
            <div className="text-center">
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Basic</h3>
              <p className="text-gray-600 mb-6">For regular players</p>
              <div className="text-4xl font-bold text-gray-900 mb-6">
                $9.99
                <span className="text-gray-500 text-base font-normal">/month</span>
              </div>
            </div>
            <ul className="space-y-4 mb-8">
              <li className="flex items-center gap-3">
                <FaCheck className="text-green-500 flex-shrink-0" />
                <span>Everything in Free</span>
              </li>
              <li className="flex items-center gap-3">
                <FaCheck className="text-green-500 flex-shrink-0" />
                <span>Up to 10 active reservations</span>
              </li>
              <li className="flex items-center gap-3">
                <FaCheck className="text-green-500 flex-shrink-0" />
                <span>Custom events & tournaments</span>
              </li>
              <li className="flex items-center gap-3">
                <FaCheck className="text-green-500 flex-shrink-0" />
                <span>Email payment reminders</span>
              </li>
              <li className="flex items-center gap-3">
                <FaCheck className="text-green-500 flex-shrink-0" />
                <span>Priority support</span>
              </li>
            </ul>
            <div className="text-center">
              {currentTier === 'BASIC' ? (
                <span className="inline-block w-full px-6 py-3 text-white bg-primary rounded-full font-semibold">
                  Current Plan
                </span>
              ) : (
                <button
                  onClick={() => handleUpgrade('BASIC')}
                  className="w-full px-6 py-3 text-white bg-primary rounded-full font-semibold hover:bg-primary-hover transition-colors"
                >
                  Upgrade to Basic
                </button>
              )}
            </div>
          </div>

          {/* Premium Tier */}
          <div className="bg-white rounded-2xl shadow-lg p-8 relative">
            <div className="text-center">
              <h3 className="text-2xl font-bold text-gray-900 mb-4">
                Premium
                <FaCrown className="inline-block ml-2 text-yellow-400" />
              </h3>
              <p className="text-gray-600 mb-6">For power users</p>
              <div className="text-4xl font-bold text-gray-900 mb-6">
                $24.99
                <span className="text-gray-500 text-base font-normal">/month</span>
              </div>
            </div>
            <ul className="space-y-4 mb-8">
              <li className="flex items-center gap-3">
                <FaCheck className="text-green-500 flex-shrink-0" />
                <span>Everything in Basic</span>
              </li>
              <li className="flex items-center gap-3">
                <FaCheck className="text-green-500 flex-shrink-0" />
                <span>Unlimited reservations</span>
              </li>
              <li className="flex items-center gap-3">
                <FaCheck className="text-green-500 flex-shrink-0" />
                <span>Advanced tournament tools</span>
              </li>
              <li className="flex items-center gap-3">
                <FaCheck className="text-green-500 flex-shrink-0" />
                <span>Premium analytics</span>
              </li>
              <li className="flex items-center gap-3">
                <FaCheck className="text-green-500 flex-shrink-0" />
                <span>VIP support</span>
              </li>
              <li className="flex items-center gap-3">
                <FaCheck className="text-green-500 flex-shrink-0" />
                <span>Custom branding options</span>
              </li>
            </ul>
            <div className="text-center">
              {currentTier === 'PREMIUM' ? (
                <span className="inline-block w-full px-6 py-3 text-white bg-gradient-to-r from-purple-600 to-indigo-600 rounded-full font-semibold">
                  Current Plan
                </span>
              ) : (
                <button
                  onClick={() => handleUpgrade('PREMIUM')}
                  className="w-full px-6 py-3 text-white bg-gradient-to-r from-purple-600 to-indigo-600 rounded-full font-semibold hover:opacity-90 transition-opacity"
                >
                  Upgrade to Premium
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="text-center mt-8 text-gray-600">
          <p>All plans include access to our core features and future updates.</p>
          <p className="mt-2">
            Questions? Contact us at{' '}
            <a href="mailto:support@pickleyourspot.com" className="text-primary hover:underline">
              support@pickleyourspot.com
            </a>
          </p>
        </div>
      </div>
    </div>
  );
} 