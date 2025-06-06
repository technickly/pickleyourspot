import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { addMinutes, format, parse, setHours, setMinutes } from 'date-fns';
import { toZonedTime, getTimezoneOffset } from 'date-fns-tz';

const TIME_ZONE = 'America/Los_Angeles';

export async function GET(
  request: Request,
  context: { params: Promise<{ courtId: string }> }
) {
  try {
    const { courtId } = await context.params;
    const url = new URL(request.url);
    const date = url.searchParams.get('date');

    if (!date) {
      return NextResponse.json(
        { error: 'Date parameter is required' },
        { status: 400 }
      );
    }

    // Parse the input date
    const selectedDate = parse(date, 'yyyy-MM-dd', new Date());

    // Set the start time to 8 AM PT
    const startTime = setMinutes(setHours(selectedDate, 8), 0);
    // Convert to UTC accounting for timezone
    const tzOffset = getTimezoneOffset(TIME_ZONE, startTime);
    const startTimeUTC = new Date(startTime.getTime() - tzOffset);

    // Set the end time to 6 PM PT
    const endTime = setMinutes(setHours(selectedDate, 18), 0);
    const endTimeUTC = new Date(endTime.getTime() - tzOffset);

    // Find existing reservations
    const reservations = await prisma.reservation.findMany({
      where: {
        courtId,
        startTime: {
          gte: startTimeUTC,
          lt: endTimeUTC,
        },
      },
      select: {
        startTime: true,
        endTime: true,
      },
    });

    // Generate 30-minute time slots
    const timeSlots = [];
    let currentSlot = startTimeUTC;

    while (currentSlot < endTimeUTC) {
      const slotEndTime = addMinutes(currentSlot, 30);
      
      // Convert times to PT for checking availability
      const slotStartPT = toZonedTime(currentSlot, TIME_ZONE);
      const slotEndPT = toZonedTime(slotEndTime, TIME_ZONE);

      const isAvailable = !reservations.some(reservation => {
        const reservationStart = toZonedTime(reservation.startTime, TIME_ZONE);
        const reservationEnd = toZonedTime(reservation.endTime, TIME_ZONE);
        return (
          (slotStartPT >= reservationStart && slotStartPT < reservationEnd) ||
          (slotEndPT > reservationStart && slotEndPT <= reservationEnd)
        );
      });

      timeSlots.push({
        startTime: currentSlot.toISOString(),
        endTime: slotEndTime.toISOString(),
        isAvailable,
      });

      currentSlot = slotEndTime;
    }

    return NextResponse.json(timeSlots);
  } catch (error) {
    console.error('Error generating time slots:', error);
    return NextResponse.json(
      { error: 'Failed to generate time slots' },
      { status: 500 }
    );
  }
} 