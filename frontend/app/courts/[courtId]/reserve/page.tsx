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
  name?: string;
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
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
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
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentDescription, setPaymentDescription] = useState('');

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
    if (!selectedDate) return;
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

  const handleAddParticipant = () => {
    if (!newParticipantEmail) {
      toast.error('Please enter an email address');
      return;
    }

    if (participants.some(p => p.email === newParticipantEmail)) {
      toast.error('This participant has already been added');
      return;
    }

    setParticipants([...participants, { email: newParticipantEmail }]);
    setNewParticipantEmail('');
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

    if (requirePayment && (!paymentAmount || !paymentDescription)) {
      toast.error('Please provide payment amount and description');
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
          payment: requirePayment ? {
            amount: parseFloat(paymentAmount),
            description: paymentDescription
          } : null,
          userId: session?.user?.id,
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

  // Generate time slots based on interval and timezone
  const generateTimeSlots = () => {
    const slots: TimeSlot[] = [];
    const startHour = 8; // 8 AM
    const endHour = 20; // 8 PM
    const interval = timeInterval === '30min' ? 30 : 60;

    for (let hour = startHour; hour < endHour; hour++) {
      if (timeInterval === '30min') {
        slots.push({
          startTime: `${hour.toString().padStart(2, '0')}:00`,
          endTime: `${hour.toString().padStart(2, '0')}:30`,
          isAvailable: true,
          maxExtensionSlots: 1
        });
        slots.push({
          startTime: `${hour.toString().padStart(2, '0')}:30`,
          endTime: `${(hour + 1).toString().padStart(2, '0')}:00`,
          isAvailable: true,
          maxExtensionSlots: 1
        });
      } else {
        slots.push({
          startTime: `${hour.toString().padStart(2, '0')}:00`,
          endTime: `${(hour + 1).toString().padStart(2, '0')}:00`,
          isAvailable: true,
          maxExtensionSlots: 1
        });
      }
    }
    return slots;
  };

  // Auto-generate event name when date and time slots are selected
  useEffect(() => {
    if (selectedDate && selectedTimeSlots.length > 0) {
      const dateStr = selectedDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
      const timeStr = selectedTimeSlots[0].startTime;
      setReservationName(`Pickleball ${dateStr} ${timeStr}`);
    }
  }, [selectedDate, selectedTimeSlots]);

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
            <DatePicker
              selected={selectedDate}
              onChange={(date) => setSelectedDate(date)}
              minDate={new Date()}
              className="w-full p-2 border rounded"
              placeholderText="Select a date"
              required
            />
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
                <label htmlFor="paymentAmount" className="block text-sm font-medium text-gray-700 mb-2">
                  Payment Amount ($)
                </label>
                <input
                  id="paymentAmount"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  className="w-full p-3 border rounded text-gray-700 placeholder-gray-400"
                  placeholder="Enter payment amount"
                  min="0"
                  step="0.01"
                />
              </div>
            )}
          </div>

          <div className="space-y-4">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="requirePassword"
                checked={paymentRequired}
                onChange={(e) => setPaymentRequired(e.target.checked)}
                className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
              />
              <label htmlFor="requirePassword" className="ml-2 block text-sm text-gray-700">
                Require password to join
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