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
  const [reservationName, setReservationName] = useState('');
  const [interval, setInterval] = useState<'30' | '60'>('60');
  const [password, setPassword] = useState<string | null>(null);
  const { courtId } = React.use(params);

  useEffect(() => {
    if (!session && status !== 'loading') {
      router.push('/');
      return;
    }

    fetchCourt();
  }, [session, status, router, courtId]);

  useEffect(() => {
    if (selectedDate && court && session?.user) {
      // Set default reservation name
      const defaultName = `${session.user.name || 'Your'}'s ${format(selectedDate, 'EEEE')} ${court.name} Reservation`;
      setReservationName(defaultName);
    }
  }, [selectedDate, court, session]);

  useEffect(() => {
    if (selectedDate) {
      fetchTimeSlots();
    }
  }, [selectedDate, interval]);

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
        `/api/courts/${courtId}/time-slots?date=${format(selectedDate, 'yyyy-MM-dd')}&interval=${interval}`
      );
      const data = await response.json();
      setTimeSlots(data);
      setSelectedTimeSlots([]); // Reset selection when date or interval changes
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
        // Calculate maximum allowed slots based on interval
        const maxSlots = interval === '30' ? 6 : 3; // 6 half-hour slots or 3 one-hour slots
        
        // Check if we're within the 3-hour limit
        if (current.length < maxSlots) {
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

    if (!reservationName.trim()) {
      toast.error('Please provide a name for the reservation');
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
          name: reservationName.trim(),
          startTime: selectedTimeSlots[0].startTime,
          endTime: getReservationEndTime(),
          participantIds: participants.map(p => p.email),
          description: description.trim() || null,
          paymentRequired,
          paymentInfo: paymentInfo.trim() || null,
          password: password || null,
        }),
      });

      if (response.ok) {
        toast.success('Reservation created successfully');
        router.push('/my-reservations');
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
            <h2 className="text-xl font-semibold mb-4">Reservation Name</h2>
            <input
              type="text"
              value={reservationName}
              onChange={(e) => setReservationName(e.target.value)}
              placeholder="Enter a name for your reservation"
              className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

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
            <h2 className="text-xl font-semibold mb-4">Time Slot Interval</h2>
            <div className="flex gap-4 mb-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  value="60"
                  checked={interval === '60'}
                  onChange={(e) => setInterval(e.target.value as '30' | '60')}
                  className="mr-2"
                />
                1 Hour
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  value="30"
                  checked={interval === '30'}
                  onChange={(e) => setInterval(e.target.value as '30' | '60')}
                  className="mr-2"
                />
                30 Minutes
              </label>
            </div>
          </div>

          <div>
            <h2 className="text-xl font-semibold mb-4">Pick Your Time Slots</h2>
            <p className="text-sm text-gray-600 mb-4">
              Available time slots are shown in Pacific Time (PT). You can reserve up to {interval === '30' ? '6 half-hour slots' : '3 one-hour slots'} (3 hours total).
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
                    disabled={!slot.isAvailable}
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
                      {slot.isAvailable
                        ? isSelected
                          ? 'Selected'
                          : slot.isAvailable 
                            ? interval === '30' ? '30 min' : '1 hour'
                            : interval === '30' ? '30 min' : '1 hour'
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
              placeholder="Provide additional details about your reservation:&#13;&#10;• Tournament details and address&#13;&#10;• Contact information for questions&#13;&#10;• Skill level or format (e.g., round robin, mixed doubles)&#13;&#10;• Equipment requirements&#13;&#10;• Special instructions or rules"
              className="w-full p-4 border rounded min-h-[120px] text-gray-700 placeholder-gray-400"
              rows={6}
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

          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="passwordProtected"
                checked={!!password}
                onChange={(e) => e.target.checked ? setPassword('') : setPassword(null)}
                className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
              />
              <label htmlFor="passwordProtected" className="text-gray-700">
                Password Protected
              </label>
            </div>

            {password !== null && (
              <div className="bg-gray-50 p-4 rounded-lg">
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                  Reservation Password
                </label>
                <input
                  type="text"
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter a password for participants to join"
                  className="w-full p-3 border rounded text-gray-700 placeholder-gray-400"
                />
                <p className="mt-2 text-sm text-gray-500">
                  Participants will need to enter this password when joining through the shared URL.
                </p>
              </div>
            )}
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