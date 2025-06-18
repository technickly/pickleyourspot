'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { toast } from 'react-hot-toast';
import { format, parse, addDays, startOfDay } from 'date-fns';
import { formatInTimeZone } from 'date-fns-tz';
import Image from 'next/image';
import UserSearch from '@/app/components/UserSearch';

interface TimeSlot {
  startTime: string;
  endTime: string;
  isAvailable: boolean;
  maxExtensionSlots: number;
}

interface User {
  id: string;
  name: string | null;
  email: string;
  image: string | null;
}

interface Reservation {
  id: string;
  name: string;
  startTime: string;
  endTime: string;
  description?: string | null;
  paymentRequired: boolean;
  paymentInfo?: string | null;
  court: {
    id: string;
    name: string;
    description: string;
  };
  participants: User[];
}

interface PageProps {
  params: Promise<{
    reservationId: string;
  }>;
}

const timeZone = 'America/Los_Angeles';

export default function EditReservationPage({ params }: PageProps) {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [reservation, setReservation] = useState<Reservation | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [selectedTimeSlots, setSelectedTimeSlots] = useState<TimeSlot[]>([]);
  const [description, setDescription] = useState('');
  const [paymentRequired, setPaymentRequired] = useState(false);
  const [paymentInfo, setPaymentInfo] = useState('');
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [participants, setParticipants] = useState<User[]>([]);
  const { reservationId } = React.use(params);

  useEffect(() => {
    if (!session && status !== 'loading') {
      router.push('/');
      return;
    }

    fetchReservation();
  }, [session, status, router, reservationId]);

  useEffect(() => {
    if (selectedDate) {
      fetchTimeSlots();
    }
  }, [selectedDate]);

  const fetchReservation = async () => {
    try {
      const response = await fetch(`/api/reservations/${reservationId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch reservation');
      }
      const data = await response.json();
      setReservation(data);
      setName(data.name || '');
      setDescription(data.description || '');
      setPaymentRequired(data.paymentRequired);
      setPaymentInfo(data.paymentInfo || '');
      setSelectedDate(startOfDay(new Date(data.startTime)));
    } catch (error) {
      toast.error('Failed to fetch reservation details');
      router.push('/my-reservations');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchTimeSlots = async () => {
    if (!reservation) return;
    
    try {
      const response = await fetch(
        `/api/courts/${reservation.court.id}/time-slots?date=${format(selectedDate, 'yyyy-MM-dd')}`
      );
      if (!response.ok) throw new Error('Failed to fetch time slots');
      
      const data = await response.json();
      setTimeSlots(data);

      // Find and select the current time slot if we're on the same day
      if (format(selectedDate, 'yyyy-MM-dd') === format(new Date(reservation.startTime), 'yyyy-MM-dd')) {
        const currentSlots = data.filter((slot: TimeSlot) => 
          new Date(slot.startTime) >= new Date(reservation.startTime) &&
          new Date(slot.endTime) <= new Date(reservation.endTime)
        );
        setSelectedTimeSlots(currentSlots);
      } else {
        setSelectedTimeSlots([]);
      }
    } catch (error) {
      toast.error('Failed to fetch available time slots');
    }
  };

  const handleDateChange = (date: string) => {
    setSelectedDate(parse(date, 'yyyy-MM-dd', new Date()));
  };

  const handleTimeSlotSelect = (slot: TimeSlot) => {
    if (!slot.isAvailable && !selectedTimeSlots.some(s => s.startTime === slot.startTime)) return;

    setSelectedTimeSlots(current => {
      if (current.length === 0) {
        return [slot];
      }

      const slotIndex = timeSlots.findIndex(s => s.startTime === slot.startTime);
      const firstSelectedIndex = timeSlots.findIndex(s => s.startTime === current[0].startTime);
      const lastSelectedIndex = timeSlots.findIndex(s => s.startTime === current[current.length - 1].startTime);

      if (current.some(s => s.startTime === slot.startTime)) {
        return current.filter(s => {
          const index = timeSlots.findIndex(ts => ts.startTime === s.startTime);
          return index <= slotIndex;
        });
      }

      // Check if the slot is consecutive and within 6-hour limit (6 slots of 1 hour each)
      if (slotIndex === lastSelectedIndex + 1 && current.length < 6) {
        return [...current, slot];
      }

      return [slot];
    });
  };

  const handleAddParticipant = (participant: User) => {
    setParticipants(prev => [...prev, participant]);
  };

  const handleRemoveParticipant = (email: string) => {
    setParticipants(prev => prev.filter(p => p.email !== email));
  };

  const handleSave = async () => {
    if (selectedTimeSlots.length === 0) {
      toast.error('Please select at least one time slot');
      return;
    }

    if (paymentRequired && !paymentInfo.trim()) {
      toast.error('Please provide payment information');
      return;
    }

    if (!name.trim()) {
      toast.error('Please provide a name for the reservation');
      return;
    }

    setIsSaving(true);
    try {
      const response = await fetch(`/api/reservations/${reservationId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: name.trim(),
          startTime: selectedTimeSlots[0].startTime,
          endTime: selectedTimeSlots[selectedTimeSlots.length - 1].endTime,
          description: description.trim() || null,
          paymentRequired,
          paymentInfo: paymentInfo.trim() || null,
          participantIds: participants.map(p => p.email),
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to update reservation');
      }

      toast.success('Reservation updated successfully');
      router.push('/my-reservations');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to update reservation');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading || !reservation) {
    return <div className="flex justify-center items-center min-h-screen">Loading...</div>;
  }

  const availableDates = Array.from({ length: 14 }, (_, i) => addDays(new Date(), i));

  return (
    <main className="min-h-screen p-8">
      <div className="max-w-4xl mx-auto">
        <header className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold">Edit Reservation</h1>
              <p className="text-gray-600 mt-2">{reservation.court.name}</p>
            </div>
            <button
              onClick={() => router.push('/my-reservations')}
              className="text-gray-600 hover:text-gray-800 flex items-center gap-2"
            >
              <span>←</span> Back to My Events
            </button>
          </div>
        </header>

        <div className="space-y-8">
          <div>
            <h2 className="text-xl font-semibold mb-4">Reservation Name</h2>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter reservation name"
              className="w-full p-3 border rounded-lg"
            />
          </div>

          <div>
            <h2 className="text-xl font-semibold mb-4">Select Date</h2>
            <select
              value={format(selectedDate, 'yyyy-MM-dd')}
              onChange={(e) => handleDateChange(e.target.value)}
              className="w-full p-3 border rounded-lg"
            >
              {availableDates.map((date) => (
                <option key={date.toISOString()} value={format(date, 'yyyy-MM-dd')}>
                  {format(date, 'EEEE, MMMM d')}
                </option>
              ))}
            </select>
          </div>

          <div>
            <h2 className="text-xl font-semibold mb-4">Choose Time Slots</h2>
            <p className="text-sm text-gray-600 mb-4">
              Available time slots are shown in Pacific Time (PT). You can reserve up to 6 hours.
              Operating hours: 8 AM - 8 PM daily.
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
              {timeSlots.map((slot) => {
                const isSelected = selectedTimeSlots.some(
                  (s) => s.startTime === slot.startTime
                );
                const startTime = new Date(slot.startTime);

                return (
                  <button
                    key={slot.startTime}
                    onClick={() => handleTimeSlotSelect(slot)}
                    disabled={!slot.isAvailable && !isSelected}
                    className={`
                      p-3 rounded-lg text-sm transition-all relative
                      ${
                        isSelected
                          ? 'bg-blue-500 text-white shadow-md'
                          : slot.isAvailable
                          ? 'bg-white border-2 border-gray-200 hover:border-blue-500 hover:shadow'
                          : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      }
                    `}
                  >
                    <div className="font-medium">
                      {formatInTimeZone(startTime, timeZone, 'h:mm a')}
                    </div>
                    <div className="text-xs mt-1">
                      {slot.isAvailable || isSelected
                        ? isSelected
                          ? 'Selected'
                          : 'Pick Your Slot'
                        : 'Booked'}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {selectedTimeSlots.length > 0 && (
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="font-medium text-blue-900">Selected Time</h3>
              <p className="text-blue-800">
                {formatInTimeZone(
                  new Date(selectedTimeSlots[0].startTime),
                  timeZone,
                  'EEEE, MMMM d, yyyy'
                )}
                <br />
                {formatInTimeZone(
                  new Date(selectedTimeSlots[0].startTime),
                  timeZone,
                  'h:mm a'
                )}{' '}
                -{' '}
                {formatInTimeZone(
                  new Date(selectedTimeSlots[selectedTimeSlots.length - 1].endTime),
                  timeZone,
                  'h:mm a'
                )}{' '}
                PT
              </p>
            </div>
          )}

          <div>
            <h2 className="text-xl font-semibold mb-4">Add Participants</h2>
            <div className="space-y-4">
              <UserSearch
                onSelect={handleAddParticipant}
                placeholder="Search for participants by name or email..."
                className="mb-4"
              />
              
              {participants.length > 0 && (
                <div className="space-y-2">
                  <h3 className="font-medium text-gray-700">Added Participants:</h3>
                  <div className="space-y-2">
                    {participants.map((participant) => (
                      <div
                        key={participant.email}
                        className="flex items-center justify-between bg-white p-3 rounded-lg border"
                      >
                        <div className="flex items-center space-x-3">
                          {participant.image && (
                            <Image
                              src={participant.image}
                              alt={participant.name || participant.email}
                              width={32}
                              height={32}
                              className="rounded-full"
                            />
                          )}
                          <div>
                            {participant.name && (
                              <div className="font-medium">{participant.name}</div>
                            )}
                            <div className="text-sm text-gray-600">{participant.email}</div>
                          </div>
                        </div>
                        <button
                          onClick={() => handleRemoveParticipant(participant.email)}
                          className="text-red-600 hover:text-red-800"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div>
            <h2 className="text-xl font-semibold mb-4">Reservation Notes:</h2>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add any additional notes or instructions for participants..."
              className="w-full p-4 border rounded-lg min-h-[120px] text-gray-700 placeholder-gray-400"
              rows={4}
            />
          </div>

          <div>
            <h2 className="text-xl font-semibold mb-4">Payment Settings</h2>
            <div className="space-y-4">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={paymentRequired}
                  onChange={(e) => setPaymentRequired(e.target.checked)}
                  className="rounded text-blue-500 w-5 h-5"
                />
                <span>Require payment from participants</span>
              </label>

              {paymentRequired && (
                <textarea
                  value={paymentInfo}
                  onChange={(e) => setPaymentInfo(e.target.value)}
                  placeholder="Enter payment details (e.g., Venmo username, payment amount, etc.)"
                  className="w-full p-4 border rounded-lg text-gray-700 placeholder-gray-400"
                  rows={3}
                />
              )}
            </div>
          </div>

          <div className="flex gap-4 pt-4">
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="flex-1 bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 transition-colors disabled:bg-blue-300 font-medium"
            >
              {isSaving ? 'Saving Changes...' : 'Save Changes'}
            </button>
            <button
              onClick={() => router.push('/my-reservations')}
              className="flex-1 border-2 border-gray-300 text-gray-700 py-3 px-6 rounded-lg hover:bg-gray-50 transition-colors font-medium"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </main>
  );
} 