'use client';

import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { toast } from 'react-hot-toast';
import { formatInTimeZone } from 'date-fns-tz';
import CopyButton from '@/app/components/CopyButton';
import { useRouter } from 'next/navigation';

interface Participant {
  name: string | null;
  email: string;
  hasPaid: boolean;
  isGoing: boolean;
  userId: string;
}

interface Reservation {
  id: string;
  shortUrl: string;
  courtName: string;
  name: string;
  startTime: string;
  endTime: string;
  isOwner: boolean;
  description?: string | null;
  paymentRequired: boolean;
  paymentInfo?: string | null;
  participants: Participant[];
}

const timeZone = 'America/Los_Angeles';

export default function MyReservationsPage() {
  const { data: session, status } = useSession();
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [filter, setFilter] = useState<'all' | 'active' | 'past'>('active');
  const router = useRouter();

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

  const handleDeleteReservation = async (reservationId: string) => {
    setIsDeleting(true);
    try {
      const response = await fetch(`/api/reservations/${reservationId}/delete`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete reservation');
      }

      toast.success('Reservation deleted successfully');
      await fetchReservations(); // Refresh the list
    } catch (error) {
      toast.error('Failed to delete reservation');
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(null);
    }
  };

  const handleStatusUpdate = async (
    reservationId: string,
    userId: string,
    type: 'payment' | 'attendance',
    newValue: boolean
  ) => {
    try {
      const response = await fetch(`/api/reservations/${reservationId}/participant-status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          type,
          value: newValue,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update status');
      }

      await fetchReservations(); // Refresh the list
      toast.success(`${type === 'payment' ? 'Payment' : 'Attendance'} status updated`);
    } catch (error) {
      toast.error(`Failed to update ${type} status`);
    }
  };

  const isPastEvent = (endTime: string) => {
    return new Date(endTime) < new Date();
  };

  const filteredReservations = reservations.filter(reservation => {
    if (filter === 'all') return true;
    if (filter === 'active') return !isPastEvent(reservation.endTime);
    if (filter === 'past') return isPastEvent(reservation.endTime);
    return true;
  });

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
    <div className="min-h-screen p-8">
      <div className="max-w-4xl mx-auto">
        <header className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">My Events</h1>
          <Link
            href="/courts"
            className="button-primary hover-lift"
          >
            Make New Event
          </Link>
        </header>

        <div className="mb-6 flex gap-4">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg ${
              filter === 'all'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            All Events
          </button>
          <button
            onClick={() => setFilter('active')}
            className={`px-4 py-2 rounded-lg ${
              filter === 'active'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Active Events
          </button>
          <button
            onClick={() => setFilter('past')}
            className={`px-4 py-2 rounded-lg ${
              filter === 'past'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Past Events
          </button>
        </div>

        {filteredReservations.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600 text-lg mb-4">
              {filter === 'all'
                ? "You haven't created or joined any events yet."
                : filter === 'active'
                ? "You don't have any active events."
                : "You don't have any past events."}
            </p>
            <Link
              href="/courts"
              className="button-primary hover-lift"
            >
              Create Your First Event
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {filteredReservations.map((reservation) => (
              <div
                key={reservation.id}
                className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h2 className="text-xl font-semibold mb-2">{reservation.name}</h2>
                    <p className="text-gray-600">{reservation.courtName}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <CopyButton
                      text={`${window.location.origin}/r/${reservation.shortUrl}`}
                      label="Copy Link"
                    />
                    {reservation.isOwner && !isPastEvent(reservation.endTime) && (
                      <Link
                        href={`/reservations/${reservation.id}/edit`}
                        className="button-secondary"
                      >
                        Modify
                      </Link>
                    )}
                    {reservation.isOwner && (
                      <button
                        onClick={() => setShowDeleteConfirm(reservation.id)}
                        className="text-red-600 hover:text-red-700"
                        disabled={isDeleting}
                      >
                        Delete
                      </button>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <p className="text-sm text-gray-500">Date & Time</p>
                    <p className="font-medium">
                      {formatInTimeZone(
                        new Date(reservation.startTime),
                        timeZone,
                        'EEEE, MMMM d, yyyy'
                      )}
                    </p>
                    <p className="font-medium">
                      {formatInTimeZone(
                        new Date(reservation.startTime),
                        timeZone,
                        'h:mm a'
                      )}{' '}
                      -{' '}
                      {formatInTimeZone(
                        new Date(reservation.endTime),
                        timeZone,
                        'h:mm a'
                      )}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Participants</p>
                    <p className="font-medium">
                      {reservation.participants.filter(p => p.isGoing).length} going
                    </p>
                    {reservation.paymentRequired && (
                      <p className="font-medium">
                        {reservation.participants.filter(p => p.hasPaid).length} paid
                      </p>
                    )}
                  </div>
                </div>

                {reservation.description && (
                  <div className="mb-4">
                    <p className="text-sm text-gray-500">Description</p>
                    <p className="text-gray-700">{reservation.description}</p>
                  </div>
                )}

                {reservation.paymentRequired && reservation.paymentInfo && (
                  <div className="mb-4">
                    <p className="text-sm text-gray-500">Payment Information</p>
                    <p className="text-gray-700">{reservation.paymentInfo}</p>
                  </div>
                )}

                {showDeleteConfirm === reservation.id && (
                  <div className="mt-4 p-4 bg-red-50 rounded-lg">
                    <p className="text-red-700 mb-2">Are you sure you want to delete this event?</p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleDeleteReservation(reservation.id)}
                        className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
                        disabled={isDeleting}
                      >
                        {isDeleting ? 'Deleting...' : 'Yes, Delete'}
                      </button>
                      <button
                        onClick={() => setShowDeleteConfirm(null)}
                        className="bg-gray-200 text-gray-700 px-4 py-2 rounded hover:bg-gray-300"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
} 