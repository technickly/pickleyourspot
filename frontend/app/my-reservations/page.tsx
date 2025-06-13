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

  const filteredReservations = reservations
    .filter(reservation => {
      // If user is owner, show only as owner
      if (reservation.isOwner) return true;
      // If user is not owner, show as participant
      return !reservations.some(r => r.id === reservation.id && r.isOwner);
    })
    .filter(reservation => {
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
    <div className="min-h-screen p-8 bg-gray-50">
      <div className="max-w-4xl mx-auto">
        <header className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">My Events</h1>
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
            className={`px-4 py-2 rounded-lg transition-colors ${
              filter === 'all'
                ? 'bg-primary text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            All Events
          </button>
          <button
            onClick={() => setFilter('active')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              filter === 'active'
                ? 'bg-primary text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            Active Events
          </button>
          <button
            onClick={() => setFilter('past')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              filter === 'past'
                ? 'bg-primary text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            Past Events
          </button>
        </div>

        {filteredReservations.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow-sm">
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
          <div className="space-y-4">
            {filteredReservations.map((reservation, index) => (
              <div
                key={`${reservation.id}-${index}`}
                className="bg-white rounded-lg shadow-sm hover:shadow-md transition-all cursor-pointer group"
                onClick={() => router.push(`/r/${reservation.shortUrl}`)}
              >
                <div className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <h2 className="text-xl font-semibold text-gray-900">{reservation.name}</h2>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          isPastEvent(reservation.endTime)
                            ? 'bg-gray-100 text-gray-600'
                            : 'bg-green-100 text-green-700'
                        }`}>
                          {isPastEvent(reservation.endTime) ? 'Past' : 'Active'}
                        </span>
                      </div>
                      <p className="text-gray-600">{reservation.courtName}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <CopyButton
                        text={`${window.location.origin}/r/${reservation.shortUrl}`}
                        label="Share Event"
                      />
                      {reservation.isOwner && !isPastEvent(reservation.endTime) && (
                        <Link
                          href={`/reservations/${reservation.id}/edit`}
                          className="button-secondary"
                          onClick={(e) => e.stopPropagation()}
                        >
                          Modify
                        </Link>
                      )}
                      {reservation.isOwner && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setShowDeleteConfirm(reservation.id);
                          }}
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
                      <p className="text-sm text-gray-500 mb-1">Date & Time</p>
                      <p className="font-medium text-gray-900">
                        {formatInTimeZone(
                          new Date(reservation.startTime),
                          timeZone,
                          'EEEE, MMMM d, yyyy'
                        )}
                      </p>
                      <p className="font-medium text-gray-900">
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
                      <p className="text-sm text-gray-500 mb-1">Participants</p>
                      <div className="space-y-2">
                        {reservation.participants.map((participant, idx) => (
                          <div key={idx} className="flex items-center gap-2">
                            <span className="text-gray-900">{participant.name || participant.email}</span>
                            <div className="flex gap-1">
                              <span className={`px-2 py-0.5 rounded text-xs ${
                                participant.isGoing
                                  ? 'bg-green-100 text-green-700'
                                  : 'bg-gray-100 text-gray-600'
                              }`}>
                                {participant.isGoing ? 'Going' : 'Not Going'}
                              </span>
                              {reservation.paymentRequired && (
                                <span className={`px-2 py-0.5 rounded text-xs ${
                                  participant.hasPaid
                                    ? 'bg-blue-100 text-blue-700'
                                    : 'bg-gray-100 text-gray-600'
                                }`}>
                                  {participant.hasPaid ? 'Paid' : 'Unpaid'}
                                </span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {reservation.description && (
                    <div className="mb-4">
                      <p className="text-sm text-gray-500 mb-1">Description</p>
                      <p className="text-gray-700">{reservation.description}</p>
                    </div>
                  )}

                  {reservation.paymentRequired && reservation.paymentInfo && (
                    <div className="mb-4">
                      <p className="text-sm text-gray-500 mb-1">Payment Information</p>
                      <p className="text-gray-700">{reservation.paymentInfo}</p>
                    </div>
                  )}

                  {showDeleteConfirm === reservation.id && (
                    <div 
                      className="mt-4 p-4 bg-red-50 rounded-lg"
                      onClick={(e) => e.stopPropagation()}
                    >
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
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
} 