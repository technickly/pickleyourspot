'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { format, differenceInDays } from 'date-fns';
import { toast } from 'react-hot-toast';
import ReservationActions from '@/app/components/ReservationActions';
import Link from 'next/link';

interface Participant {
  name: string | null;
  email: string;
  hasPaid: boolean;
  isGoing: boolean;
  userId: string;
}

interface Reservation {
  id: string;
  name: string;
  startTime: string;
  endTime: string;
  courtId: string;
  courtName: string;
  court?: {
    id: string;
    name: string;
  };
  description?: string | null;
  paymentRequired: boolean;
  paymentInfo?: string | null;
  participants: Participant[];
  status: 'active' | 'past';
  isOwner: boolean;
}

export default function MyReservationsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [reservationToDelete, setReservationToDelete] = useState<string | null>(null);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/');
    }
  }, [status, router]);

  const fetchData = async () => {
    try {
      const reservationsResponse = await fetch(`/api/reservations/user?email=${encodeURIComponent(session?.user?.email || '')}`);
      if (!reservationsResponse.ok) {
        const errorData = await reservationsResponse.json();
        throw new Error(errorData.error || 'Failed to fetch reservations');
      }
      const reservationsData = await reservationsResponse.json();
      
      // Add status to each reservation
      const now = new Date();
      const reservationsWithStatus = reservationsData.map((res: Reservation) => ({
        ...res,
        status: new Date(res.endTime) > now ? 'active' : 'past'
      }));

      // Sort reservations: active first, then by date (soonest first)
      const sortedReservations = reservationsWithStatus.sort((a: Reservation, b: Reservation) => {
        // First sort by active/past
        if (a.status === 'active' && b.status === 'past') return -1;
        if (a.status === 'past' && b.status === 'active') return 1;
        
        // Then sort by date (soonest first)
        const dateA = new Date(a.startTime);
        const dateB = new Date(b.startTime);
        return dateA.getTime() - dateB.getTime();
      });

      setReservations(sortedReservations);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to fetch reservations');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (session?.user?.email) {
      fetchData();
    }
  }, [session]);

  const handleStatusUpdate = async (
    reservationId: string,
    userId: string,
    type: 'payment' | 'attendance' | 'delete',
    newValue: boolean
  ) => {
    try {
      // Optimistically update the UI
      const updatedReservations = reservations.map(reservation => {
        if (reservation.id === reservationId) {
          return {
            ...reservation,
            participants: reservation.participants.map(participant => {
              if (participant.userId === userId) {
                return {
                  ...participant,
                  [type === 'payment' ? 'hasPaid' : 'isGoing']: newValue
                };
              }
              return participant;
            })
          };
        }
        return reservation;
      });

      setReservations(updatedReservations);

      // Make API call
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

      toast.success(`${type === 'payment' ? 'Payment' : 'Attendance'} status updated`);
    } catch (error) {
      // Revert the optimistic update on error
      await fetchData();
      toast.error(`Failed to update ${type} status`);
    }
  };

  const getDaysUntilReservation = (startTime: string) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Reset time to start of day for accurate day calculation
    const reservationDate = new Date(startTime);
    reservationDate.setHours(0, 0, 0, 0);
    return differenceInDays(reservationDate, today);
  };

  const handleDeleteClick = (reservationId: string) => {
    setReservationToDelete(reservationId);
    setShowDeleteConfirm(true);
  };

  const handleDeleteConfirm = async () => {
    if (!reservationToDelete) return;

    try {
      const response = await fetch(`/api/reservations/${reservationToDelete}/delete`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete reservation');
      }

      // Remove the deleted reservation from state
      setReservations(prevReservations => 
        prevReservations.filter(res => res.id !== reservationToDelete)
      );
      
      toast.success('Reservation deleted successfully');
    } catch (error) {
      toast.error('Failed to delete reservation');
    } finally {
      setShowDeleteConfirm(false);
      setReservationToDelete(null);
    }
  };

  const handleDeleteCancel = () => {
    setShowDeleteConfirm(false);
    setReservationToDelete(null);
  };

  if (isLoading) {
    return <div className="flex justify-center items-center min-h-screen">Loading...</div>;
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">My Reservations</h1>

      <div className="grid gap-4">
        {reservations.map((reservation) => (
          <div
            key={reservation.id}
            className={`rounded-lg shadow-md p-6 transition-shadow ${
              reservation.status === 'active' 
                ? 'bg-white border-l-8 border-l-green-500' 
                : 'bg-gray-50 border-l-8 border-l-red-500'
            }`}
          >
            <div className="flex justify-between items-start">
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <h2 className="text-2xl font-semibold">
                    {reservation.name.split(' ').map(word => 
                      word.charAt(0).toUpperCase() + word.slice(1)
                    ).join(' ')}
                  </h2>
                  <span
                    className={`px-3 py-1 rounded-full text-sm ${
                      reservation.isOwner
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {reservation.isOwner ? 'Owner' : 'Participant'}
                  </span>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-1">Court Description:</h3>
                  <p className="text-gray-600">
                    {reservation.court?.name || reservation.courtName}
                  </p>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-1">Date & Time:</h3>
                  <p className="text-gray-600">
                    {format(new Date(reservation.startTime), 'EEEE, MMMM d, yyyy')}
                    <br />
                    {format(new Date(reservation.startTime), 'h:mm a')} -{' '}
                    {format(new Date(reservation.endTime), 'h:mm a')}
                  </p>
                </div>

                {reservation.description && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-700 mb-1">Description:</h3>
                    <p className="text-gray-600 bg-gray-50 p-2 rounded">
                      {reservation.description}
                    </p>
                  </div>
                )}

                {reservation.participants.length > 0 && (
                  <div className="mt-4">
                    <h3 className="text-lg font-medium mb-2">Participants</h3>
                    <div className="space-y-2">
                      {reservation.participants.map((participant) => (
                        <div
                          key={participant.email}
                          className="bg-gray-50 p-3 rounded-lg"
                        >
                          <div className="flex flex-col">
                            <span className="font-medium">
                              {participant.name || 'No name provided'}
                            </span>
                            <span className="text-sm text-gray-500">
                              {participant.email}
                            </span>
                          </div>
                          <div className="flex gap-2 mt-2">
                            <button
                              onClick={() => handleStatusUpdate(
                                reservation.id,
                                participant.userId,
                                'attendance',
                                !participant.isGoing
                              )}
                              className={`px-2 py-1 text-xs rounded cursor-pointer transition-colors ${
                                participant.isGoing
                                  ? 'bg-green-100 text-green-800 hover:bg-green-200'
                                  : 'bg-red-100 text-red-800 hover:bg-red-200'
                              }`}
                            >
                              {participant.isGoing ? '✓ Going' : '✗ Not Going'}
                            </button>
                            {reservation.paymentRequired && (
                              <button
                                onClick={() => handleStatusUpdate(
                                  reservation.id,
                                  participant.userId,
                                  'payment',
                                  !participant.hasPaid
                                )}
                                className={`px-2 py-1 text-xs rounded cursor-pointer transition-colors ${
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

                {reservation.paymentRequired && (
                  <div className="mt-4">
                    <div className="bg-yellow-50 p-3 rounded-lg">
                      <span className="font-medium text-yellow-800">💰 Payment Required</span>
                      {reservation.paymentInfo && (
                        <p className="text-yellow-700 mt-1">{reservation.paymentInfo}</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
              <div className="flex flex-col items-end gap-3">
                <div
                  className={`text-2xl font-bold mb-2 ${
                    reservation.status === 'active'
                      ? 'text-green-600'
                      : 'text-red-600'
                  }`}
                >
                  {reservation.status === 'active' ? 'ACTIVE' : 'PAST'}
                </div>
                <div
                  className={`text-sm px-4 py-2 rounded-full ${
                    reservation.status === 'active'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800'
                  }`}
                >
                  {reservation.status === 'active' 
                    ? `Upcoming in ${getDaysUntilReservation(reservation.startTime)} Days`
                    : 'Completed'}
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col gap-2 mt-2">
                  <Link
                    href={`/reservations/${reservation.id}`}
                    className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center justify-center gap-2"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                      <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                    </svg>
                    View
                  </Link>
                  
                  {reservation.isOwner && (
                    <>
                      <Link
                        href={`/reservations/${reservation.id}/edit`}
                        className="px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors flex items-center justify-center gap-2"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                          <path d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828z" />
                          <path fillRule="evenodd" d="M2 6a2 2 0 012-2h4a1 1 0 010 2H4v10h10v-4a1 1 0 112 0v4a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" clipRule="evenodd" />
                        </svg>
                        Edit
                      </Link>
                      <button
                        onClick={() => handleDeleteClick(reservation.id)}
                        className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors flex items-center justify-center gap-2"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                        Delete
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}

        {reservations.length === 0 && (
          <div className="text-center py-8">
            <p className="text-gray-600">No reservations found.</p>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Delete Reservation</h3>
              <button
                onClick={handleDeleteCancel}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="mb-6">
              <div className="bg-red-50 text-red-800 p-4 rounded-lg mb-4">
                <div className="flex items-center gap-2 mb-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  <span className="font-medium">Warning</span>
                </div>
                <p className="text-sm">
                  This action cannot be undone. All reservation data, including messages and participant information, will be permanently deleted.
                </p>
              </div>
              <p className="text-gray-600 text-sm">
                Are you sure you want to delete this reservation?
              </p>
            </div>
            <div className="flex justify-end gap-3">
              <button
                onClick={handleDeleteCancel}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium flex items-center gap-2"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                Delete Reservation
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 