'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { format } from 'date-fns';
import { FaCamera } from 'react-icons/fa';
import { toast } from 'react-hot-toast';
import MembershipTiers from '@/app/components/MembershipTiers';

interface UserStats {
  joinDate: string;
  membershipTier: string;
  totalReservationsCreated: number;
  totalReservationsJoined: number;
}

interface ReservationStats {
  totalReservations: number;
  upcomingReservations: number;
  pastReservations: number;
  totalParticipants: number;
  averageParticipants: number;
  participantStats: {
    going: number;
    notGoing: number;
    paid: number;
    unpaid: number;
  };
}

export default function MyAccountPage() {
  const { data: session, status, update: updateSession } = useSession();
  const router = useRouter();
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [reservationStats, setReservationStats] = useState<ReservationStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (status === 'loading') return;
    if (!session?.user?.email) {
      router.push('/');
      return;
    }

    const fetchStats = async () => {
      try {
        const response = await fetch(`/api/users/${session.user.email}/stats`);
        if (!response.ok) {
          throw new Error('Failed to fetch user stats');
        }
        const data = await response.json();
        setUserStats(data.userStats);
        setReservationStats(data.reservationStats);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [session, status, router]);

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append('image', file);

    try {
      const response = await fetch('/api/users/profile-image', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to upload image');
      }

      const data = await response.json();
      await updateSession({
        ...session,
        user: {
          ...session?.user,
          image: data.imageUrl,
        },
      });

      toast.success('Profile image updated successfully');
    } catch (error) {
      toast.error('Failed to upload image');
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-900">Loading...</h2>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-red-600">Error</h2>
            <p className="mt-4 text-gray-600">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'FREE':
        return 'text-gray-600';
      case 'BASIC':
        return 'text-blue-600';
      case 'SUPR':
        return 'text-purple-600';
      case 'ADMIN':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* User Profile Section */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <div className="flex items-center space-x-4">
            <div className="relative">
              {session?.user?.image && (
                <Image
                  src={session.user.image}
                  alt="Profile"
                  width={80}
                  height={80}
                  className="rounded-full"
                />
              )}
              <label 
                htmlFor="image-upload" 
                className="absolute bottom-0 right-0 bg-white rounded-full p-2 shadow-lg cursor-pointer hover:bg-gray-100 transition-colors"
              >
                <FaCamera className="text-gray-600" />
              </label>
              <input
                type="file"
                id="image-upload"
                accept="image/*"
                className="hidden"
                onChange={handleImageUpload}
                disabled={uploading}
              />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{session?.user?.name}</h1>
              <p className="text-gray-600">{session?.user?.email}</p>
              {userStats && (
                <p className="text-sm text-gray-500">
                  Member since {format(new Date(userStats.joinDate), 'MMMM d, yyyy')}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Membership Status */}
        {userStats && (
          <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Current Membership</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-blue-50 rounded-lg p-4">
                <p className="text-sm text-gray-600">Tier Status</p>
                <p className={`text-2xl font-bold ${getTierColor(userStats.membershipTier)}`}>
                  {userStats.membershipTier}
                </p>
              </div>
              <div className="bg-green-50 rounded-lg p-4">
                <p className="text-sm text-gray-600">Total Reservations</p>
                <p className="text-2xl font-bold text-green-600">
                  {userStats.totalReservationsCreated + userStats.totalReservationsJoined}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Reservation Statistics */}
        {reservationStats && (
          <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Reservation Statistics</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-purple-50 rounded-lg p-4">
                <p className="text-sm text-gray-600">Upcoming Reservations</p>
                <p className="text-2xl font-bold text-purple-600">{reservationStats.upcomingReservations}</p>
              </div>
              <div className="bg-yellow-50 rounded-lg p-4">
                <p className="text-sm text-gray-600">Past Reservations</p>
                <p className="text-2xl font-bold text-yellow-600">{reservationStats.pastReservations}</p>
              </div>
              <div className="bg-indigo-50 rounded-lg p-4">
                <p className="text-sm text-gray-600">Average Participants</p>
                <p className="text-2xl font-bold text-indigo-600">
                  {reservationStats.averageParticipants.toFixed(1)}
                </p>
              </div>
            </div>

            {/* Participant Statistics */}
            <div className="mt-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Participant Statistics</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-gray-600">Going</span>
                    <span className="text-sm font-semibold text-green-600">
                      {reservationStats.participantStats.going}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Not Going</span>
                    <span className="text-sm font-semibold text-red-600">
                      {reservationStats.participantStats.notGoing}
                    </span>
                  </div>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-gray-600">Paid</span>
                    <span className="text-sm font-semibold text-green-600">
                      {reservationStats.participantStats.paid}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Unpaid</span>
                    <span className="text-sm font-semibold text-red-600">
                      {reservationStats.participantStats.unpaid}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Membership Tiers */}
        {userStats && (
          <div id="membership-tiers">
            <MembershipTiers currentTier={userStats.membershipTier} />
          </div>
        )}
      </div>
    </div>
  );
} 