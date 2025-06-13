'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { toast } from 'react-hot-toast';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";

interface TimeSlot {
  startTime: string;
  endTime: string;
}

export default function ReservePage() {
  const { courtId } = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTimeSlots, setSelectedTimeSlots] = useState<TimeSlot[]>([]);
  const [name, setName] = useState('');
  const [notes, setNotes] = useState('');

  const timeSlots: TimeSlot[] = [
    { startTime: '06:00', endTime: '07:00' },
    { startTime: '07:00', endTime: '08:00' },
    { startTime: '08:00', endTime: '09:00' },
    { startTime: '09:00', endTime: '10:00' },
    { startTime: '10:00', endTime: '11:00' },
    { startTime: '11:00', endTime: '12:00' },
    { startTime: '12:00', endTime: '13:00' },
    { startTime: '13:00', endTime: '14:00' },
    { startTime: '14:00', endTime: '15:00' },
    { startTime: '15:00', endTime: '16:00' },
    { startTime: '16:00', endTime: '17:00' },
    { startTime: '17:00', endTime: '18:00' },
    { startTime: '18:00', endTime: '19:00' },
    { startTime: '19:00', endTime: '20:00' },
    { startTime: '20:00', endTime: '21:00' },
  ];

  const handleTimeSlotClick = (slot: TimeSlot) => {
    setSelectedTimeSlots(prev => {
      if (prev.some(s => s.startTime === slot.startTime)) {
        return prev.filter(s => s.startTime !== slot.startTime);
      }
      if (prev.length < 3) {
        return [...prev, slot];
      }
      return prev;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedDate || selectedTimeSlots.length === 0) {
      toast.error('Please select a date and at least one time slot');
      return;
    }

    try {
      const response = await fetch('/api/reservations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          courtId,
          date: selectedDate.toISOString(),
          timeSlots: selectedTimeSlots,
          name,
          notes,
          userId: session?.user?.id,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create event');
      }

      toast.success('Event created successfully!');
      router.push('/courts');
    } catch (error) {
      console.error('Error creating event:', error);
      toast.error('Failed to create event');
    }
  };

  return (
    <main className="min-h-screen p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Create Event</h1>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700">
              Event Name
            </label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
              placeholder="Enter event name"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Date
            </label>
            <DatePicker
              selected={selectedDate}
              onChange={(date) => setSelectedDate(date)}
              minDate={new Date()}
              className="w-full p-2 border rounded-md"
              placeholderText="Select a date"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Time Slots (up to 3)
            </label>
            <div className="grid grid-cols-3 gap-2">
              {timeSlots.map((slot) => (
                <button
                  key={slot.startTime}
                  type="button"
                  onClick={() => handleTimeSlotClick(slot)}
                  className={`p-2 text-sm rounded-md border ${
                    selectedTimeSlots.some(s => s.startTime === slot.startTime)
                      ? 'bg-primary text-white'
                      : 'bg-white text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {slot.startTime} - {slot.endTime}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label htmlFor="notes" className="block text-sm font-medium text-gray-700">
              Event Notes
            </label>
            <textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={4}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
              placeholder="Add any notes about the event"
            ></textarea>
          </div>

          <button
            type="submit"
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
          >
            Create Event
          </button>
        </form>
      </div>
    </main>
  );
} 