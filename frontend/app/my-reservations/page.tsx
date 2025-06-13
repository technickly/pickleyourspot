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
            Make New Event
          </Link>
        </header>

        <div className="grid gap-4">
          {reservations.map((reservation) => (
            <Link
              key={reservation.id}
              href={`/reservations/${reservation.id}`}
              className="block border rounded-lg p-4 hover:shadow-lg transition-all hover:border-blue-200 cursor-pointer"
            >
              <div className="flex justify-between items-start">
                <div className="space-y-3 w-full">
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900">{reservation.name}</h3>
                    <p className="text-gray-600">
                      {reservation.courtName} • {formatInTimeZone(new Date(reservation.startTime), timeZone, 'EEEE, MMMM d, yyyy')} at{' '}
                      {formatInTimeZone(new Date(reservation.startTime), timeZone, 'h:mm a')} -{' '}
                      {formatInTimeZone(new Date(reservation.endTime), timeZone, 'h:mm a')} PT
                    </p>
                  </div>

                  {reservation.description && (
                    <div className="text-sm text-gray-600">
                      <div className="p-2 bg-gray-50 rounded">
                        <span className="font-medium">Notes: </span>
                        {reservation.description}
                      </div>
                    </div>
                  )}

                  {reservation.paymentRequired && (
                    <div className="text-sm">
                      <div className="p-2 bg-yellow-50 rounded">
                        <span className="font-medium text-yellow-800">💰 Payment Required • </span>
                        <span className="text-yellow-700">{reservation.paymentInfo}</span>
                      </div>
                    </div>
                  )}

                  {reservation.participants.length > 0 && (
                    <div className="text-sm">
                      <div className="font-medium text-gray-700 mb-1">Participants:</div>
                      <div className="grid grid-cols-1 gap-2">
                        {reservation.participants.map((participant) => (
                          <div
                            key={participant.email}
                            className="flex items-center justify-between p-2 rounded bg-gray-50"
                            onClick={(e) => e.preventDefault()}
                          >
                            <span>{participant.name || participant.email}</span>
                            <div className="flex gap-2">
                              <button
                                onClick={() =>
                                  handleStatusUpdate(
                                    reservation.id,
                                    participant.userId,
                                    'attendance',
                                    !participant.isGoing
                                  )
                                }
                                className={`px-2 py-1 rounded text-xs font-medium ${
                                  participant.isGoing
                                    ? 'bg-green-100 text-green-800 hover:bg-green-200'
                                    : 'bg-red-100 text-red-800 hover:bg-red-200'
                                }`}
                              >
                                {participant.isGoing ? '✓ Going' : '✗ Not Going'}
                              </button>
                              {reservation.paymentRequired && (
                                <button
                                  onClick={() =>
                                    handleStatusUpdate(
                                      reservation.id,
                                      participant.userId,
                                      'payment',
                                      !participant.hasPaid
                                    )
                                  }
                                  className={`px-2 py-1 rounded text-xs font-medium ${
                                    participant.hasPaid
                                      ? 'bg-green-100 text-green-800 hover:bg-green-200'
                                      : 'bg-red-100 text-red-800 hover:bg-red-200'
                                  }`}
                                >
                                  {participant.hasPaid ? '✓ Paid' : '✗ Not Paid'}
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
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
                  {reservation.isOwner && (
                    <div className="flex gap-2" onClick={(e) => e.preventDefault()}>
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          router.push(`/reservations/${reservation.id}/edit`);
                        }}
                        className="px-3 py-1 bg-blue-100 text-blue-800 rounded hover:bg-blue-200 text-sm font-medium transition-colors"
                      >
                        Edit
                      </button>
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setShowDeleteConfirm(reservation.id);
                        }}
                        className="px-3 py-1 bg-red-100 text-red-800 rounded hover:bg-red-200 text-sm font-medium transition-colors"
                      >
                        Delete
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-4 flex gap-4 items-center">
                <span className="text-blue-500">View Details →</span>
                <div className="h-4 w-px bg-gray-300" />
                <div onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                }}>
                  <CopyButton 
                    text={typeof window !== 'undefined' ? `${window.location.origin}/r/${reservation.shortUrl}` : `${process.env.NEXT_PUBLIC_URL || ''}/r/${reservation.shortUrl}`}
                    label="Share"
                  />
                </div>
              </div>
            </Link>
          ))}

          {reservations.length === 0 && (
            <p className="text-gray-500 text-center py-8">
              No reservations found. Make your first reservation!
            </p>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full">
            <h3 className="text-lg font-semibold mb-4">Delete Reservation</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete this reservation? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowDeleteConfirm(null)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium"
                disabled={isDeleting}
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteReservation(showDeleteConfirm)}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 font-medium disabled:bg-red-300"
                disabled={isDeleting}
              >
                {isDeleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
} 