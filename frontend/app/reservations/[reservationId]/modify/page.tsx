'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { toast } from 'react-hot-toast';
import { formatInTimeZone } from 'date-fns-tz';
import UserSearch from '@/app/components/UserSearch';

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
  description?: string | null;
  paymentRequired: boolean;
  paymentInfo?: string | null;
  participants: Participant[];
  isOwner: boolean;
}

const timeZone = 'America/Los_Angeles';

export default function ModifyReservationPage({ params }: { params: { reservationId: string } }) {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [reservation, setReservation] = useState<Reservation | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [description, setDescription] = useState('');
  const [paymentInfo, setPaymentInfo] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (session?.user?.email) {
      fetchReservation();
    }
  }, [session]);

  const fetchReservation = async () => {
    try {
      const response = await fetch(`/api/reservations/${params.reservationId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch reservation');
      }
      const data = await response.json();
      setReservation(data);
      setDescription(data.description || '');
      setPaymentInfo(data.paymentInfo || '');
    } catch (error) {
      toast.error('Failed to load reservation details');
      router.push('/my-reservations');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!reservation) return;

    setIsSaving(true);
    try {
      const response = await fetch(`/api/reservations/${params.reservationId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          description,
          paymentInfo,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update reservation');
      }

      toast.success('Reservation updated successfully');
      router.push('/my-reservations');
    } catch (error) {
      toast.error('Failed to update reservation');
    } finally {
      setIsSaving(false);
    }
  };

  if (status === 'loading' || isLoading) {
    return <div className="flex justify-center items-center min-h-screen">Loading...</div>;
  }

  if (!session) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <p className="text-xl mb-4">Please sign in to modify reservations</p>
        <button
          onClick={() => router.push('/')}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          Go to Home
        </button>
      </div>
    );
  }

  if (!reservation || !reservation.isOwner) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <p className="text-xl mb-4">You don't have permission to modify this reservation</p>
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
    <div className="min-h-screen p-8 bg-gray-50">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">Modify Reservation</h1>

          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-semibold mb-2">{reservation.name}</h2>
              <p className="text-gray-600">{reservation.courtName}</p>
              <p className="text-gray-600 mt-1">
                {formatInTimeZone(new Date(reservation.startTime), timeZone, 'EEEE, MMMM d, yyyy')}
                <br />
                {formatInTimeZone(new Date(reservation.startTime), timeZone, 'h:mm a')} -{' '}
                {formatInTimeZone(new Date(reservation.endTime), timeZone, 'h:mm a')} PT
              </p>
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={4}
                placeholder="Add a description for your event..."
              />
            </div>

            {reservation.paymentRequired && (
              <div>
                <label htmlFor="paymentInfo" className="block text-sm font-medium text-gray-700 mb-1">
                  Payment Information
                </label>
                <textarea
                  id="paymentInfo"
                  value={paymentInfo}
                  onChange={(e) => setPaymentInfo(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  placeholder="Add payment details..."
                />
              </div>
            )}

            <div className="flex justify-end gap-4 pt-4">
              <button
                onClick={() => {
                  window.dispatchEvent(new Event('beforeunload'));
                  router.push('/my-reservations');
                }}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  window.dispatchEvent(new Event('beforeunload'));
                  handleSave();
                }}
                disabled={isSaving}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-300"
              >
                {isSaving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 