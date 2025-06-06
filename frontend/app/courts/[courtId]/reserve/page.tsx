'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { toast } from 'react-hot-toast';
import { addDays, format, parse, startOfDay } from 'date-fns';
import { formatInTimeZone } from 'date-fns-tz';
import UserSearch from '@/app/components/UserSearch';
import Image from 'next/image';

interface Court {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
}

interface TimeSlot {
  startTime: string;
  endTime: string;
  isAvailable: boolean;
  maxExtensionSlots: number;
}

interface User {
  email: string;
  name: string | null;
  image: string | null;
}

interface PageProps {
  params: Promise<{
    courtId: string;
  }>;
}

const timeZone = 'America/Los_Angeles';

export default function ReservePage({ params }: PageProps) {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [court, setCourt] = useState<Court | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date>(startOfDay(new Date()));
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [selectedTimeSlots, setSelectedTimeSlots] = useState<TimeSlot[]>([]);
  const [participants, setParticipants] = useState<User[]>([]);
  const [description, setDescription] = useState<string>('');
  const [paymentRequired, setPaymentRequired] = useState(false);
  const [paymentInfo, setPaymentInfo] = useState('');
  const { courtId } = React.use(params);

  useEffect(() => {
    if (!session && status !== 'loading') {
      router.push('/');
      return;
    }

    fetchCourt();
  }, [session, status, router, courtId]);

  useEffect(() => {
    if (selectedDate) {
      fetchTimeSlots();
    }
  }, [selectedDate]);

  const fetchCourt = async () => {
    try {
      const response = await fetch(`/api/courts/${courtId}`);
      const data = await response.json();
      setCourt(data);
    } catch (error) {
      toast.error('Failed to fetch court details');
    }
  };

  const fetchTimeSlots = async () => {
    try {
      const response = await fetch(
        `/api/courts/${courtId}/time-slots?date=${format(selectedDate, 'yyyy-MM-dd')}`
      );
      const data = await response.json();
      setTimeSlots(data);
      setSelectedTimeSlots([]); // Reset selection when date changes
    } catch (error) {
      toast.error('Failed to fetch available time slots');
    }
  };

  const handleDateChange = (date: string) => {
    setSelectedDate(parse(date, 'yyyy-MM-dd', new Date()));
  };

  const handleAddParticipant = (user: User) => {
    setParticipants(prev => [...prev, user]);
  };

  const handleRemoveParticipant = (email: string) => {
    setParticipants(prev => prev.filter(p => p.email !== email));
  };

  const handleTimeSlotSelect = (slot: TimeSlot) => {
    if (!slot.isAvailable) return;

    setSelectedTimeSlots(current => {
      // If no slots selected, start new selection
      if (current.length === 0) {
        return [slot];
      }

      // Find indices in timeSlots array
      const slotIndex = timeSlots.findIndex(s => s.startTime === slot.startTime);
      const firstSelectedIndex = timeSlots.findIndex(s => s.startTime === current[0].startTime);
      const lastSelectedIndex = timeSlots.findIndex(s => s.startTime === current[current.length - 1].startTime);

      // If clicking an already selected slot, remove it and any subsequent selections
      if (current.some(s => s.startTime === slot.startTime)) {
        return current.filter(s => {
          const index = timeSlots.findIndex(ts => ts.startTime === s.startTime);
          return index <= slotIndex;
        });
      }

      // Check if the slot is consecutive
      if (slotIndex === lastSelectedIndex + 1) {
        // Check if we're within the 3-hour limit (6 slots)
        if (current.length < 6) {
          return [...current, slot];
        }
      }

      // If not consecutive or over limit, start new selection
      return [slot];
    });
  };

  const getReservationEndTime = () => {
    if (selectedTimeSlots.length === 0) return null;
    return selectedTimeSlots[selectedTimeSlots.length - 1].endTime;
  };

  const handleReservation = async () => {
    if (selectedTimeSlots.length === 0) {
      toast.error('Please select at least one time slot');
      return;
    }

    if (paymentRequired && !paymentInfo.trim()) {
      toast.error('Please provide payment information');
      return;
    }

    try {
      const response = await fetch('/api/reservations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          courtId: courtId,
          startTime: selectedTimeSlots[0].startTime,
          endTime: getReservationEndTime(),
          participantIds: participants.map(p => p.email),
          description: description.trim() || null,
          paymentRequired,
          paymentInfo: paymentInfo.trim() || null,
        }),
      });

      if (response.ok) {
        toast.success('Reservation created successfully');
        router.push('/');
      } else {
        const data = await response.json();
        toast.error(data.error || 'Failed to create reservation');
      }
    } catch (error) {
      toast.error('Failed to create reservation');
    }
  };

  if (status === 'loading' || !court) {
    return <div className="flex justify-center items-center min-h-screen">Loading...</div>;
  }

  const availableDates = Array.from({ length: 14 }, (_, i) => addDays(new Date(), i));

  return (
    <main className="min-h-screen p-8">
      <div className="max-w-4xl mx-auto">
        <header className="mb-8">
          <h1 className="text-3xl font-bold">{court.name}</h1>
          <p className="text-gray-600 mt-2">{court.description}</p>
        </header>

        <div className="space-y-8">
          <div>
            <h2 className="text-xl font-semibold mb-4">Select Date</h2>
            <select
              value={format(selectedDate, 'yyyy-MM-dd')}
              onChange={(e) => handleDateChange(e.target.value)}
              className="w-full p-2 border rounded"
            >
              {availableDates.map((date) => (
                <option key={date.toISOString()} value={format(date, 'yyyy-MM-dd')}>
                  {format(date, 'EEEE, MMMM d')}
                </option>
              ))}
            </select>
          </div>

          <div>
            <h2 className="text-xl font-semibold mb-4">Select Time Slot</h2>
            <p className="text-sm text-gray-600 mb-4">
              Available time slots are shown in Pacific Time (PT). You can reserve up to 3 hours.
              Operating hours: 8 AM - 6 PM daily.
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
                    disabled={!slot.isAvailable}
                    className={`
                      p-2 rounded text-sm
                      ${
                        isSelected
                          ? 'bg-blue-500 text-white'
                          : slot.isAvailable
                          ? 'bg-white border border-gray-200 hover:border-blue-500'
                          : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      }
                    `}
                  >
                    <div className="font-medium">
                      {formatInTimeZone(startTime, timeZone, 'h:mm a')}
                    </div>
                    <div className="text-xs mt-1">
                      {slot.isAvailable
                        ? isSelected
                          ? 'Selected'
                          : '1 hour'
                        : 'Booked'}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {selectedTimeSlots.length > 0 && (
            <div className="bg-blue-50 p-4 rounded-lg mt-4">
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
            <h2 className="text-xl font-semibold mb-4">Add Notes (Optional)</h2>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add any additional notes or instructions for participants..."
              className="w-full p-4 border rounded min-h-[120px] text-gray-700 placeholder-gray-400"
              rows={4}
            />
          </div>

          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="paymentRequired"
                checked={paymentRequired}
                onChange={(e) => setPaymentRequired(e.target.checked)}
                className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
              />
              <label htmlFor="paymentRequired" className="text-gray-700">
                Payment Required
              </label>
            </div>

            {paymentRequired && (
              <div className="bg-gray-50 p-4 rounded-lg">
                <label htmlFor="paymentInfo" className="block text-sm font-medium text-gray-700 mb-2">
                  Payment Information
                </label>
                <textarea
                  id="paymentInfo"
                  value={paymentInfo}
                  onChange={(e) => setPaymentInfo(e.target.value)}
                  placeholder="Example: Send $5 per person to @venmo-username"
                  className="w-full p-3 border rounded text-gray-700 placeholder-gray-400"
                  rows={2}
                />
              </div>
            )}
          </div>

          <div>
            <h2 className="text-xl font-semibold mb-4">Add Participants</h2>
            <div className="space-y-4">
              <UserSearch onSelect={handleAddParticipant} selectedUsers={participants} />
              <div className="flex flex-wrap gap-2">
                {participants.map((participant) => (
                  <div
                    key={participant.email}
                    className="flex items-center gap-2 bg-blue-50 px-3 py-1 rounded"
                  >
                    {participant.image && (
                      <Image
                        src={participant.image}
                        alt={participant.name || ''}
                        width={20}
                        height={20}
                        className="rounded-full"
                      />
                    )}
                    <span>{participant.name}</span>
                    <button
                      onClick={() => handleRemoveParticipant(participant.email)}
                      className="text-red-500 hover:text-red-700"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <button
            onClick={handleReservation}
            className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Create Reservation
          </button>
        </div>
      </div>
    </main>
  );
} 