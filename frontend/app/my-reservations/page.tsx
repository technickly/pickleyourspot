'use client';

import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { toast } from 'react-hot-toast';
import { formatInTimeZone } from 'date-fns-tz';
import CopyButton from '@/app/components/CopyButton';

interface Reservation {
  id: string;
  shortUrl: string;
  courtName: string;
  startTime: string;
  endTime: string;
  isOwner: boolean;
  description?: string | null;
}

const timeZone = 'America/Los_Angeles';

export default function MyReservationsPage() {
  const { data: session, status } = useSession();
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (session?.user?.email) {
      fetchReservations();
    }
  }, [session]);

  const fetchReservations = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/reservations/user?email=${encodeURIComponent(session?.user?.email || '')}`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch reservations');
      }
      const data = await response.json();
      setReservations(data);
    } catch (error) {
      console.error('Error fetching reservations:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to fetch reservations');
      setReservations([]); // Reset to empty array on error
    } finally {
      setIsLoading(false);
    }
  };

  if (status === 'loading' || isLoading) {
    return <div className="flex justify-center items-center min-h-screen">Loading...</div>;
  }

  if (!session) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <p className="text-xl mb-4">Please sign in to view your reservations</p>
        <Link
          href="/"
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          Go to Home
        </Link>
      </div>
    );
  }

  return (
    <main className="min-h-screen p-8">
      <div className="max-w-4xl mx-auto">
        <header className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">My Reservations</h1>
          <Link
            href="/courts"
            className="button-primary hover-lift"
          >
            Make New Reservation
          </Link>
        </header>

        <div className="grid gap-4">
          {reservations.map((reservation) => (
            <div
              key={reservation.id}
              className="border rounded-lg p-4 hover:shadow-lg transition-shadow"
            >
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-xl font-semibold">{reservation.courtName}</h3>
                  <p className="text-gray-600">
                    {formatInTimeZone(new Date(reservation.startTime), timeZone, 'EEEE, MMMM d, yyyy')} at{' '}
                    {formatInTimeZone(new Date(reservation.startTime), timeZone, 'h:mm a')} -{' '}
                    {formatInTimeZone(new Date(reservation.endTime), timeZone, 'h:mm a')} PT
                  </p>
                  {reservation.description && (
                    <div className="mt-2 text-sm text-gray-600">
                      <div className="p-2 bg-gray-50 rounded">
                        <span className="font-medium">Notes: </span>
                        {reservation.description}
                      </div>
                    </div>
                  )}
                </div>
                <div className="flex flex-col items-end gap-2">
                  <span
                    className={`px-2 py-1 rounded text-sm ${
                      reservation.isOwner
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {reservation.isOwner ? 'Owner' : 'Participant'}
                  </span>
                </div>
              </div>

              <div className="mt-4 flex gap-4 items-center">
                <Link
                  href={`/reservations/${reservation.id}`}
                  className="text-blue-500 hover:underline"
                >
                  View Details
                </Link>
                <div className="h-4 w-px bg-gray-300" />
                <CopyButton 
                  text={typeof window !== 'undefined' ? `${window.location.origin}/r/${reservation.shortUrl}` : `${process.env.NEXT_PUBLIC_URL || ''}/r/${reservation.shortUrl}`}
                  label="Share"
                />
              </div>
            </div>
          ))}

          {reservations.length === 0 && (
            <p className="text-gray-500 text-center py-8">
              No reservations found. Make your first reservation!
            </p>
          )}
        </div>
      </div>
    </main>
  );
} 