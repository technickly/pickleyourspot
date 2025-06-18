'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession, signIn } from 'next-auth/react';
import { toast } from 'react-hot-toast';
import { FaSpinner, FaShare, FaEdit, FaTrash, FaCheck, FaTimes, FaUserPlus, FaUser, FaUserCheck, FaUserTimes, FaDollarSign } from 'react-icons/fa';
import { formatInTimeZone, parse } from 'date-fns-tz';
import Link from 'next/link';
import CopyButton from '@/app/components/CopyButton';
import { use } from 'react';
import UserSearch from '@/app/components/UserSearch';
import StatusUpdateDialog from '../../components/StatusUpdateDialog';
import { format } from 'date-fns';
import { Calendar, Clock, MapPin, Users, DollarSign, Share2, Copy, Check, X } from 'lucide-react';

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

interface User {
  id: string;
  name: string | null;
  email: string;
  image: string | null;
}

interface Participant {
  id: string;
  isGoing: boolean;
  hasPaid: boolean;
  user: User;
}

interface Court {
  id: string;
  name: string;
  address: string;
}

interface Reservation {
  id: string;
  name: string;
  startTime: string;
  endTime: string;
  court: Court;
  participants: Participant[];
  paymentRequired: boolean;
  isOwner: boolean;
  description: string | null;
  shortUrl: string;
}

interface PageProps {
  params: Promise<{ reservationId: string }>;
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

export default function ReservationPage({ params }: PageProps) {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [reservation, setReservation] = useState<Reservation | null>(null);
  const [loading, setLoading] = useState(true);
  const [newMessage, setNewMessage] = useState('');
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);
  const { reservationId } = use(params);
  const [showAddParticipant, setShowAddParticipant] = useState(false);
  const [selectedParticipants, setSelectedParticipants] = useState<{ email: string; name: string | null }[]>([]);
  const [isAddingParticipants, setIsAddingParticipants] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isUpdateDialogOpen, setIsUpdateDialogOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [showStatusDialog, setShowStatusDialog] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<{ isGoing: boolean; hasPaid: boolean } | null>(null);
  const [showAddParticipantDialog, setShowAddParticipantDialog] = useState(false);

  useEffect(() => {
    const fetchReservation = async () => {
      try {
        const response = await fetch(`/api/reservations/${reservationId}`);
        if (!response.ok) {
          throw new Error('Failed to fetch reservation');
        }
        const data = await response.json();
        console.log('Reservation data:', {
          date: data.date,
          startTime: data.startTime,
          endTime: data.endTime
        });
        setReservation(data);
      } catch (error) {
        console.error('Error fetching reservation:', error);
        toast.error('Failed to load reservation');
      } finally {
        setLoading(false);
      }
    };

    if (reservationId) {
      fetchReservation();
    }
  }, [reservationId]);

  const isParticipant = () => {
    if (!session?.user?.email || !reservation) return false;
    return reservation.participants.some(p => p.user?.email === session.user.email);
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

  const handleStatusUpdate = async (isGoing: boolean, hasPaid: boolean) => {
    if (!session?.user?.email || !reservation) return;

    try {
      setIsUpdating(true);
      // Find the current user's participant ID
      const currentParticipant = reservation.participants.find(
        p => p.user?.email === session.user?.email
      );

      if (!currentParticipant) {
        console.error('Current participant not found:', {
          userEmail: session.user.email,
          participants: reservation.participants
        });
        throw new Error('Participant not found');
      }

      console.log('Updating status for participant:', {
        reservationId,
        participantId: currentParticipant.user.id,
        isGoing,
        hasPaid
      });

      // First update isGoing status
      const goingResponse = await fetch(
        `/api/reservations/${reservationId}/participants/${currentParticipant.user.id}/status`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            type: 'isGoing',
            value: isGoing
          }),
        }
      );

      if (!goingResponse.ok) {
        const errorData = await goingResponse.text();
        console.error('Failed to update going status:', {
          status: goingResponse.status,
          statusText: goingResponse.statusText,
          error: errorData
        });
        throw new Error(`Failed to update going status: ${goingResponse.statusText}`);
      }

