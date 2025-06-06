'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { toast } from 'react-hot-toast';
import { format, parse, addDays, startOfDay } from 'date-fns';
import { formatInTimeZone } from 'date-fns-tz';

interface TimeSlot {
  startTime: string;
  endTime: string;
  isAvailable: boolean;
  maxExtensionSlots: number;
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

      if (slotIndex === lastSelectedIndex + 1 && current.length < 6) {
        return [...current, slot];
      }

      return [slot];
    });
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
            <h1 className="text-3xl font-bold">Edit Reservation</h1>
            <button
              onClick={() => router.back()}
              className="text-gray-600 hover:text-gray-800"
            >
              ← Back
            </button>
          </div>
          <p className="text-gray-600 mt-2">{reservation.court.name}</p>
        </header>

        <div className="space-y-8">
          <div>
            <h2 className="text-xl font-semibold mb-4">Reservation Name</h2>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
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
            <h2 className="text-xl font-semibold mb-4">Choose Time Slots</h2>
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
                    disabled={!slot.isAvailable && !isSelected}
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
                      {slot.isAvailable || isSelected
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

          <div>
            <h2 className="text-xl font-semibold mb-4">Notes (Optional)</h2>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add any additional notes or instructions for participants..."
              className="w-full p-4 border rounded min-h-[120px] text-gray-700 placeholder-gray-400"
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
                  className="rounded text-blue-500"
                />
                <span>Require payment from participants</span>
              </label>

              {paymentRequired && (
                <textarea
                  value={paymentInfo}
                  onChange={(e) => setPaymentInfo(e.target.value)}
                  placeholder="Enter payment details (e.g., Venmo username, payment amount, etc.)"
                  className="w-full p-4 border rounded text-gray-700 placeholder-gray-400"
                  rows={3}
                />
              )}
            </div>
          </div>

          <div className="flex gap-4">
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="flex-1 bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors disabled:bg-blue-300"
            >
              {isSaving ? 'Saving...' : 'Save Changes'}
            </button>
            <button
              onClick={() => router.back()}
              className="flex-1 border border-gray-300 text-gray-700 py-3 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </main>
  );
} 