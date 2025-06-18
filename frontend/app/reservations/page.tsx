'use client';

import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { toast } from 'react-hot-toast';
import { formatInTimeZone } from 'date-fns-tz';
import CopyButton from '@/app/components/CopyButton';
import { useRouter } from 'next/navigation';
import { FaShare, FaEdit, FaTrash, FaEye, FaCheck, FaTimes, FaSpinner, FaDollarSign, FaUserCheck, FaUserTimes } from 'react-icons/fa';
import StatusUpdateDialog from '../components/StatusUpdateDialog';

interface Participant {
  id: string;
  email: string;
  isGoing: boolean;
  hasPaid: boolean;
  user?: {
    id: string;
    name: string;
    email: string;
    image: string;
  };
}

interface Message {
  id: string;
  content: string;
  createdAt: string;
  user: {
    name: string | null;
    email: string;
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
  shortUrl: string;
  passwordRequired: boolean;
  messages?: Message[];
  court: {
    name: string;
  };
}

const timeZone = 'America/Los_Angeles';

export default function ReservationsPage() {
  const { data: session, status } = useSession();
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [filter, setFilter] = useState<'all' | 'active' | 'past'>('active');
  const router = useRouter();
  const [currentPage, setCurrentPage] = useState(1);
  const [isNavigating, setIsNavigating] = useState(false);
  const [messages, setMessages] = useState<Record<string, Message[]>>({});
  const [newMessage, setNewMessage] = useState<Record<string, string>>({});
  const [isSendingMessage, setIsSendingMessage] = useState<Record<string, boolean>>({});
  const [updatingStatus, setUpdatingStatus] = useState<Record<string, boolean>>({});
  const [selectedReservation, setSelectedReservation] = useState<Reservation | null>(null);
  const [isUpdateDialogOpen, setIsUpdateDialogOpen] = useState(false);

  const fetchReservations = async () => {
    try {
      const response = await fetch('/api/reservations/user', {
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });
      if (!response.ok) {
        throw new Error('Failed to fetch reservations');
      }
      const data = await response.json();
      setReservations(data);
    } catch (error) {
      console.error('Error fetching reservations:', error);
      toast.error('Failed to load reservations');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchMessages = async (reservationId: string) => {
    try {
      const response = await fetch(`/api/reservations/${reservationId}/messages`);
      if (!response.ok) throw new Error('Failed to fetch messages');
      const data = await response.json();
      setMessages(prev => ({ ...prev, [reservationId]: data }));
    } catch (error) {
      console.error('Error fetching messages:', error);
      toast.error('Failed to load messages');
    }
  };

  const sendMessage = async (reservationId: string) => {
    if (!newMessage[reservationId]?.trim()) return;
    
    setIsSendingMessage(prev => ({ ...prev, [reservationId]: true }));
    try {
      const response = await fetch(`/api/reservations/${reservationId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: newMessage[reservationId] }),
      });
      
      if (!response.ok) throw new Error('Failed to send message');
      
      const message = await response.json();
      setMessages(prev => ({
        ...prev,
        [reservationId]: [...(prev[reservationId] || []), message],
      }));
      setNewMessage(prev => ({ ...prev, [reservationId]: '' }));
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
    } finally {
      setIsSendingMessage(prev => ({ ...prev, [reservationId]: false }));
    }
  };

  const handleStatusUpdate = async (reservationId: string, isGoing: boolean, hasPaid: boolean) => {
    try {
      const response = await fetch(`/api/reservations/${reservationId}/participants/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          isGoing,
          hasPaid,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update status');
      }

      const updatedReservation = await response.json();
      setReservations(prev => 
        prev.map(r => r.id === reservationId ? updatedReservation : r)
      );
      router.push('/reservations');
    } catch (error) {
      console.error('Error updating status:', error);
      throw error;
    }
  };

  useEffect(() => {
    if (session?.user?.email) {
      fetchReservations();
    }
  }, [session]);

  useEffect(() => {
    const handleStart = () => setIsNavigating(true);
    const handleComplete = () => setIsNavigating(false);

    window.addEventListener('beforeunload', handleStart);
    
    // Use the new App Router navigation events
    router.prefetch = () => setIsNavigating(true);
    router.refresh = () => setIsNavigating(false);

    return () => {
      window.removeEventListener('beforeunload', handleStart);
    };
  }, [router]);

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
      await fetchReservations(); // Refresh the list
    } catch (error) {
      toast.error('Failed to delete reservation');
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(null);
    }
  };

  const isPastEvent = (endTime: string) => {
    return new Date(endTime) < new Date();
  };

  const filteredReservations = reservations
    .filter(reservation => {
      // If user is owner, show only as owner
      if (reservation.isOwner) return true;
      // If user is not owner, show as participant
      return !reservations.some(r => r.id === reservation.id && r.isOwner);
    })
    .filter(reservation => {
      if (filter === 'all') return true;
      if (filter === 'active') return !isPastEvent(reservation.endTime);
      if (filter === 'past') return isPastEvent(reservation.endTime);
      return true;
    });

  // Implement pagination
  const reservationsPerPage = 10;
  const totalPages = Math.ceil(filteredReservations.length / reservationsPerPage);
  const startIndex = (currentPage - 1) * reservationsPerPage;
  const endIndex = startIndex + reservationsPerPage;
  const currentReservations = filteredReservations.slice(startIndex, endIndex);

  if (status === 'loading' || isLoading) {
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
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">My Reservations</h1>
          <Link
            href="/courts"
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Create New Reservation
          </Link>
        </div>

        <div className="mb-6 flex gap-4">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg ${
              filter === 'all'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setFilter('active')}
            className={`px-4 py-2 rounded-lg ${
              filter === 'active'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            Active
          </button>
          <button
            onClick={() => setFilter('past')}
            className={`px-4 py-2 rounded-lg ${
              filter === 'past'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            Past
          </button>
        </div>

        {currentReservations.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">No reservations found</p>
          </div>
        ) : (
          <div className="grid gap-6">
            {currentReservations.map((reservation) => (
              <div
                key={reservation.id}
                className="bg-white rounded-lg shadow-sm overflow-hidden"
              >
                <div className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h2 className="text-xl font-semibold text-gray-900">{reservation.name}</h2>
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                          isPastEvent(reservation.endTime)
                            ? 'bg-gray-100 text-gray-600'
                            : 'bg-green-100 text-green-700'
                        }`}>
                          {isPastEvent(reservation.endTime) ? 'Past' : 'Active'}
                        </span>
                        {reservation.isOwner && (
                          <span className="px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-700">
                            Owner
                          </span>
                        )}
                        <span className={`px-2 py-0.5 rounded-full text-xs ${
                          reservation.passwordRequired 
                            ? 'bg-purple-100 text-purple-800'
                            : 'bg-green-100 text-green-800'
                        }`}>
                          {reservation.passwordRequired ? 'Private' : 'Public'}
                        </span>
                      </div>
                      <p className="text-gray-600">{reservation.courtName}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <CopyButton
                        text={`${window.location.origin}/reservations/${reservation.id}`}
                        label={
                          <span className="flex items-center gap-1 bg-gray-600 text-white px-2 py-1 rounded text-sm hover:bg-gray-700 transition-colors">
                            <FaShare className="w-3 h-3" />
                            Share
                          </span>
                        }
                        className="hover:bg-gray-700"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
                    <div className="space-y-4">
                      <div>
                        <p className="text-sm font-medium text-gray-500 mb-1">Date & Time</p>
                        <p className="text-gray-900">
                          {formatInTimeZone(
                            new Date(reservation.startTime),
                            timeZone,
                            'EEEE, MMMM d, yyyy'
                          )}
                        </p>
                        <p className="text-gray-900">
                          {formatInTimeZone(
                            new Date(reservation.startTime),
                            timeZone,
                            'h:mm a'
                          )}{' '}
                          -{' '}
                          {formatInTimeZone(
                            new Date(reservation.endTime),
                            timeZone,
                            'h:mm a'
                          )}{' '}
                          PT
                        </p>
                      </div>

                      {reservation.description && (
                        <div>
                          <p className="text-sm font-medium text-gray-500 mb-1">Description</p>
                          <p className="text-gray-700">{reservation.description}</p>
                        </div>
                      )}

                      {reservation.paymentRequired && reservation.paymentInfo && (
                        <div>
                          <p className="text-sm font-medium text-gray-500 mb-1">Payment Information</p>
                          <p className="text-gray-700">{reservation.paymentInfo}</p>
                        </div>
                      )}
                    </div>

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
                                          onClick={() => handleStatusUpdate(reservation.id, !participant.isGoing, participant.hasPaid)}
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
                                            onClick={() => handleStatusUpdate(reservation.id, participant.isGoing, !participant.hasPaid)}
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
                                          onClick={() => handleStatusUpdate(reservation.id, !participant.isGoing, participant.hasPaid)}
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
                                            onClick={() => handleStatusUpdate(reservation.id, participant.isGoing, !participant.hasPaid)}
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

                  <div className="flex justify-end gap-4 mt-4">
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setIsNavigating(true);
                          router.push(`/reservations/${reservation.id}`);
                        }}
                        className="flex items-center gap-1 bg-gray-600 text-white px-3 py-1.5 rounded hover:bg-gray-700 transition-colors"
                      >
                        {isNavigating ? (
                          <FaSpinner className="w-4 h-4 animate-spin" />
                        ) : (
                          <FaEye className="w-4 h-4" />
                        )}
                        View
                      </button>
                      {reservation.isOwner && !isPastEvent(reservation.endTime) && (
                        <Link
                          href={`/reservations/${reservation.id}/modify`}
                          className="flex items-center gap-1 bg-blue-600 text-white px-3 py-1.5 rounded hover:bg-blue-700 transition-colors"
                          onClick={() => setIsNavigating(true)}
                        >
                          {isNavigating ? (
                            <FaSpinner className="w-4 h-4 animate-spin" />
                          ) : (
                            <FaEdit className="w-4 h-4" />
                          )}
                          Modify
                        </Link>
                      )}
                      {reservation.isOwner && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setShowDeleteConfirm(reservation.id);
                          }}
                          className="flex items-center gap-1 text-red-600 hover:text-red-700"
                          disabled={isDeleting}
                        >
                          {isDeleting ? (
                            <FaSpinner className="w-4 h-4 animate-spin" />
                          ) : (
                            <FaTrash className="w-4 h-4" />
                          )}
                          Delete
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Messages Section */}
                  <div className="mt-6 border-t pt-4">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-lg font-semibold text-gray-900">Messages</h3>
                      <button
                        onClick={() => fetchMessages(reservation.id)}
                        className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                      >
                        Refresh
                      </button>
                    </div>
                    
                    <div className="space-y-4 mb-4 max-h-60 overflow-y-auto">
                      {messages[reservation.id]?.length > 0 ? (
                        messages[reservation.id].map((message) => (
                          <div key={message.id} className="flex flex-col">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-medium text-gray-900">
                                {message.user.name || message.user.email}
                              </span>
                              <span className="text-xs text-gray-500">
                                {new Date(message.createdAt).toLocaleString()}
                              </span>
                            </div>
                            <p className="text-gray-700 bg-gray-50 rounded-lg p-3">
                              {message.content}
                            </p>
                          </div>
                        ))
                      ) : (
                        <p className="text-gray-500 text-center py-4">
                          No messages yet. Start the conversation!
                        </p>
                      )}
                    </div>
                    
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newMessage[reservation.id] || ''}
                        onChange={(e) => setNewMessage(prev => ({
                          ...prev,
                          [reservation.id]: e.target.value
                        }))}
                        placeholder="Type your message..."
                        className="flex-1 rounded-lg border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        onKeyPress={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            sendMessage(reservation.id);
                          }
                        }}
                      />
                      <button
                        onClick={() => sendMessage(reservation.id)}
                        disabled={isSendingMessage[reservation.id] || !newMessage[reservation.id]?.trim()}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isSendingMessage[reservation.id] ? (
                          <FaSpinner className="w-5 h-5 animate-spin" />
                        ) : (
                          'Send'
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {totalPages > 1 && (
          <div className="mt-8 flex justify-center gap-2">
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="px-4 py-2 border rounded-lg disabled:opacity-50"
            >
              Previous
            </button>
            <span className="px-4 py-2">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="px-4 py-2 border rounded-lg disabled:opacity-50"
            >
              Next
            </button>
          </div>
        )}
      </div>

      {selectedReservation && (
        <StatusUpdateDialog
          isOpen={isUpdateDialogOpen}
          onClose={() => {
            setIsUpdateDialogOpen(false);
            setSelectedReservation(null);
          }}
          onUpdate={async (isGoing, hasPaid) => {
            await handleStatusUpdate(selectedReservation.id, isGoing, hasPaid);
          }}
          initialIsGoing={selectedReservation.participants.find(p => p.user?.email === session.user?.email)?.isGoing ?? false}
          initialHasPaid={selectedReservation.participants.find(p => p.user?.email === session.user?.email)?.hasPaid ?? false}
          paymentRequired={selectedReservation.paymentRequired}
        />
      )}
    </div>
  );
} 