      // Then update hasPaid status if payment is required
      if (reservation.paymentRequired) {
        const paidResponse = await fetch(
          `/api/reservations/${reservationId}/participants/${currentParticipant.user.id}/status`,
          {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              type: 'hasPaid',
              value: hasPaid
            }),
          }
        );

        if (!paidResponse.ok) {
          const errorData = await paidResponse.text();
          console.error('Failed to update payment status:', {
            status: paidResponse.status,
            statusText: paidResponse.statusText,
            error: errorData
          });
          throw new Error(`Failed to update payment status: ${paidResponse.statusText}`);
        }
      }

      // Get the updated reservation
      const updatedResponse = await fetch(`/api/reservations/${reservationId}`);
      if (!updatedResponse.ok) {
        throw new Error('Failed to fetch updated reservation');
      }

      const updatedReservation = await updatedResponse.json();
      setReservation(updatedReservation);
      toast.success('Status updated successfully');
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to update status');
    } finally {
      setIsUpdating(false);
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

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(
        `${window.location.origin}/reservations/${reservationId}`
      );
      setIsCopied(true);
      toast.success('Link copied to clipboard!');
      setTimeout(() => setIsCopied(false), 2000);
    } catch (error) {
      console.error('Error copying to clipboard:', error);
      toast.error('Failed to copy link');
    }
  };

  const handleAddParticipant = async (userId: string) => {
    try {
      const response = await fetch(`/api/reservations/${reservationId}/participants`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId }),
      });

      if (!response.ok) {
        throw new Error('Failed to add participant');
      }

      const updatedReservation = await response.json();
      setReservation(updatedReservation);
      toast.success('Participant added successfully');
    } catch (error) {
      console.error('Error adding participant:', error);
      toast.error('Failed to add participant');
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <FaSpinner className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading reservation...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Please sign in to view this reservation</h1>
          <button
            onClick={() => signIn()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Sign In
          </button>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Error</h1>
          <p className="text-gray-600 mb-4">{error}</p>
          <Link
            href="/reservations"
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Back to Reservations
          </Link>
        </div>
      </div>
    );
  }

  if (!reservation) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Reservation not found</h1>
          <Link
            href="/reservations"
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Back to Reservations
          </Link>
        </div>
      </div>
    );
  }

  return (
    <main className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex justify-between items-start mb-6">
            <h1 className="text-2xl font-bold text-gray-900">
              {reservation.court?.name || 'Unknown Court'}
            </h1>
            <div className="flex items-center gap-2">
              <CopyButton
                text={`${window.location.origin}/r/${reservation.shortUrl}`}
                label={
                  <span className="flex items-center gap-1 bg-gray-600 text-white px-3 py-1.5 rounded text-sm hover:bg-gray-700 transition-colors">
                    {isCopied ? (
                      <>
                        <Check className="h-4 w-4" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Share2 className="h-4 w-4" />
                        Share
                      </>
                    )}
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
                <p className="text-sm font-medium text-gray-500 mb-1">Location</p>
                <p className="text-gray-900">{reservation.court?.name || 'Unknown Court'}</p>
                <p className="text-gray-600">{reservation.court?.address || 'No address available'}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500 mb-1">Date & Time</p>
                <p className="text-gray-900">
                  {reservation.date}
                </p>
                <p className="text-gray-600">
                  {reservation.startTime} - {reservation.endTime}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500 mb-1">Organizer</p>
                <p className="text-gray-900">{reservation.owner?.name || 'Unknown Organizer'}</p>
                <p className="text-gray-600">{reservation.owner?.email || 'No email available'}</p>
              </div>
              {reservation.description && (
                <div>
                  <p className="text-sm font-medium text-gray-500 mb-1">Description</p>
                  <p className="text-gray-900">{reservation.description}</p>
                </div>
              )}
              {reservation.paymentRequired && (
                <div>
                  <p className="text-sm font-medium text-gray-500 mb-1">Payment Information</p>
                  <p className="text-gray-900">{reservation.paymentInfo || 'No payment information available'}</p>
                </div>
              )}
            </div>

            <div>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">Participants</h2>
                {reservation.isOwner && (
                  <button
                    onClick={() => setShowAddParticipantDialog(true)}
                    className="flex items-center gap-2 px-3 py-1.5 text-sm rounded-full bg-blue-100 text-blue-700 hover:bg-blue-200 transition-colors"
                  >
                    <FaUserPlus className="w-4 h-4" />
                    Add Participants
                  </button>
                )}
              </div>
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium text-green-700 mb-2">
                    Going ({reservation.participants?.filter(p => p.isGoing).length || 0})
                  </h3>
                  <div className="space-y-2">
                    {reservation.participants?.filter(p => p.isGoing).map((participant) => (
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
                            <button
                              onClick={() => {
                                setSelectedStatus({
                                  isGoing: participant.isGoing,
                                  hasPaid: participant.hasPaid
                                });
                                setShowStatusDialog(true);
                              }}
                              className="px-3 py-1 text-sm font-medium text-blue-600 hover:text-blue-700"
                            >
                              Update
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-gray-600 mb-2">
                    Not Going ({reservation.participants?.filter(p => !p.isGoing).length || 0})
                  </h3>
                  <div className="space-y-2">
                    {reservation.participants?.filter(p => !p.isGoing).map((participant) => (
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
                            <button
                              onClick={() => {
                                setSelectedStatus({
                                  isGoing: participant.isGoing,
                                  hasPaid: participant.hasPaid
                                });
                                setShowStatusDialog(true);
                              }}
                              className="px-3 py-1 text-sm font-medium text-blue-600 hover:text-blue-700"
                            >
                              Update
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Add Participant Button */}
                {reservation.isOwner && (
                  <button
                    onClick={() => setIsAddingParticipants(true)}
                    className="flex items-center gap-2 px-3 py-1.5 text-sm rounded-full bg-blue-100 text-blue-700 hover:bg-blue-200 transition-colors"
                  >
                    <FaUserPlus className="w-4 h-4" />
                    Add Participants
                  </button>
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
        </div>
      </div>

      {/* Status Update Dialog */}
      {showStatusDialog && selectedStatus && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl p-6 max-w-md w-full">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Update Your Status</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Are you going?
                </label>
                <div className="flex gap-2">
                  <button
                    onClick={() => setSelectedStatus({ ...selectedStatus, isGoing: true })}
                    className={`flex-1 px-4 py-2 text-sm font-medium rounded-lg ${
                      selectedStatus.isGoing
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Yes
                  </button>
                  <button
                    onClick={() => setSelectedStatus({ ...selectedStatus, isGoing: false })}
                    className={`flex-1 px-4 py-2 text-sm font-medium rounded-lg ${
                      !selectedStatus.isGoing
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    No
                  </button>
                </div>
              </div>
              {reservation.paymentRequired && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Have you paid?
                  </label>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setSelectedStatus({ ...selectedStatus, hasPaid: true })}
                      className={`flex-1 px-4 py-2 text-sm font-medium rounded-lg ${
                        selectedStatus.hasPaid
                          ? 'bg-blue-500 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      Yes
                    </button>
                    <button
                      onClick={() => setSelectedStatus({ ...selectedStatus, hasPaid: false })}
                      className={`flex-1 px-4 py-2 text-sm font-medium rounded-lg ${
                        !selectedStatus.hasPaid
                          ? 'bg-blue-500 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      No
                    </button>
                  </div>
                </div>
              )}
              <div className="flex gap-2 mt-6">
                <button
                  onClick={() => {
                    handleStatusUpdate(selectedStatus.isGoing, selectedStatus.hasPaid);
                    setShowStatusDialog(false);
                  }}
                  disabled={isUpdating}
                  className="flex-1 px-4 py-2 text-sm font-medium text-white bg-blue-500 rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isUpdating ? 'Updating...' : 'Save Changes'}
                </button>
                <button
                  onClick={() => setShowStatusDialog(false)}
                  className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
} 