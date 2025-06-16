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
import Link from 'next/link';
import { FaShare, FaEdit, FaSpinner, FaEye, FaTrash } from 'react-icons/fa';

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
  isOwner: boolean;
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
  const [isMessagesActive, setIsMessagesActive] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [showUserSearch, setShowUserSearch] = useState(false);
  const { reservationId } = unwrappedParams;
  const [isNavigating, setIsNavigating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (!session && status !== 'loading') {
      router.push('/');
      return;
    }

    let isMounted = true;

    const fetchData = async () => {
      try {
        const [reservationRes, messagesRes, paymentRes] = await Promise.all([
          fetch(`/api/reservations/${reservationId}`, {
            headers: {
              'Cache-Control': 'no-cache',
              'Pragma': 'no-cache'
            }
          }),
          fetch(`/api/reservations/${reservationId}/messages`, {
            headers: {
              'Cache-Control': 'no-cache',
              'Pragma': 'no-cache'
            }
          }),
          fetch(`/api/reservations/${reservationId}/payment`, {
            headers: {
              'Cache-Control': 'no-cache',
              'Pragma': 'no-cache'
            }
          })
        ]);

        if (isMounted) {
          if (reservationRes.ok) {
            const reservationData = await reservationRes.json();
            setReservation(reservationData);
          }

          if (messagesRes.ok) {
            const messagesData = await messagesRes.json();
            setMessages(messagesData);
          }

          if (paymentRes.ok) {
            const paymentData = await paymentRes.json();
            const statusMap = paymentData.reduce((acc: Record<string, boolean>, status: any) => {
              if (status.user && status.user.email) {
                acc[status.user.email] = status.hasPaid;
              }
              return acc;
            }, {});
            setPaymentStatuses(statusMap);
          }
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        toast.error('Failed to load reservation data');
      }
    };

    fetchData();

    // Set up polling for new messages and payment statuses
    const interval = setInterval(fetchData, 5000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
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
      const data = await response.json();
      
      if (!response.ok) {
        console.error('Failed to fetch messages:', data);
        return; // Silently fail and keep existing messages
      }
      
      setMessages(data);
    } catch (error) {
      console.error('Failed to fetch messages:', error);
      // Don't throw error, just log it and keep existing messages
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
        if (status.user && status.user.email) {
          acc[status.user.email] = status.hasPaid;
        }
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
          content: newMessage.trim(),
        }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to send message');
      }

      setNewMessage('');
      await fetchMessages(); // Refresh messages immediately
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to send message');
    }
  };

  const handleAddParticipant = async (email: string) => {
    if (!reservation) return;

    try {
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

  const isPastEvent = (endTime: Date) => {
    return new Date(endTime) < new Date();
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
                shortUrl={reservation.shortUrl}
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
              <h2 className="text-xl font-semibold mb-4">Messages</h2>
              <div className="mt-8">
                <MessageSystem 
                  reservationId={reservationId} 
                  initialMessages={messages}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
} 