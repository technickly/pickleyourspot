'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { toast } from 'react-hot-toast';
import { FaSpinner, FaShare, FaEdit, FaTrash, FaCheck, FaTimes, FaUserPlus, FaUser, FaUserCheck, FaUserTimes, FaDollarSign } from 'react-icons/fa';
import { formatInTimeZone } from 'date-fns-tz';
import Link from 'next/link';
import CopyButton from '@/app/components/CopyButton';
import { use } from 'react';
import UserSearch from '@/app/components/UserSearch';

interface Message {
  id: string;
  content: string;
  createdAt: string;
  user: {
    name: string | null;
    email: string;
    image: string | null;
  };
}

interface Participant {
  id: string;
  email: string;
  isGoing: boolean;
  hasPaid: boolean;
  user: {
    name: string | null;
    email: string;
    image: string | null;
  };
}

interface Reservation {
  id: string;
  court: {
    name: string;
    address: string;
  };
  date: string;
  startTime: string;
  endTime: string;
  owner: {
    name: string | null;
    email: string;
    image: string | null;
  };
  participants: Participant[];
  messages: Message[];
  isOwner: boolean;
  paymentRequired: boolean;
  paymentAmount: number | null;
  paymentDetails: string | null;
  shortUrl: string;
}

const timeZone = 'America/Los_Angeles';

const formatDate = (dateTime: string, format: string) => {
  try {
    // Ensure we have a valid date string
    if (!dateTime) {
      console.log('Missing date:', dateTime);
      return 'Date not available';
    }
    
    // Create a date object from the ISO string
    const date = new Date(dateTime);
    
    // Check if the date is valid
    if (isNaN(date.getTime())) {
      console.error('Invalid date:', dateTime);
      return 'Invalid date';
    }
    
    return formatInTimeZone(date, timeZone, format);
  } catch (error) {
    console.error('Error formatting date:', error);
    return 'Date formatting error';
  }
};

