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
import MessageSystem from '@/app/components/MessageSystem';
import ParticipantList from '@/app/components/ParticipantList';
import ReservationTitle from '@/app/components/ReservationTitle';
import ReservationActions from '@/app/components/ReservationActions';
import { useLoading } from '@/app/providers/LoadingProvider';

interface User {
  name: string | null;
  email: string;
  image: string | null;
}

interface Participant extends User {
  hasPaid: boolean;
  isGoing: boolean;
  userId: string;
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
  startTime: Date;
  endTime: Date;
  description: string | null;
  paymentRequired: boolean;
  paymentInfo: string | null;
  shortUrl: string;
  court: {
    name: string;
    description: string;
    imageUrl: string;
  };
  owner: User;
  participants: Participant[];
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
  const { setIsLoading } = useLoading();
  const unwrappedParams = React.use(params);
  const [reservation, setReservation] = useState<Reservation | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [paymentStatuses, setPaymentStatuses] = useState<Record<string, boolean>>({});
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

    // Set up polling for new messages, payment statuses, and participant updates
    const interval = setInterval(() => {
      fetchMessages();
      fetchPaymentStatuses();
      fetchReservation(); // Added to poll for participant updates
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
      
      // Only update if there are changes to avoid unnecessary re-renders
      if (JSON.stringify(data) !== JSON.stringify(reservation)) {
        setReservation(data);
      }
    } catch (error) {
      console.error('Error fetching reservation:', error);
      if (!reservation) { // Only show error and redirect if initial load fails
        toast.error('Failed to fetch reservation details');
        router.push('/my-reservations');
      }
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

  const handleAddParticipant = async (email: string) => {
    if (!reservation) return;

    try {
      setIsLoading(true);
      const response = await fetch(`/api/reservations/${reservation.id}/participants`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      if (!response.ok) {
        throw new Error('Failed to add participant');
      }

      await fetchReservation();
      toast.success('Participant added successfully');
    } catch (error) {
      console.error('Error adding participant:', error);
      toast.error('Failed to add participant');
    } finally {
      setIsLoading(false);
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

  if (status === 'loading' || !reservation) {
    return <div className="flex justify-center items-center min-h-screen">Loading...</div>;
  }

  const isOwner = session?.user?.email === reservation.owner.email;

  return (
    <main className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-sm p-6 space-y-8">
          <header className="mb-8">
            <div className="flex justify-between items-start">
              <ReservationTitle
                courtName={reservation.court.name}
                courtDescription={reservation.court.description}
                startTime={reservation.startTime}
                endTime={reservation.endTime}
                ownerName={reservation.owner.name}
                ownerEmail={reservation.owner.email}
              />
              <div className="flex flex-col items-end gap-2">
                <span
                  className={`px-3 py-1 rounded-full text-sm ${
                    isOwner ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  {isOwner ? 'Owner' : 'Participant'}
                </span>
                {isOwner && <ReservationActions reservationId={reservationId} isOwner={isOwner} />}
              </div>
            </div>
          </header>

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
                  <h3 className="font-medium text-gray-700">Court Description:</h3>
                  <p className="text-gray-600 whitespace-pre-wrap mt-2 bg-gray-50 p-3 rounded-lg">{reservation.description}</p>
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

              <div>
                <h3 className="font-medium text-gray-700">Share Reservation</h3>
                <div className="mt-2">
                  <CopyButton 
                    text={`${window.location.origin}/r/${reservation.shortUrl}`}
                    label="Copy Link"
                  />
                </div>
              </div>

              <div className="mt-6">
                <ParticipantList
                  participants={reservation.participants}
                  reservationId={reservation.id}
                  reservationName={reservation.name}
                  isOwner={isOwner}
                  ownerEmail={reservation.owner.email}
                  ownerName={reservation.owner.name}
                  paymentRequired={reservation.paymentRequired}
                  userEmail={session?.user?.email || undefined}
                  onAddParticipant={handleAddParticipant}
                  onRemoveParticipant={handleRemoveParticipant}
                />
              </div>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Messages</h2>
              <button
                onClick={() => setIsMessagesActive(!isMessagesActive)}
                className="text-blue-500 hover:text-blue-600 text-sm font-medium flex items-center gap-1"
              >
                {isMessagesActive ? (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M5 10a1 1 0 011-1h8a1 1 0 110 2H6a1 1 0 01-1-1z" clipRule="evenodd" />
                    </svg>
                    Hide Messages
                  </>
                ) : (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
                    </svg>
                    Show Messages
                  </>
                )}
              </button>
            </div>
            {isMessagesActive && (
              <div className="bg-white rounded-lg border shadow-sm">
                <MessageSystem 
                  reservationId={reservationId} 
                  initialMessages={messages}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
} 