'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { toast } from 'react-hot-toast';
import { addDays, format, parse, startOfDay } from 'date-fns';
import { formatInTimeZone } from 'date-fns-tz';
import UserSearch from '@/app/components/UserSearch';
import Image from 'next/image';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";

interface Court {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
}

interface TimeSlot {
  startTime: string;
  endTime: string;
  isAvailable?: boolean;
  maxExtensionSlots?: number;
}

interface User {
  email: string;
  name: string | null;
  image: string | null;
}

interface Participant {
  email: string;
  name?: string | null;
  image?: string | null;
}

interface PageProps {
  params: Promise<{
    courtId: string;
  }>;
}

const timeZone = 'America/Los_Angeles';

export default function ReservePage() {
  const { courtId } = useParams();
  const router = useRouter();
  const { data: session, status } = useSession();
  const [court, setCourt] = useState<Court | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [selectedTimeSlots, setSelectedTimeSlots] = useState<TimeSlot[]>([]);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [description, setDescription] = useState<string>('');
  const [paymentRequired, setPaymentRequired] = useState(false);
  const [paymentInfo, setPaymentInfo] = useState('');
  const [reservationName, setReservationName] = useState('');
  const [newParticipantEmail, setNewParticipantEmail] = useState('');
  const [timeInterval, setTimeInterval] = useState<'30min' | '1hour'>('1hour');
  const [requirePayment, setRequirePayment] = useState(false);
  const [paymentDescription, setPaymentDescription] = useState('');
  const [password, setPassword] = useState('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [passwordRequired, setPasswordRequired] = useState(false);

  useEffect(() => {
    if (!session && status !== 'loading') {
      router.push('/');
      return;
    }

    fetchCourt();
  }, [session, status, router, courtId]);

  useEffect(() => {
    if (selectedDate && court && session?.user) {
      const defaultName = `${session.user.name || 'Your'}'s ${format(selectedDate, 'EEEE')} ${court.name} Event`;
      setReservationName(defaultName);
    }
  }, [selectedDate, court, session]);

  const generateTimeSlots = () => {
    if (!selectedDate) return [];
    const slots: TimeSlot[] = [];
    const startHour = 8; // 8 AM
    const endHour = 20; // 8 PM
    const interval = timeInterval === '30min' ? 30 : 60;

    for (let hour = startHour; hour < endHour; hour++) {
      if (timeInterval === '30min') {
        slots.push({
          startTime: new Date(new Date(selectedDate).setHours(hour, 0, 0, 0)).toISOString(),
          endTime: new Date(new Date(selectedDate).setHours(hour, 30, 0, 0)).toISOString(),
          isAvailable: true,
          maxExtensionSlots: 1
        });
        slots.push({
          startTime: new Date(new Date(selectedDate).setHours(hour, 30, 0, 0)).toISOString(),
          endTime: new Date(new Date(selectedDate).setHours(hour + 1, 0, 0, 0)).toISOString(),
          isAvailable: true,
          maxExtensionSlots: 1
        });
      } else {
        slots.push({
          startTime: new Date(new Date(selectedDate).setHours(hour, 0, 0, 0)).toISOString(),
          endTime: new Date(new Date(selectedDate).setHours(hour + 1, 0, 0, 0)).toISOString(),
          isAvailable: true,
          maxExtensionSlots: 1
        });
      }
    }
    return slots;
  };

  useEffect(() => {
    if (selectedDate) {
      const slots = generateTimeSlots();
      setTimeSlots(slots);
    }
  }, [selectedDate, timeInterval]);

  // Auto-generate event name when date and time slots are selected
  useEffect(() => {
    if (selectedDate && selectedTimeSlots.length > 0 && court && session?.user) {
      const dateStr = format(selectedDate, 'EEEE - MMMM d');
      const timeStr = formatInTimeZone(new Date(selectedTimeSlots[0].startTime), timeZone, 'h:mma');
      const userName = session.user.name || 'User';
      setReservationName(`${userName}: ${court.name}, ${dateStr}, ${timeStr}`);
    }
  }, [selectedDate, selectedTimeSlots, court, session]);

  const fetchCourt = async () => {
    try {
      const response = await fetch(`/api/courts/${courtId}`);
      const data = await response.json();
      setCourt(data);
    } catch (error) {
      toast.error('Failed to fetch court details');
    }
  };

  const handleDateChange = (date: string) => {
    setSelectedDate(parse(date, 'yyyy-MM-dd', new Date()));
  };

  const handleAddParticipant = (user: User) => {
    if (participants.some(p => p.email === user.email)) {
      toast.error('This participant has already been added');
      return;
    }

    setParticipants([...participants, { email: user.email, name: user.name || undefined, image: user.image || undefined }]);
  };

  const handleRemoveParticipant = (email: string) => {
    setParticipants(participants.filter(p => p.email !== email));
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
        // Check if we're within the 3-hour limit (3 slots of 1 hour each)
        if (current.length < 3) {
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

    if (!reservationName.trim()) {
      toast.error('Please provide a name for the reservation');
      return;
    }

    if (passwordRequired && !password.trim()) {
      toast.error('Please enter event password');
      return;
    }

    if (requirePayment && !paymentDescription.trim()) {
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
          name: reservationName.trim(),
          startTime: selectedTimeSlots[0].startTime,
          endTime: getReservationEndTime(),
          participantIds: participants.map(p => p.email),
          description: description.trim() || null,
          paymentRequired: requirePayment,
          paymentInfo: paymentDescription.trim() || null,
          password: password.trim() || null,
          passwordRequired: passwordRequired,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        toast.success('Reservation created successfully');
        router.push(`/reservations/${data.id}`);
      } else {
        const data = await response.json();
        toast.error(data.error || 'Failed to create reservation');
      }
    } catch (error) {
      console.error('Error creating reservation:', error);
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
            <h2 className="text-xl font-semibold mb-4">Select Date</h2>
            <select
              value={selectedDate ? format(selectedDate, 'yyyy-MM-dd') : ''}
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
            <h2 className="text-xl font-semibold mb-4">Time Interval</h2>
            <div className="flex gap-4">
              <label className="inline-flex items-center">
                <input
                  type="radio"
                  value="1hour"
                  checked={timeInterval === '1hour'}
                  onChange={(e) => setTimeInterval(e.target.value as '1hour')}
                  className="form-radio text-primary"
                />
                <span className="ml-2">1 Hour</span>
              </label>
              <label className="inline-flex items-center">
                <input
                  type="radio"
                  value="30min"
                  checked={timeInterval === '30min'}
                  onChange={(e) => setTimeInterval(e.target.value as '30min')}
                  className="form-radio text-primary"
                />
                <span className="ml-2">30 Minutes</span>
              </label>
            </div>
          </div>

          <div>
            <h2 className="text-xl font-semibold mb-4">Pick Your Time Slots</h2>
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
                      {startTime instanceof Date && !isNaN(startTime.getTime()) ? formatInTimeZone(startTime, timeZone, 'h:mm a') : 'Invalid Time'}
                    </div>
                    <div className="text-xs mt-1">
                      {slot.isAvailable
                        ? isSelected
                          ? 'Selected'
                          : slot.isAvailable 
                            ? 'Pick Your Slot'
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
                {(() => {
                  const startTime = new Date(selectedTimeSlots[0].startTime);
                  return startTime instanceof Date && !isNaN(startTime.getTime()) 
                    ? formatInTimeZone(startTime, timeZone, 'EEEE, MMMM d, yyyy')
                    : 'Invalid Time';
                })()}
                <br />
                {(() => {
                  const startTime = new Date(selectedTimeSlots[0].startTime);
                  return startTime instanceof Date && !isNaN(startTime.getTime()) 
                    ? formatInTimeZone(startTime, timeZone, 'h:mm a')
                    : 'Invalid Time';
                })()}{' '}
                -{' '}
                {(() => {
                  const endTime = new Date(selectedTimeSlots[selectedTimeSlots.length - 1].endTime);
                  return endTime instanceof Date && !isNaN(endTime.getTime()) 
                    ? formatInTimeZone(endTime, timeZone, 'h:mm a')
                    : 'Invalid Time';
                })()}{' '}
                PT
              </p>
            </div>
          )}

          <div>
            <h2 className="text-xl font-semibold mb-4">Reservation Notes:</h2>
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
                id="requirePayment"
                checked={requirePayment}
                onChange={(e) => setRequirePayment(e.target.checked)}
                className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
              />
              <label htmlFor="requirePayment" className="text-gray-700">
                Require payment
              </label>
            </div>

            {requirePayment && (
              <div className="bg-gray-50 p-4 rounded-lg">
                <label htmlFor="paymentDescription" className="block text-sm font-medium text-gray-700 mb-2">
                  Payment Description
                </label>
                <input
                  id="paymentDescription"
                  value={paymentDescription}
                  onChange={(e) => setPaymentDescription(e.target.value)}
                  placeholder="Example: Venmo $6.25 per person @nick"
                  className="w-full p-3 border rounded text-gray-700 placeholder-gray-400"
                />
              </div>
            )}
          </div>

          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="requirePassword"
                checked={passwordRequired}
                onChange={(e) => setPasswordRequired(e.target.checked)}
                className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
              />
              <label htmlFor="requirePassword" className="text-gray-700">
                Require password to join
              </label>
            </div>

            {passwordRequired && (
              <div className="bg-gray-50 p-4 rounded-lg">
                <label htmlFor="eventPassword" className="block text-sm font-medium text-gray-700 mb-2">
                  Event Password
                </label>
                <input
                  id="eventPassword"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter a password for the event"
                  className="w-full p-3 border rounded text-gray-700 placeholder-gray-400"
                />
              </div>
            )}
          </div>

          <button
            onClick={handleReservation}
            className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Create Event
          </button>
        </div>
      </div>
    </main>
  );
} 