'use client';

import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { toast } from 'react-hot-toast';
import { formatInTimeZone } from 'date-fns-tz';
import CopyButton from '@/app/components/CopyButton';
import { useRouter } from 'next/navigation';
import ReservationFilters, { FilterOptions } from '@/app/components/ReservationFilters';
import { format } from 'date-fns';

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
  courtId: string;
  court: {
    id: string;
    name: string;
  };
  status: 'active' | 'past';
}

interface Court {
  id: string;
  name: string;
}

const timeZone = 'America/Los_Angeles';

export default function MyReservationsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [courts, setCourts] = useState<Court[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filteredReservations, setFilteredReservations] = useState<Reservation[]>([]);
  const [currentFilters, setCurrentFilters] = useState<FilterOptions>({
    status: ['active'], // Default to showing active reservations
    courts: [],
    date: null,
  });
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/');
    }
  }, [status, router]);

  const fetchData = async () => {
    try {
      // Fetch courts
      const courtsResponse = await fetch('/api/courts');
      const courtsData = await courtsResponse.json();
      setCourts(courtsData);

      // Fetch reservations
      const reservationsResponse = await fetch('/api/reservations/my');
      const reservationsData = await reservationsResponse.json();
      
      // Add status to each reservation
      const now = new Date();
      const reservationsWithStatus = reservationsData.map((res: Omit<Reservation, 'status'>) => ({
        ...res,
        status: new Date(res.endTime) > now ? 'active' : 'past'
      } as Reservation));

      setReservations(reservationsWithStatus);
      // Apply default filter (active reservations)
      const activeReservations = reservationsWithStatus.filter(res => res.status === 'active');
      setFilteredReservations(activeReservations);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (session?.user?.email) {
      fetchData();
    }
  }, [session]);

  const handleFilterChange = (filters: FilterOptions) => {
    setCurrentFilters(filters);
    let filtered = [...reservations];

    // Filter by status
    if (filters.status.length > 0) {
      filtered = filtered.filter(res => filters.status.includes(res.status));
    }

    // Filter by courts
    if (filters.courts.length > 0) {
      filtered = filtered.filter(res => filters.courts.includes(res.courtId));
    }

    // Filter by date
    if (filters.date) {
      const filterDate = format(filters.date, 'yyyy-MM-dd');
      filtered = filtered.filter(res => {
        const resDate = format(new Date(res.startTime), 'yyyy-MM-dd');
        return resDate === filterDate;
      });
    }

    setFilteredReservations(filtered);
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
      await fetchData(); // Refresh the list
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
      setFilteredReservations(prevFiltered => 
        prevFiltered.map(reservation => {
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
        })
      );

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
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">My Reservations</h1>
      
      <ReservationFilters
        onFilterChange={handleFilterChange}
        courts={courts}
      />

      <div className="grid gap-4">
        {filteredReservations.map((reservation) => (
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
                {/* Title Section */}
                <div>
                  <h2 className="text-2xl font-semibold mb-2">
                    {reservation.name.split(' ').map(word => 
                      word.charAt(0).toUpperCase() + word.slice(1)
                    ).join(' ')}
                  </h2>
                </div>

                {/* Court Description Section */}
                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-1">Court Description:</h3>
                  <p className="text-gray-600">{reservation.court.name}</p>
                </div>

                {/* Time Section */}
                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-1">Date & Time:</h3>
                  <p className="text-gray-600">
                    {format(new Date(reservation.startTime), 'EEEE, MMMM d, yyyy')}
                    <br />
                    {format(new Date(reservation.startTime), 'h:mm a')} -{' '}
                    {format(new Date(reservation.endTime), 'h:mm a')}
                  </p>
                </div>

                {/* Description Section */}
                {reservation.description && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-700 mb-1">Description:</h3>
                    <p className="text-gray-600 bg-gray-50 p-2 rounded">
                      {reservation.description}
                    </p>
                  </div>
                )}

                {/* Participants Section */}
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

                {/* Payment Info Section */}
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

        {filteredReservations.length === 0 && (
          <div className="text-center py-8">
            <p className="text-gray-600">
              {currentFilters.status.length > 0
                ? `No ${currentFilters.status.join(' or ')} reservations found.`
                : 'No reservations found matching your filters.'}
            </p>
          </div>
        )}
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
    </div>
  );
} 