'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession, signIn } from 'next-auth/react';
import { toast } from 'react-hot-toast';
import { formatInTimeZone } from 'date-fns-tz';
import React from 'react';
import { use } from 'react';
import { FaSpinner, FaUser, FaCheck, FaTimes } from 'react-icons/fa';

interface Reservation {
  id: string;
  name: string;
  courtName: string;
  startTime: string;
  endTime: string;
  description?: string | null;
  paymentRequired: boolean;
  paymentInfo?: string | null;
  participants: {
    name: string | null;
    email: string;
    userId: string;
    user?: {
      image?: string;
      name?: string;
    };
    isGoing: boolean;
    hasPaid: boolean;
  }[];
  owner: {
    name: string | null;
    email: string;
  };
  passwordRequired: boolean;
  passwordProtected: boolean;
}

const timeZone = 'America/Los_Angeles';

export default function ShortUrlPage({ params }: { params: Promise<{ shortUrl: string }> }) {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [reservation, setReservation] = useState<Reservation | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isJoining, setIsJoining] = useState(false);
  const [password, setPassword] = useState('');
  const [showPasswordInput, setShowPasswordInput] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<'going' | 'not-going'>('going');
  const [selectedPayment, setSelectedPayment] = useState<'paid' | 'not-paid'>('not-paid');
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [showErrorDialog, setShowErrorDialog] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const resolvedParams = React.use(params);

  useEffect(() => {
    fetchReservation();
  }, [resolvedParams.shortUrl]);

  useEffect(() => {
    // Remove auto-join on sign in
    if (session?.user?.email && reservation) {
      const isAlreadyParticipant = reservation.participants.some(
        p => p.email === session.user?.email
      );
      const isOwner = reservation.owner.email === session.user?.email;

      if (isAlreadyParticipant || isOwner) {
        router.push(`/reservations/${reservation.id}`);
      }
    }
  }, [session, reservation]);

  const fetchReservation = async () => {
    try {
      const response = await fetch(`/api/reservations/short/${resolvedParams.shortUrl}`, {
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
      toast.error('Failed to fetch reservation details');
      router.push('/');
    } finally {
      setIsLoading(false);
    }
  };

  const handleJoin = async () => {
    if (!session?.user?.email) {
      toast.error('Please sign in to join the reservation');
      return;
    }

    if (reservation?.passwordRequired && !password) {
      toast.error('Please enter the password to join');
      return;
    }

    setShowConfirmation(true);
  };

  const handleConfirmJoin = async () => {
    setIsJoining(true);
    try {
      const response = await fetch(`/api/reservations/${reservation?.id}/join`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: session?.user?.email,
          password: reservation?.passwordRequired ? password : undefined,
          isGoing: selectedStatus === 'going',
          hasPaid: selectedPayment === 'paid',
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        if (data.error === 'Invalid password') {
          setErrorMessage('Invalid password');
          setShowErrorDialog(true);
          setShowConfirmation(false);
          return;
        }
        throw new Error(data.error || 'Failed to join reservation');
      }

      const updatedReservation = await response.json();
      setReservation(updatedReservation);
      toast.success('Successfully joined the reservation!');
      setPassword('');
      setPasswordError(null);
      setShowConfirmation(false);
      router.push(`/reservations/${reservation?.id}`);
    } catch (error) {
      console.error('Error joining reservation:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to join reservation');
    } finally {
      setIsJoining(false);
    }
  };

  if (isLoading) {
    return <div className="flex justify-center items-center min-h-screen">Loading...</div>;
  }

  if (!reservation) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <h1 className="text-2xl font-bold mb-4">Reservation Not Found</h1>
        <p className="text-gray-600 mb-4">This reservation may have been deleted or the link is invalid.</p>
        <button
          onClick={() => router.push('/')}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          Go Home
        </button>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <h1 className="text-2xl font-bold mb-4">Join {reservation.name}</h1>
        <p className="text-gray-600 mb-6">Sign in to join this pickleball reservation.</p>
        <button
          onClick={() => signIn('google', { callbackUrl: `/r/${resolvedParams.shortUrl}` })}
          className="bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 flex items-center gap-2"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path
              fill="currentColor"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="currentColor"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="currentColor"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="currentColor"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
          Sign in with Google
        </button>
      </div>
    );
  }

  const isParticipant = reservation.participants.some(p => p.email === session.user?.email);

  return (
    <main className="min-h-screen p-8">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="p-6">
            <h1 className="text-2xl font-bold mb-2">{reservation.name}</h1>
            <p className="text-gray-600 mb-4">{reservation.courtName}</p>

            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-semibold mb-2">Time</h2>
                <p className="text-gray-700">
                  {formatInTimeZone(new Date(reservation.startTime), timeZone, 'EEEE, MMMM d, yyyy')}
                  <br />
                  {formatInTimeZone(new Date(reservation.startTime), timeZone, 'h:mm a')} -{' '}
                  {formatInTimeZone(new Date(reservation.endTime), timeZone, 'h:mm a')} PT
                </p>
              </div>

              {reservation.description && (
                <div>
                  <h2 className="text-lg font-semibold mb-2">Description</h2>
                  <div className="text-gray-700 prose prose-sm max-w-none bg-gray-50 p-3 rounded-lg">
                    {reservation.description.split('\n').map((line, i) => {
                      // Remove @ symbol if present and check if the line is an image URL
                      const cleanLine = line.trim().replace(/^@/, '');
                      if (cleanLine.match(/^https?:\/\/.*\.(jpg|jpeg|png|gif|webp)$/i)) {
                        return (
                          <div key={i} className="my-4">
                            <img 
                              src={cleanLine} 
                              alt="Reservation image" 
                              className="rounded-lg max-w-full h-auto"
                            />
                          </div>
                        );
                      }
                      return <p key={i}>{line}</p>;
                    })}
                  </div>
                </div>
              )}

              {reservation.paymentRequired && (
                <div>
                  <h2 className="text-lg font-semibold mb-2">Payment Information</h2>
                  <div className="bg-yellow-50 p-3 rounded-lg">
                    <p className="text-yellow-800">{reservation.paymentInfo}</p>
                  </div>
                </div>
              )}

              <div>
                <h2 className="text-lg font-semibold mb-2">Participants</h2>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-gray-700">
                    <span className="font-medium">Owner:</span>
                    <span>{reservation.owner.name || reservation.owner.email}</span>
                  </div>
                  {reservation.participants.length > 0 && (
                    <div className="grid gap-2">
                      {reservation.participants.map((participant) => (
                        <div
                          key={`${participant.userId}-${participant.email}`}
                          className="flex items-center justify-between bg-gray-50 p-2 rounded"
                        >
                          <div className="flex items-center gap-2">
                            {participant.user?.image ? (
                              <img
                                src={participant.user.image}
                                alt={participant.user.name || participant.email}
                                className="w-8 h-8 rounded-full"
                              />
                            ) : (
                              <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                                <FaUser className="w-4 h-4 text-gray-500" />
                              </div>
                            )}
                            <div>
                              <p className="font-medium">
                                {participant.user?.name || participant.email}
                              </p>
                              <p className="text-sm text-gray-500">{participant.email}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={`px-2 py-1 rounded-full text-sm ${
                              participant.isGoing
                                ? 'bg-green-100 text-green-800'
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {participant.isGoing ? 'Going' : 'Not Going'}
                            </span>
                            {reservation.paymentRequired && (
                              <span className={`px-2 py-1 rounded-full text-sm ${
                                participant.hasPaid
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-yellow-100 text-yellow-800'
                              }`}>
                                {participant.hasPaid ? 'Paid' : 'Unpaid'}
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {!isParticipant && (
                <div className="mt-6 space-y-4">
                  <div className="flex flex-col gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Are you going?</label>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setSelectedStatus('going')}
                          className={`flex-1 py-2 px-4 rounded-lg border transition-colors ${
                            selectedStatus === 'going'
                              ? 'bg-green-100 border-green-500 text-green-700'
                              : 'bg-white border-gray-300 hover:bg-gray-50'
                          }`}
                        >
                          Going
                        </button>
                        <button
                          onClick={() => setSelectedStatus('not-going')}
                          className={`flex-1 py-2 px-4 rounded-lg border transition-colors ${
                            selectedStatus === 'not-going'
                              ? 'bg-red-100 border-red-500 text-red-700'
                              : 'bg-white border-gray-300 hover:bg-gray-50'
                          }`}
                        >
                          Not Going
                        </button>
                      </div>
                    </div>

                    {reservation.paymentRequired && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Payment Status</label>
                        <div className="flex gap-2">
                          <button
                            onClick={() => setSelectedPayment('paid')}
                            className={`flex-1 py-2 px-4 rounded-lg border transition-colors ${
                              selectedPayment === 'paid'
                                ? 'bg-green-100 border-green-500 text-green-700'
                                : 'bg-white border-gray-300 hover:bg-gray-50'
                            }`}
                          >
                            Paid
                          </button>
                          <button
                            onClick={() => setSelectedPayment('not-paid')}
                            className={`flex-1 py-2 px-4 rounded-lg border transition-colors ${
                              selectedPayment === 'not-paid'
                                ? 'bg-red-100 border-red-500 text-red-700'
                                : 'bg-white border-gray-300 hover:bg-gray-50'
                            }`}
                          >
                            Not Paid
                          </button>
                        </div>
                      </div>
                    )}

                    {reservation.passwordRequired && (
                      <div>
                        <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                          Password Required
                        </label>
                        <input
                          type="password"
                          id="password"
                          value={password}
                          onChange={(e) => {
                            setPassword(e.target.value);
                            setPasswordError(null);
                          }}
                          className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Enter password to join"
                        />
                        {passwordError && (
                          <p className="mt-1 text-sm text-red-600">{passwordError}</p>
                        )}
                      </div>
                    )}
                  </div>

                  <button
                    onClick={handleJoin}
                    disabled={isJoining || (reservation?.passwordRequired && !password)}
                    className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {isJoining ? (
                      <div className="flex items-center justify-center gap-2">
                        <FaSpinner className="w-4 h-4 animate-spin" />
                        Joining...
                      </div>
                    ) : (
                      'Join Reservation'
                    )}
                  </button>
                </div>
              )}

              {showErrorDialog && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                  <div className="bg-white rounded-lg p-6 max-w-md w-full">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="flex-shrink-0">
                        <FaTimes className="w-6 h-6 text-red-500" />
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900">Error</h3>
                    </div>
                    <p className="text-gray-600 mb-6">{errorMessage}</p>
                    <div className="flex justify-end">
                      <button
                        onClick={() => {
                          setShowErrorDialog(false);
                          setErrorMessage(null);
                        }}
                        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                      >
                        Try Again
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {showConfirmation && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                  <div className="bg-white rounded-lg p-6 max-w-md w-full">
                    <h3 className="text-xl font-semibold mb-4">Confirm Your Details</h3>
                    <div className="space-y-4">
                      <div>
                        <p className="text-sm text-gray-600">Name</p>
                        <p className="font-medium">{session?.user?.name || session?.user?.email}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Attendance</p>
                        <div className="flex items-center gap-2">
                          {selectedStatus === 'going' ? (
                            <FaCheck className="text-green-500" />
                          ) : (
                            <FaTimes className="text-red-500" />
                          )}
                          <p className="font-medium">{selectedStatus === 'going' ? 'Going' : 'Not Going'}</p>
                        </div>
                      </div>
                      {reservation.paymentRequired && (
                        <div>
                          <p className="text-sm text-gray-600">Payment Status</p>
                          <div className="flex items-center gap-2">
                            {selectedPayment === 'paid' ? (
                              <FaCheck className="text-green-500" />
                            ) : (
                              <FaTimes className="text-red-500" />
                            )}
                            <p className="font-medium">{selectedPayment === 'paid' ? 'Paid' : 'Not Paid'}</p>
                          </div>
                        </div>
                      )}
                      <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                        <p className="text-sm text-blue-700">
                          You can view this event later under "My Events". Redirecting you to the event details now.
                        </p>
                      </div>
                    </div>
                    <div className="mt-6 flex gap-3">
                      <button
                        onClick={() => setShowConfirmation(false)}
                        className="flex-1 py-2 px-4 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleConfirmJoin}
                        disabled={isJoining}
                        className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        {isJoining ? (
                          <div className="flex items-center justify-center gap-2">
                            <FaSpinner className="w-4 h-4 animate-spin" />
                            Joining...
                          </div>
                        ) : (
                          'Confirm & Join'
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
} 