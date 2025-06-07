'use client';

import { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import MembershipTiers from '@/app/components/MembershipTiers';
import { FaArrowLeft } from 'react-icons/fa';

export default function UpgradePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnPath = searchParams.get('returnTo') || '/my-account';

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/');
    }
  }, [status, router]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header Section */}
        <div className="text-center mb-12">
          <button
            onClick={() => router.push(returnPath)}
            className="inline-flex items-center text-gray-600 hover:text-gray-800 mb-8"
          >
            <FaArrowLeft className="mr-2" />
            Back
          </button>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Upgrade Your Pickleball Experience
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Choose the perfect plan that matches your pickleball journey and community involvement
          </p>
        </div>

        {/* Feature Comparison */}
        <div className="bg-white rounded-xl shadow-lg p-8 mb-12">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6 text-center">
            Compare Plan Features
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b-2 border-gray-200">
                  <th className="text-left py-4 px-4">Feature</th>
                  <th className="text-center py-4 px-4">Free</th>
                  <th className="text-center py-4 px-4">Basic</th>
                  <th className="text-center py-4 px-4">Supr</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-gray-100">
                  <td className="py-4 px-4">Active Reservations</td>
                  <td className="text-center py-4 px-4">3</td>
                  <td className="text-center py-4 px-4">10</td>
                  <td className="text-center py-4 px-4">Unlimited</td>
                </tr>
                <tr className="border-b border-gray-100">
                  <td className="py-4 px-4">Participants per Reservation</td>
                  <td className="text-center py-4 px-4">4</td>
                  <td className="text-center py-4 px-4">16</td>
                  <td className="text-center py-4 px-4">Unlimited</td>
                </tr>
                <tr className="border-b border-gray-100">
                  <td className="py-4 px-4">Reservation Statistics</td>
                  <td className="text-center py-4 px-4">None</td>
                  <td className="text-center py-4 px-4">✓</td>
                  <td className="text-center py-4 px-4">Advanced</td>
                </tr>
                <tr className="border-b border-gray-100">
                  <td className="py-4 px-4">Invitations</td>
                  <td className="text-center py-4 px-4">Link Only</td>
                  <td className="text-center py-4 px-4">Email</td>
                  <td className="text-center py-4 px-4">Email & Text</td>
                </tr>
                <tr className="border-b border-gray-100">
                  <td className="py-4 px-4">Tournament Tools</td>
                  <td className="text-center py-4 px-4">View Only</td>
                  <td className="text-center py-4 px-4">Basic</td>
                  <td className="text-center py-4 px-4">Advanced</td>
                </tr>
                <tr className="border-b border-gray-100">
                  <td className="py-4 px-4">Support</td>
                  <td className="text-center py-4 px-4">Standard</td>
                  <td className="text-center py-4 px-4">Priority</td>
                  <td className="text-center py-4 px-4">VIP</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Membership Tiers */}
        <div id="plans">
          <div className="text-center mb-12">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Free Tier Description */}
              <div className="bg-white rounded-lg p-6 shadow-md">
                <h3 className="text-lg font-semibold mb-2">Free</h3>
                <p className="text-gray-600">Perfect for active pickleballers who want to stay connected with their community and participate in events.</p>
              </div>
              {/* Basic Tier Description */}
              <div className="bg-white rounded-lg p-6 shadow-md">
                <h3 className="text-lg font-semibold mb-2">Basic</h3>
                <p className="text-gray-600">Ideal for regular players who organize games and want better tools to coordinate with their pickleball groups.</p>
              </div>
              {/* Supr Tier Description */}
              <div className="bg-white rounded-lg p-6 shadow-md">
                <h3 className="text-lg font-semibold mb-2">Supr</h3>
                <p className="text-gray-600">Built for tournament organizers and community leaders who run larger events and need advanced management tools.</p>
              </div>
            </div>
          </div>
          <MembershipTiers 
            currentTier={session?.user?.role || 'FREE'} 
            showComparison={false}
          />
        </div>

        {/* FAQ Section */}
        <div className="mt-16">
          <h2 className="text-2xl font-semibold text-gray-900 mb-8 text-center">
            Frequently Asked Questions
          </h2>
          <div className="grid gap-6 md:grid-cols-2">
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="font-semibold text-lg mb-2">Can I change plans later?</h3>
              <p className="text-gray-600">Yes, you can upgrade or downgrade your plan at any time. Changes take effect immediately.</p>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="font-semibold text-lg mb-2">What payment methods are accepted?</h3>
              <p className="text-gray-600">We accept all major credit cards and digital payment methods through our secure payment processor.</p>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="font-semibold text-lg mb-2">Is there a contract or commitment?</h3>
              <p className="text-gray-600">No, all plans are month-to-month with no long-term commitment required.</p>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="font-semibold text-lg mb-2">What happens to my data if I downgrade?</h3>
              <p className="text-gray-600">Your data is always preserved, but some features may become unavailable on lower tiers.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 