export default function ReservationPage({ params }: { params: Promise<{ reservationId: string }> }) {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [reservation, setReservation] = useState<Reservation | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [newMessage, setNewMessage] = useState('');
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);
  const { reservationId } = use(params);
  const [showAddParticipant, setShowAddParticipant] = useState(false);
  const [selectedParticipants, setSelectedParticipants] = useState<{ email: string; name: string | null }[]>([]);
  const [isAddingParticipants, setIsAddingParticipants] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (!session && status !== 'loading') {
      router.push('/');
      return;
    }

    const fetchReservation = async () => {
      if (!session?.user?.email) return;

      try {
        const response = await fetch(`/api/reservations/${reservationId}`);
        if (!response.ok) {
          throw new Error('Failed to fetch reservation');
        }
        const data = await response.json();
        console.log('Fetched reservation data:', data); // Debug log
        setReservation(data);
      } catch (error) {
        console.error('Error fetching reservation:', error);
        setError('Failed to load reservation');
      } finally {
        setIsLoading(false);
      }
    };

    fetchReservation();
  }, [reservationId, session?.user?.email]);

  const isParticipant = () => {
    if (!session?.user?.email || !reservation) return false;
    return reservation.participants.some(p => p.email === session.user.email);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session?.user?.email || !newMessage.trim() || isSendingMessage) return;

    setIsSendingMessage(true);
    try {
      const response = await fetch(`/api/reservations/${reservationId}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: newMessage.trim(),
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      const updatedReservation = await response.json();
      setReservation(updatedReservation);
      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
    } finally {
      setIsSendingMessage(false);
    }
  };

  const handleStatusUpdate = async (reservationId: string, type: 'isGoing' | 'hasPaid', value: boolean) => {
    if (!session?.user?.email) return;

    try {
      const response = await fetch(`/api/reservations/${reservationId}/participants/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: session.user.email,
          [type]: value,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update status');
      }

      const updatedReservation = await response.json();
      setReservation(updatedReservation);
      toast.success('Status updated successfully');
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Failed to update status');
    } finally {
      setUpdatingStatus(prev => ({ ...prev, [reservationId]: false }));
    }
  };

  const handleAddParticipants = async () => {
    if (selectedParticipants.length === 0) return;

    setIsAddingParticipants(true);
    try {
      const response = await fetch(`/api/reservations/${reservationId}/participants`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          participants: selectedParticipants.map(p => p.email),
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to add participants');
      }

      const updatedReservation = await response.json();
      setReservation(updatedReservation);
      setShowAddParticipant(false);
      setSelectedParticipants([]);
      toast.success('Participants added successfully');
    } catch (error) {
      console.error('Error adding participants:', error);
      toast.error('Failed to add participants');
    } finally {
      setIsAddingParticipants(false);
    }
  };

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
          <div className="flex justify-between items-start mb-6">
            <h1 className="text-2xl font-bold text-gray-900">{reservation.court.name}</h1>
            <div className="flex items-center gap-2">
              <CopyButton
                text={`${window.location.origin}/r/${reservation.shortUrl}`}
                label={
                  <span className="flex items-center gap-1 bg-gray-600 text-white px-3 py-1.5 rounded text-sm hover:bg-gray-700 transition-colors">
                    <FaShare className="w-3 h-3" />
                    Share
                  </span>
                }
                className="hover:bg-gray-700"
              />
              {reservation.isOwner && (
                <Link
                  href={`/reservations/${reservation.id}/modify`}
                  className="flex items-center gap-1 bg-blue-600 text-white px-3 py-1.5 rounded text-sm hover:bg-blue-700 transition-colors"
                  onClick={() => setIsNavigating(true)}
                >
                  {isNavigating ? (
                    <FaSpinner className="w-3 h-3 animate-spin" />
                  ) : (
                    <FaEdit className="w-3 h-3" />
                  )}
                  Modify
                </Link>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium text-gray-500 mb-1">Date & Time</p>
                <p className="text-gray-900">
                  {formatDate(reservation.startTime, 'EEEE, MMMM d, yyyy')}
                </p>
                <p className="text-gray-900">
                  {formatDate(reservation.startTime, 'h:mm a')} - {formatDate(reservation.endTime, 'h:mm a')}
                </p>
              </div>

              <div>
                <p className="text-sm font-medium text-gray-500 mb-1">Location</p>
                <p className="text-gray-900">{reservation.court.name}</p>
                <p className="text-gray-600">{reservation.court.address}</p>
              </div>

              <div>
                <p className="text-sm font-medium text-gray-500 mb-1">Organizer</p>
                <div className="flex items-center gap-2">
                  {reservation.owner.image ? (
                    <img
                      src={reservation.owner.image}
                      alt={reservation.owner.name || reservation.owner.email}
                      className="w-6 h-6 rounded-full"
                    />
                  ) : (
                    <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center">
                      <FaUser className="w-3 h-3 text-gray-500" />
                    </div>
                  )}
                  <p className="text-gray-900">
                    {reservation.owner.name || reservation.owner.email}
                  </p>
                </div>
              </div>

              {reservation.paymentDetails && (
                <div>
                  <p className="text-sm font-medium text-gray-500 mb-1">Payment Information</p>
                  <p className="text-gray-700">{reservation.paymentDetails}</p>
                </div>
              )}
            </div>

            <div>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">Participants</h2>
                {reservation.isOwner && (
                  <button
                    onClick={() => setShowAddParticipant(true)}
                    className="flex items-center gap-1 bg-blue-600 text-white px-3 py-1.5 rounded text-sm hover:bg-blue-700 transition-colors"
                  >
                    <FaUserPlus className="w-3 h-3" />
                    Add Participants
                  </button>
                )}
              </div>
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-gray-500 mb-2">Participants</p>
                  <div className="space-y-4">
                    <div>
                      <h4 className="text-sm font-medium text-green-700 mb-2">Going ({reservation.participants.filter(p => p.isGoing).length})</h4>
                      <div className="space-y-2">
                        {reservation.participants
                          .filter(p => p.isGoing)
                          .map((participant) => (
                            <div key={participant.id} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  {participant.user?.image && (
                                    <img 
                                      src={participant.user.image} 
                                      alt={participant.user.name || ''} 
                                      className="w-6 h-6 rounded-full"
                                    />
                                  )}
                                  <div>
                                    <p className="text-sm font-medium text-gray-900">
                                      {participant.user?.name || 'Anonymous'}
                                    </p>
                                    <p className="text-xs text-gray-500">
                                      {participant.user?.email}
                                    </p>
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className={`px-2 py-0.5 text-xs rounded-full ${
                                  participant.hasPaid 
                                    ? 'bg-green-100 text-green-800' 
                                    : 'bg-yellow-100 text-yellow-800'
                                }`}>
                                  {participant.hasPaid ? (
                                    <span className="flex items-center gap-1">
                                      <FaCheck className="w-3 h-3" />
                                      Paid
                                    </span>
                                  ) : (
                                    <span className="flex items-center gap-1">
                                      <FaTimes className="w-3 h-3" />
                                      Unpaid
                                    </span>
                                  )}
                                </span>
                                {session?.user?.email === participant.user?.email && (
                                  <div className="flex gap-2">
                                    <button
                                      className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-medium border ${
                                        participant.isGoing
                                          ? 'bg-green-500 text-white border-green-600'
                                          : 'bg-gray-200 text-gray-700 border-gray-300'
                                      } hover:shadow transition`}
                                      disabled={updatingStatus[reservation.id]}
                                      onClick={() => handleStatusUpdate(reservation.id, 'isGoing', !participant.isGoing)}
                                    >
                                      {participant.isGoing ? <FaUserCheck className="w-3 h-3" /> : <FaUserTimes className="w-3 h-3" />}
                                      {participant.isGoing ? 'Going' : 'Not Going'}
                                    </button>
                                    {reservation.paymentRequired && (
                                      <button
                                        className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-medium border ${
                                          participant.hasPaid
                                            ? 'bg-green-500 text-white border-green-600'
                                            : 'bg-yellow-200 text-yellow-800 border-yellow-400'
                                        } hover:shadow transition`}
                                        disabled={updatingStatus[reservation.id]}
                                        onClick={() => handleStatusUpdate(reservation.id, 'hasPaid', !participant.hasPaid)}
                                      >
                                        <FaDollarSign className="w-3 h-3" />
                                        {participant.hasPaid ? 'Paid' : 'Unpaid'}
                                      </button>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                      </div>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-gray-600 mb-2">Not Going ({reservation.participants.filter(p => !p.isGoing).length})</h4>
                      <div className="space-y-2">
                        {reservation.participants
                          .filter(p => !p.isGoing)
                          .map((participant) => (
                            <div key={participant.id} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  {participant.user?.image && (
                                    <img 
                                      src={participant.user.image} 
                                      alt={participant.user.name || ''} 
                                      className="w-6 h-6 rounded-full"
                                    />
                                  )}
                                  <div>
                                    <p className="text-sm font-medium text-gray-900">
                                      {participant.user?.name || 'Anonymous'}
                                    </p>
                                    <p className="text-xs text-gray-500">
                                      {participant.user?.email}
                                    </p>
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className={`px-2 py-0.5 text-xs rounded-full ${
                                  participant.hasPaid 
                                    ? 'bg-green-100 text-green-800' 
                                    : 'bg-yellow-100 text-yellow-800'
                                }`}>
                                  {participant.hasPaid ? (
                                    <span className="flex items-center gap-1">
                                      <FaCheck className="w-3 h-3" />
                                      Paid
                                    </span>
                                  ) : (
                                    <span className="flex items-center gap-1">
                                      <FaTimes className="w-3 h-3" />
                                      Unpaid
                                    </span>
                                  )}
                                </span>
                                {session?.user?.email === participant.user?.email && (
                                  <div className="flex gap-2">
                                    <button
                                      className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-medium border ${
                                        participant.isGoing
                                          ? 'bg-green-500 text-white border-green-600'
                                          : 'bg-gray-200 text-gray-700 border-gray-300'
                                      } hover:shadow transition`}
                                      disabled={updatingStatus[reservation.id]}
                                      onClick={() => handleStatusUpdate(reservation.id, 'isGoing', !participant.isGoing)}
                                    >
                                      {participant.isGoing ? <FaUserCheck className="w-3 h-3" /> : <FaUserTimes className="w-3 h-3" />}
                                      {participant.isGoing ? 'Going' : 'Not Going'}
                                    </button>
                                    {reservation.paymentRequired && (
                                      <button
                                        className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-medium border ${
                                          participant.hasPaid
                                            ? 'bg-green-500 text-white border-green-600'
                                            : 'bg-yellow-200 text-yellow-800 border-yellow-400'
                                        } hover:shadow transition`}
                                        disabled={updatingStatus[reservation.id]}
                                        onClick={() => handleStatusUpdate(reservation.id, 'hasPaid', !participant.hasPaid)}
                                      >
                                        <FaDollarSign className="w-3 h-3" />
                                        {participant.hasPaid ? 'Paid' : 'Unpaid'}
                                      </button>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Messages Section */}
          {isParticipant() && (
            <div className="mt-8">
              <h2 className="text-xl font-semibold mb-4">Messages</h2>
              <div className="space-y-4 mb-4">
                {reservation.messages && reservation.messages.length > 0 ? (
                  reservation.messages.map((message) => (
                    <div key={message.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                      {message.user?.image ? (
                        <img
                          src={message.user.image}
                          alt={message.user.name || message.user.email}
                          className="w-8 h-8 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                          <FaUser className="w-4 h-4 text-gray-500" />
                        </div>
                      )}
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-medium">{message.user?.name || message.user?.email}</p>
                          <p className="text-sm text-gray-500">
                            {formatInTimeZone(new Date(message.createdAt), timeZone, 'MMM d, h:mm a')}
                          </p>
                        </div>
                        <p className="text-gray-700">{message.content}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 text-center py-4">No messages yet. Start the conversation!</p>
                )}
              </div>

              <form onSubmit={handleSendMessage} className="flex gap-2">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type a message..."
                  className="flex-1 p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  type="submit"
                  disabled={isSendingMessage || !newMessage.trim()}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSendingMessage ? (
                    <FaSpinner className="w-4 h-4 animate-spin" />
                  ) : (
                    'Send'
                  )}
                </button>
              </form>
            </div>
          )}

          {/* Add Participant Dialog */}
          {showAddParticipant && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
              <div className="bg-white rounded-lg p-6 max-w-md w-full">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold">Add Participants</h3>
                  <button
                    onClick={() => {
                      setShowAddParticipant(false);
                      setSelectedParticipants([]);
                    }}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <FaTimes className="w-5 h-5" />
                  </button>
                </div>
                <div className="mb-4">
                  <UserSearch
                    onSelect={(user) => {
                      if (!selectedParticipants.some(p => p.email === user.email)) {
                        setSelectedParticipants([...selectedParticipants, user]);
                      }
                    }}
                  />
                </div>
                {selectedParticipants.length > 0 && (
                  <div className="mb-4">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Selected Participants</h4>
                    <div className="space-y-2">
                      {selectedParticipants.map((participant) => (
                        <div key={participant.email} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                          <span>{participant.name || participant.email}</span>
                          <button
                            onClick={() => setSelectedParticipants(selectedParticipants.filter(p => p.email !== participant.email))}
                            className="text-red-500 hover:text-red-700"
                          >
                            <FaTimes className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                <div className="flex justify-end gap-4">
                  <button
                    onClick={() => {
                      setShowAddParticipant(false);
                      setSelectedParticipants([]);
                    }}
                    className="px-4 py-2 text-gray-600 hover:text-gray-800"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleAddParticipants}
                    disabled={isAddingParticipants || selectedParticipants.length === 0}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-300"
                  >
                    {isAddingParticipants ? 'Adding...' : 'Add Participants'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
} 