'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { toast } from 'react-hot-toast';
import { format } from 'date-fns';
import { formatInTimeZone } from 'date-fns-tz';
import Image from 'next/image';
import UserSearch from '@/app/components/UserSearch';
import CopyButton from '@/app/components/CopyButton';

interface User {
  id?: string;
  name: string | null;
  email: string;
  image: string | null;
  paymentStatus?: {
    hasPaid: boolean;
    updatedAt: string;
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
  shortUrl: string;
  startTime: string;
  endTime: string;
  description?: string | null;
  paymentRequired: boolean;
  paymentInfo?: string | null;
  court: {
    name: string;
    description: string;
  };
  owner: {
    name: string;
    email: string;
  };
  participants: User[];
  messages: Message[];
}

interface PageProps {
  params: Promise<{
    reservationId: string;
  }>;
}

const timeZone = 'America/Los_Angeles';

export default function ReservationPage({ params }: PageProps) {
  const router = useRouter();
  const { data: session, status } = useSession();
  const unwrappedParams = React.use(params);
  const [reservation, setReservation] = useState<Reservation | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [paymentStatuses, setPaymentStatuses] = useState<Record<string, boolean>>({});
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isMessagesActive, setIsMessagesActive] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [showUserSearch, setShowUserSearch] = useState(false);
  const { reservationId } = unwrappedParams;

  // Scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (!session && status !== 'loading') {
      router.push('/');
      return;
    }

    fetchReservation();
    fetchMessages();
    fetchPaymentStatuses();

    // Set up polling for new messages and payment statuses
    const interval = setInterval(() => {
      fetchMessages();
      fetchPaymentStatuses();
    }, 5000);
    return () => clearInterval(interval);
  }, [session, status, router, reservationId]);

  useEffect(() => {
    if (isMessagesActive) {
      scrollToBottom();
    }
  }, [messages, isMessagesActive]);

  // Only poll for messages when the section is active
  useEffect(() => {
    if (!session || !isMessagesActive) return;
    
    fetchMessages();
    const interval = setInterval(fetchMessages, 5000);
    return () => clearInterval(interval);
  }, [session, isMessagesActive, reservationId]);

  const fetchReservation = async () => {
    try {
      const response = await fetch(`/api/reservations/${reservationId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch reservation');
      }
      const data = await response.json();
      setReservation(data);
    } catch (error) {
      toast.error('Failed to fetch reservation details');
    }
  };

  const fetchMessages = async () => {
    try {
      const response = await fetch(`/api/reservations/${reservationId}/messages`);
      if (!response.ok) {
        throw new Error('Failed to fetch messages');
      }
      const data = await response.json();
      setMessages(data);
    } catch (error) {
      console.error('Failed to fetch messages:', error);
    }
  };

  const fetchPaymentStatuses = async () => {
    try {
      const response = await fetch(`/api/reservations/${reservationId}/payment`);
      if (!response.ok) {
        throw new Error('Failed to fetch payment statuses');
      }
      const data = await response.json();
      const statusMap = data.reduce((acc: Record<string, boolean>, status: any) => {
        acc[status.user.email] = status.hasPaid;
        return acc;
      }, {});
      setPaymentStatuses(statusMap);
    } catch (error) {
      console.error('Failed to fetch payment statuses:', error);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    try {
      const response = await fetch(`/api/reservations/${reservationId}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: newMessage,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      setNewMessage('');
      await fetchMessages(); // Refresh messages immediately
    } catch (error) {
      toast.error('Failed to send message');
    }
  };

  const handleAddParticipant = async (user: User) => {
    try {
      const response = await fetch(`/api/reservations/${reservationId}/participants`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: user.email }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to add participant');
      }

      const updatedParticipants = await response.json();
      setReservation(prev => prev ? { ...prev, participants: updatedParticipants } : null);
      setShowUserSearch(false);
      toast.success('Participant added successfully');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to add participant');
    }
  };

  const handleRemoveParticipant = async (email: string) => {
    try {
      const response = await fetch(
        `/api/reservations/${reservationId}/participants?email=${encodeURIComponent(email)}`,
        {
          method: 'DELETE',
        }
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to remove participant');
      }

      const updatedParticipants = await response.json();
      setReservation(prev => prev ? { ...prev, participants: updatedParticipants } : null);
      toast.success('Participant removed successfully');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to remove participant');
    }
  };

  const togglePaymentStatus = async () => {
    if (!session?.user?.email) return;
    
    try {
      const currentStatus = paymentStatuses[session.user.email] || false;
      const response = await fetch(`/api/reservations/${reservationId}/payment`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          hasPaid: !currentStatus,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update payment status');
      }

      await fetchPaymentStatuses();
      toast.success('Payment status updated');
    } catch (error) {
      toast.error('Failed to update payment status');
    }
  };

  const handleDeleteReservation = async () => {
    if (!isOwner) return;
    
    setIsDeleting(true);
    try {
      const response = await fetch(`/api/reservations/${reservationId}/delete`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete reservation');
      }

      toast.success('Reservation deleted successfully');
      router.push('/my-reservations');
    } catch (error) {
      toast.error('Failed to delete reservation');
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  if (status === 'loading' || !reservation) {
    return <div className="flex justify-center items-center min-h-screen">Loading...</div>;
  }

  const isOwner = session?.user?.email === reservation.owner.email;

  return (
    <main className="min-h-screen p-8">
      <div className="max-w-4xl mx-auto">
        <header className="mb-8">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold">{reservation.court.name}</h1>
              <p className="text-gray-600 mt-2">{reservation.court.description}</p>
            </div>
            <div className="flex flex-col items-end gap-2">
              <span
                className={`px-3 py-1 rounded-full text-sm ${
                  isOwner ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
                }`}
              >
                {isOwner ? 'Owner' : 'Participant'}
              </span>
              {isOwner && (
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="text-red-600 hover:text-red-800 text-sm font-medium"
                >
                  Delete Reservation
                </button>
              )}
            </div>
          </div>
        </header>

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
                  onClick={() => setShowDeleteConfirm(false)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium"
                  disabled={isDeleting}
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteReservation}
                  className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 font-medium disabled:bg-red-300"
                  disabled={isDeleting}
                >
                  {isDeleting ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="grid md:grid-cols-2 gap-8">
          <div>
            <h2 className="text-xl font-semibold mb-4">Reservation Details</h2>
            <div className="bg-white rounded-lg border p-6 space-y-4">
              <div>
                <h3 className="font-medium text-gray-700">Date & Time (PT)</h3>
                <p>
                  {formatInTimeZone(new Date(reservation.startTime), timeZone, 'EEEE, MMMM d, yyyy')}
                  <br />
                  {formatInTimeZone(new Date(reservation.startTime), timeZone, 'h:mm a')} -{' '}
                  {formatInTimeZone(new Date(reservation.endTime), timeZone, 'h:mm a')}
                </p>
              </div>

              <div>
                <h3 className="font-medium text-gray-700">Owner</h3>
                <p>{reservation.owner.name || reservation.owner.email}</p>
              </div>

              {reservation.description && (
                <div>
                  <h3 className="font-medium text-gray-700">Notes</h3>
                  <p className="text-gray-600 whitespace-pre-wrap">{reservation.description}</p>
                </div>
              )}

              {reservation.paymentRequired && (
                <div>
                  <h3 className="font-medium text-gray-700">Payment Required</h3>
                  <div className="mt-2 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                    <p className="text-gray-800 whitespace-pre-wrap">{reservation.paymentInfo}</p>
                  </div>
                </div>
              )}

              <div>
                <h3 className="font-medium text-gray-700">Share Reservation</h3>
                <div className="mt-2">
                  <CopyButton 
                    text={`${window.location.origin}/r/${reservation.shortUrl}`}
                    label="Copy Link"
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <h3 className="font-medium text-gray-700">Participants</h3>
                  {isOwner && (
                    <button
                      onClick={() => setShowUserSearch(!showUserSearch)}
                      className="text-blue-500 hover:text-blue-600 text-sm"
                    >
                      {showUserSearch ? 'Cancel' : '+ Add Participant'}
                    </button>
                  )}
                </div>
                
                {showUserSearch && isOwner && (
                  <div className="mb-4">
                    <UserSearch
                      onSelect={handleAddParticipant}
                      selectedUsers={reservation.participants}
                      placeholder="Search users by name or email..."
                    />
                  </div>
                )}

                {reservation.participants.length > 0 ? (
                  <div className="space-y-4">
                    {reservation.participants.map((participant) => (
                      <div 
                        key={participant.email} 
                        className={`participant-card ${participant.email === reservation.owner.email ? 'owner' : ''}`}
                      >
                        <div className="participant-info">
                          {participant.image && (
                            <Image
                              src={participant.image}
                              alt={participant.name || participant.email}
                              width={40}
                              height={40}
                              className="rounded-full"
                            />
                          )}
                          <div className="participant-details">
                            <div className="name-section">
                              <div className="flex items-center gap-2">
                                <span className="participant-name">
                                  {participant.name || participant.email}
                                </span>
                                {participant.email === reservation.owner.email && (
                                  <span className="owner-badge">
                                    Owner
                                  </span>
                                )}
                              </div>
                              <div className="participant-email">{participant.email}</div>
                            </div>

                            <div className="payment-section">
                              {reservation.paymentRequired && (
                                <div>
                                  {participant.email === session?.user?.email ? (
                                    <button
                                      onClick={togglePaymentStatus}
                                      className={`payment-status ${paymentStatuses[participant.email] ? 'paid' : 'unpaid'}`}
                                    >
                                      {paymentStatuses[participant.email] ? 'Paid' : 'Mark as Paid'}
                                    </button>
                                  ) : (
                                    <span className={`payment-status ${paymentStatuses[participant.email] ? 'paid' : 'unpaid'}`}>
                                      {paymentStatuses[participant.email] ? 'Paid' : 'Unpaid'}
                                    </span>
                                  )}
                                </div>
                              )}

                              {isOwner && participant.email !== session.user.email && (
                                <button
                                  onClick={() => handleRemoveParticipant(participant.email)}
                                  className="remove-button"
                                >
                                  Remove
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500">No additional participants</p>
                )}
              </div>
            </div>
          </div>

          <div>
            <h2 className="text-xl font-semibold mb-4">Messages</h2>
            <div 
              className={`bg-white rounded-lg border transition-all duration-300 ease-in-out ${
                isMessagesActive ? 'h-[500px] flex flex-col' : 'h-[300px] overflow-hidden cursor-pointer hover:bg-gray-50'
              }`}
              onClick={() => !isMessagesActive && setIsMessagesActive(true)}
            >
              <div className={`${isMessagesActive ? 'flex-1 overflow-y-auto' : 'overflow-hidden'} p-4 space-y-4`}>
                {messages.length > 0 ? (
                  messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex flex-col ${
                        message.user.email === session?.user?.email
                          ? 'items-end'
                          : 'items-start'
                      }`}
                    >
                      <div
                        className={`max-w-[80%] rounded-lg p-3 ${
                          message.user.email === session?.user?.email
                            ? 'bg-blue-500 text-white'
                            : 'bg-gray-100'
                        }`}
                      >
                        <p className="text-sm font-medium">
                          {message.user.name || message.user.email}
                        </p>
                        <p className="break-words">{message.content}</p>
                      </div>
                      <span className="text-xs text-gray-500 mt-1">
                        {format(new Date(message.createdAt), 'MMM d, h:mm a')}
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="text-center text-gray-500">No messages yet</p>
                )}
                <div ref={messagesEndRef} />
              </div>

              {isMessagesActive && (
                <form 
                  onSubmit={handleSendMessage} 
                  className="border-t p-4 sticky bottom-0 bg-white"
                >
                  <div className="flex flex-col gap-2 md:flex-row">
                    <textarea
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder="Type a message..."
                      className="flex-1 p-3 border rounded resize-none min-h-[60px] md:min-h-0 text-base md:text-sm"
                      rows={2}
                      autoFocus
                    />
                    <button
                      type="submit"
                      disabled={!newMessage.trim()}
                      className="bg-blue-500 text-white px-6 py-3 md:px-4 md:py-2 rounded-full hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-base md:text-sm font-medium"
                    >
                      Send
                    </button>
                  </div>
                </form>
              )}

              {!isMessagesActive && messages.length > 0 && (
                <div className="absolute bottom-4 left-0 right-0 text-center text-gray-500 text-sm">
                  Click to view and send messages
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
} 