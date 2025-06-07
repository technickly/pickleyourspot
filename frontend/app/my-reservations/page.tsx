'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { toast } from 'react-hot-toast';

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
}

export default function MyReservationsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [isLoading, setIsLoading] = useState(true);

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

      // Sort reservations: active first, then by date
      const sortedReservations = reservationsWithStatus.sort((a: Reservation, b: Reservation) => {
        if (a.status === 'active' && b.status === 'past') return -1;
        if (a.status === 'past' && b.status === 'active') return 1;
        return new Date(a.startTime).getTime() - new Date(b.startTime).getTime();
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
    type: 'payment' | 'attendance',
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
                <div>
                  <h2 className="text-2xl font-semibold mb-2">
                    {reservation.name.split(' ').map(word => 
                      word.charAt(0).toUpperCase() + word.slice(1)
                    ).join(' ')}
                  </h2>
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
              <div>
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
                  {reservation.status === 'active' ? 'Upcoming' : 'Completed'}
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
    </div>
  );
} 