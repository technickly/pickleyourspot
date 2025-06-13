'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession, signIn } from 'next-auth/react';
import { toast } from 'react-hot-toast';
import { formatInTimeZone } from 'date-fns-tz';
import React from 'react';

interface Reservation {
  id: string;
  name: string;
  courtName: string;
  startTime: string;
  endTime: string;
  description?: string | null;
  paymentRequired: boolean;
  paymentInfo?: string | null;
  participants: {
    name: string | null;
    email: string;
    userId: string;
  }[];
  owner: {
    name: string | null;
    email: string;
  };
}

const timeZone = 'America/Los_Angeles';

export default function SharedReservationPage({ params }: { params: Promise<{ shortUrl: string }> }) {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [reservation, setReservation] = useState<Reservation | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isJoining, setIsJoining] = useState(false);
  const resolvedParams = React.use(params);

  useEffect(() => {
    fetchReservation();
  }, [resolvedParams.shortUrl]);

  useEffect(() => {
    // When user signs in, automatically try to join the reservation
    if (session?.user?.email && reservation && !isJoining) {
      const isAlreadyParticipant = reservation.participants.some(
        p => p.email === session.user?.email
      );
      const isOwner = reservation.owner.email === session.user?.email;

      if (!isAlreadyParticipant && !isOwner) {
        handleJoinReservation();
      }
    }
  }, [session, reservation]);

  const fetchReservation = async () => {
    try {
      const response = await fetch(`/api/reservations/shared/${resolvedParams.shortUrl}`);
      if (!response.ok) {
        throw new Error('Failed to fetch reservation');
      }
      const data = await response.json();
      setReservation(data);
    } catch (error) {
      toast.error('Failed to fetch reservation details');
      router.push('/');
    } finally {
      setIsLoading(false);
    }
  };

  const handleJoinReservation = async () => {
    if (!session?.user?.email || !reservation) return;

    setIsJoining(true);
    try {
      const response = await fetch(`/api/reservations/${reservation.id}/join`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to join reservation');
      }

      toast.success('Successfully joined the reservation!');
      await fetchReservation(); // Refresh the reservation data
    } catch (error) {
      console.error('Error joining reservation:', error);
      toast.error('Failed to join the reservation');
    } finally {
      setIsJoining(false);
    }
  };

  if (isLoading) {
    return <div className="flex justify-center items-center min-h-screen">Loading...</div>;
  }

  if (!reservation) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <h1 className="text-2xl font-bold mb-4">Reservation Not Found</h1>
        <p className="text-gray-600 mb-4">This reservation may have been deleted or the link is invalid.</p>
        <button
          onClick={() => router.push('/')}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          Go Home
        </button>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <h1 className="text-2xl font-bold mb-4">Join {reservation.name}</h1>
        <p className="text-gray-600 mb-6">Sign in to join this pickleball reservation.</p>
        <button
          onClick={() => signIn('google', { callbackUrl: `/r/${resolvedParams.shortUrl}` })}
          className="bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 flex items-center gap-2"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path
              fill="currentColor"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="currentColor"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="currentColor"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="currentColor"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
          Sign in with Google
        </button>
      </div>
    );
  }

  return (
    <main className="min-h-screen p-8">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="p-6">
            <h1 className="text-2xl font-bold mb-2">{reservation.name}</h1>
            <p className="text-gray-600 mb-4">{reservation.courtName}</p>

            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-semibold mb-2">Time</h2>
                <p className="text-gray-700">
                  {formatInTimeZone(new Date(reservation.startTime), timeZone, 'EEEE, MMMM d, yyyy')}
                  <br />
                  {formatInTimeZone(new Date(reservation.startTime), timeZone, 'h:mm a')} -{' '}
                  {formatInTimeZone(new Date(reservation.endTime), timeZone, 'h:mm a')} PT
                </p>
              </div>

              {reservation.description && (
                <div>
                  <h2 className="text-lg font-semibold mb-2">Court Description:</h2>
                  <p className="text-gray-700 bg-gray-50 p-3 rounded-lg">{reservation.description}</p>
                </div>
              )}

              {reservation.paymentRequired && (
                <div>
                  <h2 className="text-lg font-semibold mb-2">Payment Information</h2>
                  <div className="bg-yellow-50 p-3 rounded-lg">
                    <p className="text-yellow-800">{reservation.paymentInfo}</p>
                  </div>
                </div>
              )}

              <div>
                <h2 className="text-lg font-semibold mb-2">Participants</h2>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-gray-700">
                    <span className="font-medium">Owner:</span>
                    <span>{reservation.owner.name || reservation.owner.email}</span>
                  </div>
                  {reservation.participants.length > 0 && (
                    <div className="grid gap-2">
                      {reservation.participants.map((participant) => (
                        <div
                          key={participant.userId}
                          className="flex items-center justify-between bg-gray-50 p-2 rounded"
                        >
                          <span>{participant.name || participant.email}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
} 