'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { toast } from 'react-hot-toast';
import { FaSpinner } from 'react-icons/fa';

interface Participant {
  id: string;
  email: string;
  isGoing: boolean;
  hasPaid: boolean;
  user?: {
    name: string;
    email: string;
    image: string;
  };
}

interface Reservation {
  id: string;
  name: string;
  courtName: string;
  startTime: string;
  endTime: string;
  description?: string;
  paymentRequired: boolean;
  paymentInfo?: string;
  isOwner: boolean;
  participants: Participant[];
}

export default function ReservationPage({ params }: { params: { reservationId: string } }) {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [reservation, setReservation] = useState<Reservation | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!session && status !== 'loading') {
      router.push('/');
      return;
    }

    const fetchReservation = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(`/api/reservations/${params.reservationId}`, {
          headers: {
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache'
          }
        });

        if (!response.ok) {
          throw new Error('Failed to fetch reservation');
        }

        const data = await response.json();
        setReservation(data);
      } catch (error) {
        console.error('Error fetching reservation:', error);
        toast.error('Failed to load reservation');
      } finally {
        setIsLoading(false);
      }
    };

    if (session?.user?.email) {
      fetchReservation();
    }
  }, [session, status, router, params.reservationId]);

  if (status === 'loading' || isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="flex flex-col items-center gap-4">
          <FaSpinner className="w-8 h-8 animate-spin text-blue-600" />
          <p className="text-gray-600">Loading reservation...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <p className="text-xl mb-4">Please sign in to view reservations</p>
        <button
          onClick={() => router.push('/')}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          Go to Home
        </button>
      </div>
    );
  }

  if (!reservation) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <p className="text-xl mb-4">Reservation not found</p>
        <button
          onClick={() => router.push('/my-reservations')}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          Back to My Events
        </button>
      </div>
    );
  }

  return (
    <main className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">{reservation.name}</h1>
          
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4">Participants</h2>
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium text-green-700 mb-2">
                  Going ({reservation.participants.filter(p => p.isGoing).length})
                </h3>
                <div className="space-y-2">
                  {reservation.participants
                    .filter(p => p.isGoing)
                    .map((participant) => (
                      <div key={participant.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          {participant.user?.image && (
                            <img
                              src={participant.user.image}
                              alt={participant.user.name || participant.email}
                              className="w-8 h-8 rounded-full"
                            />
                          )}
                          <div>
                            <p className="font-medium">
                              {participant.user?.name || participant.email}
                            </p>
                            <p className="text-sm text-gray-500">{participant.email}</p>
                          </div>
                        </div>
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          participant.hasPaid 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {participant.hasPaid ? 'Paid' : 'Unpaid'}
                        </span>
                      </div>
                    ))}
                </div>
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-600 mb-2">
                  Not Going ({reservation.participants.filter(p => !p.isGoing).length})
                </h3>
                <div className="space-y-2">
                  {reservation.participants
                    .filter(p => !p.isGoing)
                    .map((participant) => (
                      <div key={participant.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          {participant.user?.image && (
                            <img
                              src={participant.user.image}
                              alt={participant.user.name || participant.email}
                              className="w-8 h-8 rounded-full"
                            />
                          )}
                          <div>
                            <p className="font-medium">
                              {participant.user?.name || participant.email}
                            </p>
                            <p className="text-sm text-gray-500">{participant.email}</p>
                          </div>
                        </div>
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          participant.hasPaid 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {participant.hasPaid ? 'Paid' : 'Unpaid'}
                        </span>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
} 