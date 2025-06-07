'use client';

import { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import MembershipTiers from '@/app/components/MembershipTiers';
import { FaArrowLeft, FaCheck, FaTimes } from 'react-icons/fa';

interface Feature {
  name: string;
  free: string;
  basic: string;
  supr: string;
}

const features: Feature[] = [
  {
    name: 'Active Reservations',
    free: '3',
    basic: '10',
    supr: 'Unlimited'
  },
  {
    name: 'Participants per Reservation',
    free: '6',
    basic: '16',
    supr: 'Unlimited'
  },
  {
    name: 'Reservation Statistics',
    free: 'None',
    basic: 'Basic',
    supr: 'Advanced'
  },
  {
    name: 'Invitations',
    free: 'Link Only',
    basic: 'Email',
    supr: 'Email & Text'
  },
  {
    name: 'Tournament Tools',
    free: 'View Only',
    basic: 'Basic',
    supr: 'Advanced'
  },
  {
    name: 'Support',
    free: 'Standard',
    basic: 'Priority',
    supr: 'VIP'
  }
];

type TierType = 'free' | 'basic' | 'supr';

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

        {/* Membership Tiers Description */}
        <div className="mb-12">
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

        {/* Feature Comparison */}
        <div className="bg-white rounded-xl shadow-lg p-8 mb-12">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6 text-center">
            Compare Plan Features
          </h2>
          
          {/* Mobile View - Vertical Cards */}
          <div className="md:hidden space-y-8">
            {['Free', 'Basic', 'Supr'].map((tier) => (
              <div key={tier} className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-xl font-semibold mb-4 text-center">{tier}</h3>
                <div className="space-y-4">
                  {features.map((feature) => (
                    <div key={feature.name} className="flex justify-between items-center border-b pb-2">
                      <span className="text-gray-600">{feature.name}</span>
                      <span className="font-medium">
                        {feature[tier.toLowerCase() as TierType]}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Desktop View - Table */}
          <div className="hidden md:block">
            <div className="grid grid-cols-4 gap-4">
              <div className="font-semibold">Feature</div>
              <div className="text-center font-semibold">Free</div>
              <div className="text-center font-semibold">Basic</div>
              <div className="text-center font-semibold">Supr</div>
              
              {features.map((feature) => (
                <>
                  <div className="py-4 border-t">{feature.name}</div>
                  <div className="py-4 border-t text-center">{feature.free}</div>
                  <div className="py-4 border-t text-center">{feature.basic}</div>
                  <div className="py-4 border-t text-center">{feature.supr}</div>
                </>
              ))}
            </div>
          </div>
        </div>

        {/* Membership Tiers Pricing */}
        <div id="plans">
          <MembershipTiers 
            currentTier={(session?.user as any)?.role || 'FREE'} 
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