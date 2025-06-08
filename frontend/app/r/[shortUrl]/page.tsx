'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { toast } from 'react-hot-toast';
import { formatInTimeZone } from 'date-fns-tz';

interface Props {
  params: {
    shortUrl: string;
  };
}

interface Reservation {
  id: string;
  name: string;
  description: string | null;
  startTime: string;
  endTime: string;
  paymentRequired: boolean;
  paymentInfo: string | null;
  password: string | null;
  court: {
    name: string;
    description: string;
  };
  owner: {
    name: string | null;
    email: string;
  };
}

const timeZone = 'America/Los_Angeles';

export default function SharedReservationPage({ params }: Props) {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [reservation, setReservation] = useState<Reservation | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [password, setPassword] = useState('');
  const [isGoing, setIsGoing] = useState(false);
  const [hasPaid, setHasPaid] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [passwordError, setPasswordError] = useState(false);

  useEffect(() => {
    fetchReservation();
  }, [params.shortUrl]);

  const fetchReservation = async () => {
    try {
      const response = await fetch(`/api/reservations/short/${params.shortUrl}`);
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

  const handleJoin = async () => {
    if (!session) {
      // Store the current URL in localStorage before redirecting to sign in
      localStorage.setItem('redirectAfterSignIn', window.location.pathname);
      router.push('/api/auth/signin');
      return;
    }

    if (reservation?.password && password !== reservation.password) {
      setPasswordError(true);
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/reservations/${reservation?.id}/join`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          isGoing,
          hasPaid,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to join reservation');
      }

      toast.success('Successfully joined the reservation');
      router.push(`/reservations/${reservation?.id}`);
    } catch (error) {
      toast.error('Failed to join the reservation');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading || !reservation) {
    return <div className="flex justify-center items-center min-h-screen">Loading...</div>;
  }

  return (
    <main className="min-h-screen p-8">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg shadow-sm p-6 space-y-6">
          <h1 className="text-2xl font-bold">{reservation.name}</h1>
          
          <div>
            <h2 className="text-lg font-semibold mb-2">{reservation.court.name}</h2>
            <p className="text-gray-600">{reservation.court.description}</p>
          </div>

          <div>
            <h3 className="font-medium text-gray-700">Date & Time (PT)</h3>
            <p>
              {formatInTimeZone(new Date(reservation.startTime), timeZone, 'EEEE, MMMM d, yyyy')}
              <br />
              {formatInTimeZone(new Date(reservation.startTime), timeZone, 'h:mm a')} -{' '}
              {formatInTimeZone(new Date(reservation.endTime), timeZone, 'h:mm a')}
            </p>
          </div>

          {reservation.description && (
            <div>
              <h3 className="font-medium text-gray-700">Notes:</h3>
              <p className="text-gray-600 whitespace-pre-wrap mt-2 bg-gray-50 p-3 rounded-lg">
                {reservation.description}
              </p>
            </div>
          )}

          {reservation.paymentRequired && (
            <div>
              <h3 className="font-medium text-gray-700">Payment Information</h3>
              <div className="mt-2 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                <p className="text-gray-800 whitespace-pre-wrap">{reservation.paymentInfo}</p>
              </div>
            </div>
          )}

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="font-medium text-gray-700">Going?</label>
              <button
                onClick={() => setIsGoing(!isGoing)}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  isGoing
                    ? 'bg-green-100 text-green-800 hover:bg-green-200'
                    : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                }`}
              >
                {isGoing ? 'Going' : 'Not Going'}
              </button>
            </div>

            {reservation.paymentRequired && (
              <div className="flex items-center justify-between">
                <label className="font-medium text-gray-700">Payment Status</label>
                <button
                  onClick={() => setHasPaid(!hasPaid)}
                  className={`px-4 py-2 rounded-lg transition-colors ${
                    hasPaid
                      ? 'bg-green-100 text-green-800 hover:bg-green-200'
                      : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                  }`}
                >
                  {hasPaid ? 'Paid' : 'Not Paid'}
                </button>
              </div>
            )}

            {reservation.password && (
              <div className="space-y-2">
                <label className="block font-medium text-gray-700">
                  Password Required
                </label>
                <input
                  type="text"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setPasswordError(false);
                  }}
                  placeholder="Enter reservation password"
                  className={`w-full p-3 border rounded-lg ${
                    passwordError ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {passwordError && (
                  <p className="text-red-500 text-sm">Incorrect password</p>
                )}
              </div>
            )}

            <button
              onClick={handleJoin}
              disabled={isSubmitting}
              className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 transition-colors disabled:bg-blue-300"
            >
              {isSubmitting ? 'Joining...' : 'Join Reservation'}
            </button>
          </div>
        </div>
      </div>
    </main>
  );
} 