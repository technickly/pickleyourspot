'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession, signIn } from 'next-auth/react';
import { toast } from 'react-hot-toast';
import { FaSpinner, FaShare, FaEdit, FaTrash, FaCheck, FaTimes, FaUserPlus, FaUser, FaUserCheck, FaUserTimes, FaDollarSign } from 'react-icons/fa';
import { formatInTimeZone } from 'date-fns-tz';
import { parseISO } from 'date-fns';
import Link from 'next/link';
import CopyButton from '@/app/components/CopyButton';
import { use } from 'react';
import UserSearch from '@/app/components/UserSearch';
import StatusUpdateDialog from '../../components/StatusUpdateDialog';
import { format } from 'date-fns';
import { Calendar, Clock, MapPin, Users, DollarSign, Share2, Copy, Check, X } from 'lucide-react';
import AddParticipantDialog from '@/app/components/AddParticipantDialog';

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
  location: string;
  city: string;
  state: string;
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
  password?: string;
  passwordRequired?: boolean;
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
  const [isAddParticipantOpen, setIsAddParticipantOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [participantToRemove, setParticipantToRemove] = useState<{ id: string; name: string; email: string } | null>(null);
  const [removingParticipant, setRemovingParticipant] = useState<Record<string, boolean>>({});
  const [editForm, setEditForm] = useState({
    description: '',
    startTime: '',
    endTime: '',
    password: '',
    passwordRequired: false,
  });
  const [participantToModify, setParticipantToModify] = useState<Participant | null>(null);
  const [modifyingParticipant, setModifyingParticipant] = useState(false);

  const isPastEvent = (endTime: string) => {
    const end = new Date(endTime);
    const now = new Date();
    return end < now;
  };

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
          endTime: data.endTime,
          isOwner: data.isOwner,
          participants: data.participants?.length || 0,
          isPastEvent: new Date(data.endTime) < new Date()
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

  const isParticipant: boolean = reservation?.participants?.some(
    p => p.user?.email === session?.user?.email
  ) ?? false;

  const currentParticipant = reservation?.participants?.find(
    p => p.user?.email === session?.user?.email
  );

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !session?.user) return;

    try {
      const response = await fetch(`/api/reservations/${reservationId}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: newMessage,
          userId: session.user.id,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      setNewMessage('');
      await refreshReservation();
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
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
        const error = await response.text();
        throw new Error(error || 'Failed to add participant');
      }

      // Refresh the reservation data
      await refreshReservation();
    } catch (error) {
      console.error('Error adding participant:', error);
      throw error;
    }
  };

  const refreshReservation = async () => {
    try {
      const response = await fetch(`/api/reservations/${reservationId}`);
      if (!response.ok) {
        throw new Error('Failed to refresh reservation');
      }
      const data = await response.json();
      setReservation(data);
    } catch (error) {
      console.error('Error refreshing reservation:', error);
      toast.error('Failed to refresh reservation');
    }
  };

  const handleEdit = () => {
    if (!reservation) return;
    setEditForm({
      description: reservation.description || '',
      startTime: reservation.startTime,
      endTime: reservation.endTime,
      password: reservation.password || '',
      passwordRequired: reservation.passwordRequired,
    });
    setIsEditing(true);
  };

  const handleSaveEdit = async () => {
    if (!reservation) return;

    try {
      const response = await fetch(`/api/reservations/${reservationId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editForm),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(error || 'Failed to update reservation');
      }

      await refreshReservation();
      setIsEditing(false);
      toast.success('Reservation updated successfully');
    } catch (error) {
      console.error('Error updating reservation:', error);
      toast.error('Failed to update reservation');
    }
  };

  const handleRemoveParticipant = async (participantId: string, participantEmail: string) => {
    if (!reservation) return;

    setRemovingParticipant(prev => ({ ...prev, [participantId]: true }));
    try {
      const response = await fetch(`/api/reservations/${reservationId}/participants`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          participantId,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to remove participant');
      }

      toast.success('Participant removed successfully');
      await refreshReservation();
    } catch (error) {
      console.error('Error removing participant:', error);
      toast.error('Failed to remove participant');
    } finally {
      setRemovingParticipant(prev => ({ ...prev, [participantId]: false }));
      setParticipantToRemove(null);
    }
  };

  const handleParticipantStatusUpdate = async (participantId: string, isGoing: boolean, hasPaid: boolean) => {
    if (!reservation) return;

    setModifyingParticipant(true);
    try {
      const response = await fetch(`/api/reservations/${reservationId}/participant-status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: participantId,
          type: 'attendance',
          value: isGoing,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update attendance status');
      }

      // Update payment status if needed
      if (reservation.paymentRequired) {
        const paymentResponse = await fetch(`/api/reservations/${reservationId}/participant-status`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userId: participantId,
            type: 'payment',
            value: hasPaid,
          }),
        });

        if (!paymentResponse.ok) {
          throw new Error('Failed to update payment status');
        }
      }

      toast.success('Participant status updated successfully');
      await refreshReservation();
      setParticipantToModify(null);
    } catch (error) {
      console.error('Error updating participant status:', error);
      toast.error('Failed to update participant status');
    } finally {
      setModifyingParticipant(false);
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
              {reservation.name || 'Untitled Reservation'}
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
                  href={`/reservations/${reservationId}/edit`}
                  className="flex items-center gap-1 bg-blue-600 text-white px-3 py-1.5 rounded text-sm hover:bg-blue-700 transition-colors"
                  onClick={() => setIsNavigating(true)}
                >
                  {isNavigating ? (
                    <FaSpinner className="w-3 h-3 animate-spin" />
                  ) : (
                    <FaEdit className="w-3 h-3" />
                  )}
                  Modify Reservation
                </Link>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium text-gray-500 mb-1">Location</p>
                <p className="text-gray-900">{reservation.court?.name || 'Unknown Court'}</p>
                <p className="text-gray-600">{reservation.court?.location || 'No location available'}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500 mb-1">Date & Time</p>
                <div className="flex items-center gap-2 text-gray-600">
                  <Calendar className="w-5 h-5" />
                  <span>
                    {formatInTimeZone(parseISO(reservation.startTime), 'America/Los_Angeles', 'EEEE, MMMM d, yyyy')}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                  <Clock className="w-5 h-5" />
                  <span>
                    {formatInTimeZone(parseISO(reservation.startTime), 'America/Los_Angeles', 'h:mm a')} - {formatInTimeZone(parseISO(reservation.endTime), 'America/Los_Angeles', 'h:mm a')}
                  </span>
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500 mb-1">Organizer</p>
                <p className="text-gray-900">{reservation.owner?.name || 'Unknown Organizer'}</p>
                <p className="text-gray-600">{reservation.owner?.email || 'No email available'}</p>
              </div>
              {reservation.description && (
                <div>
                  <p className="text-sm font-medium text-gray-500 mb-1">Description</p>
                  <div className="text-gray-700 prose prose-sm max-w-none bg-gray-50 p-3 rounded-lg">
                    {reservation.description.split('\n').map((line, i) => {
                      // Check if the line is a URL (with or without @ prefix)
                      const cleanLine = line.trim().replace(/^@/, '');
                      if (cleanLine.match(/^https?:\/\/.*\.(jpg|jpeg|png|gif|webp|svg)$/i)) {
                        return (
                          <div key={i} className="my-4">
                            <img 
                              src={cleanLine} 
                              alt="Reservation image" 
                              className="rounded-lg max-w-full h-auto shadow-md hover:shadow-lg transition-shadow duration-200"
                              loading="lazy"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.style.display = 'none';
                              }}
                            />
                          </div>
                        );
                      }
                      // If the line contains a URL but isn't just a URL, render it as text
                      if (cleanLine.includes('http')) {
                        return <p key={i}>{line}</p>;
                      }
                      return <p key={i}>{line}</p>;
                    })}
                  </div>
                </div>
              )}
              {reservation.paymentRequired && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mt-4">
                  <div className="flex items-center gap-2 mb-2">
                    <FaDollarSign className="text-yellow-600 w-4 h-4" />
                    <p className="text-sm font-medium text-yellow-800">Payment Information</p>
                  </div>
                  <p className="text-yellow-700 bg-white rounded p-2 border border-yellow-100">{reservation.paymentInfo || 'No payment information available'}</p>
                </div>
              )}
            </div>

            <div>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">Participants</h2>
                {reservation.isOwner && (
                  <button
                    onClick={() => setIsAddParticipantOpen(true)}
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
                          {/* Show Modify Status button only for the current user's own entry */}
                          {participant.user?.email === session?.user?.email && (
                            <button
                              onClick={() => setParticipantToModify(participant)}
                              className="flex items-center gap-1 px-3 py-1.5 rounded-md text-sm font-medium bg-blue-100 text-blue-700 hover:bg-blue-200 transition-colors border border-blue-300"
                            >
                              <FaEdit className="w-3 h-3" />
                              Modify Status
                            </button>
                          )}
                          {reservation.isOwner && !isPastEvent(reservation.endTime) && (
                            <button
                              onClick={() => setParticipantToRemove({
                                id: participant.id,
                                name: participant.user?.name || participant.user?.email || 'Anonymous',
                                email: participant.user?.email || ''
                              })}
                              className="flex items-center gap-1 px-2 py-1 rounded text-xs font-medium border border-red-300 text-red-700 hover:bg-red-50 transition-colors"
                            >
                              <FaTrash className="w-3 h-3" />
                              Remove
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
                          {/* Show Modify Status button only for the current user's own entry */}
                          {participant.user?.email === session?.user?.email && (
                            <button
                              onClick={() => setParticipantToModify(participant)}
                              className="flex items-center gap-1 px-3 py-1.5 rounded-md text-sm font-medium bg-blue-100 text-blue-700 hover:bg-blue-200 transition-colors border border-blue-300"
                            >
                              <FaEdit className="w-3 h-3" />
                              Modify Status
                            </button>
                          )}
                          {reservation.isOwner && !isPastEvent(reservation.endTime) && (
                            <button
                              onClick={() => setParticipantToRemove({
                                id: participant.id,
                                name: participant.user?.name || participant.user?.email || 'Anonymous',
                                email: participant.user?.email || ''
                              })}
                              className="flex items-center gap-1 px-2 py-1 rounded text-xs font-medium border border-red-300 text-red-700 hover:bg-red-50 transition-colors"
                            >
                              <FaTrash className="w-3 h-3" />
                              Remove
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Messages Section */}
          {isParticipant && (
            <div className="mt-8">
              <h2 className="text-xl font-semibold mb-4">Messages</h2>
              <div className="space-y-4 mb-4">
                {reservation.messages && reservation.messages.length > 0 ? (
                  reservation.messages.map((message) => (
                    <div key={message.id} className="flex flex-col space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{message.user.name || message.user.email}</span>
                        <span className="text-sm text-gray-500">
                          {formatInTimeZone(parseISO(message.createdAt), 'America/Los_Angeles', 'MMM d, h:mm a')}
                        </span>
                      </div>
                      <p className="text-gray-700">{message.content}</p>
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

          {reservation.isOwner && (
            <div className="flex gap-2 mb-4">
              <button
                onClick={handleEdit}
                className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                <FaEdit className="w-4 h-4" />
                Edit Reservation
              </button>
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
                        ? 'bg-green-100 text-green-800 border-2 border-green-500'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Yes
                  </button>
                  <button
                    onClick={() => setSelectedStatus({ ...selectedStatus, isGoing: false })}
                    className={`flex-1 px-4 py-2 text-sm font-medium rounded-lg ${
                      !selectedStatus.isGoing
                        ? 'bg-red-100 text-red-800 border-2 border-red-500'
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
                          ? 'bg-green-100 text-green-800 border-2 border-green-500'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      Yes
                    </button>
                    <button
                      onClick={() => setSelectedStatus({ ...selectedStatus, hasPaid: false })}
                      className={`flex-1 px-4 py-2 text-sm font-medium rounded-lg ${
                        !selectedStatus.hasPaid
                          ? 'bg-red-100 text-red-800 border-2 border-red-500'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      No
                    </button>
                  </div>
                </div>
              )}
              <div className="flex gap-2 mt-6 pt-4 border-t border-gray-200">
                <button
                  onClick={() => {
                    handleStatusUpdate(selectedStatus.isGoing, selectedStatus.hasPaid);
                    setShowStatusDialog(false);
                  }}
                  disabled={isUpdating}
                  className="flex-1 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
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

      {isEditing && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Edit Reservation</h3>
              <button
                onClick={() => setIsEditing(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <FaTimes className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={editForm.description}
                  onChange={(e) => setEditForm(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full p-2 border rounded"
                  rows={3}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Start Time
                </label>
                <input
                  type="datetime-local"
                  value={editForm.startTime}
                  onChange={(e) => setEditForm(prev => ({ ...prev, startTime: e.target.value }))}
                  className="w-full p-2 border rounded"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  End Time
                </label>
                <input
                  type="datetime-local"
                  value={editForm.endTime}
                  onChange={(e) => setEditForm(prev => ({ ...prev, endTime: e.target.value }))}
                  className="w-full p-2 border rounded"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="passwordRequired"
                  checked={editForm.passwordRequired}
                  onChange={(e) => setEditForm(prev => ({ ...prev, passwordRequired: e.target.checked }))}
                  className="rounded"
                />
                <label htmlFor="passwordRequired" className="text-sm font-medium text-gray-700">
                  Require Password
                </label>
              </div>

              {editForm.passwordRequired && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Password
                  </label>
                  <input
                    type="text"
                    value={editForm.password}
                    onChange={(e) => setEditForm(prev => ({ ...prev, password: e.target.value }))}
                    className="w-full p-2 border rounded"
                    placeholder="Enter password"
                  />
                </div>
              )}

              <div className="flex justify-end gap-4">
                <button
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveEdit}
                  className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <AddParticipantDialog
        isOpen={isAddParticipantOpen}
        onClose={() => setIsAddParticipantOpen(false)}
        onAddParticipant={handleAddParticipant}
        existingParticipants={reservation?.participants || []}
      />

      {participantToRemove && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Confirm Removal</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to remove {participantToRemove.name} from this reservation? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-4">
              <button
                onClick={() => setParticipantToRemove(null)}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (participantToRemove) {
                    handleRemoveParticipant(participantToRemove.id, participantToRemove.email);
                  }
                }}
                disabled={removingParticipant[participantToRemove.id]}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {removingParticipant[participantToRemove.id] ? (
                  <span className="flex items-center gap-2">
                    <FaSpinner className="w-4 h-4 animate-spin" />
                    Removing...
                  </span>
                ) : (
                  'Remove Participant'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Participant Status Modification Dialog */}
      {participantToModify && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Update Your Status
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Are you going?
                </label>
                <div className="flex gap-2">
                  <button
                    onClick={() => setParticipantToModify(prev => prev ? { ...prev, isGoing: true } : null)}
                    className={`flex-1 px-4 py-2 text-sm font-medium rounded-lg ${
                      participantToModify.isGoing
                        ? 'bg-green-100 text-green-800 border-2 border-green-500'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Yes
                  </button>
                  <button
                    onClick={() => setParticipantToModify(prev => prev ? { ...prev, isGoing: false } : null)}
                    className={`flex-1 px-4 py-2 text-sm font-medium rounded-lg ${
                      !participantToModify.isGoing
                        ? 'bg-red-100 text-red-800 border-2 border-red-500'
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
                      onClick={() => setParticipantToModify(prev => prev ? { ...prev, hasPaid: true } : null)}
                      className={`flex-1 px-4 py-2 text-sm font-medium rounded-lg ${
                        participantToModify.hasPaid
                          ? 'bg-green-100 text-green-800 border-2 border-green-500'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      Yes
                    </button>
                    <button
                      onClick={() => setParticipantToModify(prev => prev ? { ...prev, hasPaid: false } : null)}
                      className={`flex-1 px-4 py-2 text-sm font-medium rounded-lg ${
                        !participantToModify.hasPaid
                          ? 'bg-red-100 text-red-800 border-2 border-red-500'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      No
                    </button>
                  </div>
                </div>
              )}
              <div className="flex justify-end gap-4 pt-4 border-t border-gray-200">
                <button
                  onClick={() => setParticipantToModify(null)}
                  className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    if (participantToModify) {
                      handleParticipantStatusUpdate(
                        participantToModify.id,
                        participantToModify.isGoing,
                        participantToModify.hasPaid
                      );
                    }
                  }}
                  disabled={modifyingParticipant}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  {modifyingParticipant ? (
                    <span className="flex items-center gap-2">
                      <FaSpinner className="w-4 h-4 animate-spin" />
                      Updating...
                    </span>
                  ) : (
                    'Save Changes'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
} 