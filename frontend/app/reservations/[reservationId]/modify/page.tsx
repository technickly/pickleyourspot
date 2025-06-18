'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { toast } from 'react-hot-toast';
import { formatInTimeZone } from 'date-fns-tz';
import React from 'react';
import UserSearch from '@/app/components/UserSearch';
import { FaCheck, FaTimes, FaDollarSign, FaUser } from 'react-icons/fa';

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

export default function ModifyReservationPage({ params }: { params: Promise<{ reservationId: string }> }) {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [reservation, setReservation] = useState<Reservation | null>(null);
  const [description, setDescription] = useState('');
  const [paymentInfo, setPaymentInfo] = useState('');
  const [name, setName] = useState('');
  const [participants, setParticipants] = useState<Participant[]>([]);
  const resolvedParams = React.use(params);

  useEffect(() => {
    if (status === 'loading') return;
    if (!session?.user?.email) {
      router.push('/');
      return;
    }
    fetchReservation();
  }, [session, status, router, resolvedParams.reservationId]);

  const fetchReservation = async () => {
    try {
      const response = await fetch(`/api/reservations/${resolvedParams.reservationId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch reservation');
      }
      const data = await response.json();
      setReservation(data);
      setDescription(data.description || '');
      setPaymentInfo(data.paymentInfo || '');
      setName(data.name || '');
      setParticipants(data.participants || []);
    } catch (error) {
      console.error('Error fetching reservation:', error);
      toast.error('Failed to fetch reservation details');
      router.push('/my-reservations');
    } finally {
      setIsLoading(false);
    }
  };

  const handleStatusUpdate = async (
    participantId: string,
    type: 'payment' | 'attendance',
    newValue: boolean
  ) => {
    try {
      const response = await fetch(`/api/reservations/${resolvedParams.reservationId}/participant-status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: participantId,
          type,
          value: newValue,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update status');
      }

      // Update local state
      setParticipants(prev => prev.map(p => 
        p.id === participantId 
          ? { ...p, [type === 'payment' ? 'hasPaid' : 'isGoing']: newValue }
          : p
      ));

      toast.success(`${type === 'payment' ? 'Payment' : 'Attendance'} status updated`);
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error(`Failed to update ${type} status`);
    }
  };

  const handleSave = async () => {
    if (!reservation) return;

    if (!name.trim()) {
      toast.error('Please provide a name for the reservation');
      return;
    }

    setIsSaving(true);
    try {
      const response = await fetch(`/api/reservations/${resolvedParams.reservationId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: name.trim(),
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
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">Modify Reservation</h1>

          <div className="space-y-6">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                Reservation Name
              </label>
              <input
                type="text"
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter reservation name"
              />
            </div>

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

            {/* Participant Management Section */}
            <div className="border-t pt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Manage Participants</h3>
              
              {participants.length === 0 ? (
                <p className="text-gray-500 text-center py-4">No participants yet</p>
              ) : (
                <div className="space-y-3">
                  {participants.map((participant) => (
                    <div key={participant.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                          <FaUser className="text-blue-600 text-sm" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">
                            {participant.user?.name || participant.email}
                          </p>
                          <p className="text-sm text-gray-500">{participant.email}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-4">
                        {/* Attendance Status */}
                        <div className="flex items-center space-x-2">
                          <span className="text-sm text-gray-600">Going:</span>
                          <button
                            onClick={() => handleStatusUpdate(participant.id, 'attendance', !participant.isGoing)}
                            className={`p-2 rounded-full transition-colors ${
                              participant.isGoing 
                                ? 'bg-green-100 text-green-600 hover:bg-green-200' 
                                : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                            }`}
                            title={participant.isGoing ? 'Mark as not going' : 'Mark as going'}
                          >
                            {participant.isGoing ? <FaCheck className="w-4 h-4" /> : <FaTimes className="w-4 h-4" />}
                          </button>
                        </div>

                        {/* Payment Status */}
                        {reservation.paymentRequired && (
                          <div className="flex items-center space-x-2">
                            <span className="text-sm text-gray-600">Paid:</span>
                            <button
                              onClick={() => handleStatusUpdate(participant.id, 'payment', !participant.hasPaid)}
                              className={`p-2 rounded-full transition-colors ${
                                participant.hasPaid 
                                  ? 'bg-green-100 text-green-600 hover:bg-green-200' 
                                  : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                              }`}
                              title={participant.hasPaid ? 'Mark as unpaid' : 'Mark as paid'}
                            >
                              <FaDollarSign className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

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