import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { addHours, format, parse } from 'date-fns';
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

    // Parse the date and create a PT date object
    const selectedDate = parse(date, 'yyyy-MM-dd', new Date());
    
    // Create 8 AM PT time
    const startTimePT = new Date(
      selectedDate.getFullYear(),
      selectedDate.getMonth(),
      selectedDate.getDate(),
      8, // 8 AM PT
      0  // 0 minutes
    );

    // Create 6 PM PT time
    const endTimePT = new Date(
      selectedDate.getFullYear(),
      selectedDate.getMonth(),
      selectedDate.getDate(),
      18, // 6 PM PT
      0   // 0 minutes
    );

    // Get timezone offset in milliseconds
    const tzOffset = getTimezoneOffset(TIME_ZONE, startTimePT);
    
    // Convert PT times to UTC for database queries
    const startTimeUTC = new Date(startTimePT.getTime() - tzOffset);
    const endTimeUTC = new Date(endTimePT.getTime() - tzOffset);

    // Find all reservations for this court on the selected day
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

    // Generate all possible 1-hour time slots
    const timeSlots = [];
    let currentTime = startTimeUTC;

    while (currentTime < endTimeUTC) {
      const slotEndTime = addHours(currentTime, 1);
      
      // Check if this slot overlaps with any existing reservation
      const isAvailable = !reservations.some(reservation => 
        (currentTime >= new Date(reservation.startTime) && currentTime < new Date(reservation.endTime)) ||
        (slotEndTime > new Date(reservation.startTime) && slotEndTime <= new Date(reservation.endTime))
      );

      // Calculate how many more consecutive slots are available after this one
      let maxExtensionSlots = 0;
      if (isAvailable) {
        let checkTime = slotEndTime;
        while (
          maxExtensionSlots < 2 && // Max 3 hours (3 slots total)
          checkTime < endTimeUTC &&
          !reservations.some(reservation =>
            checkTime >= new Date(reservation.startTime) && checkTime < new Date(reservation.endTime)
          )
        ) {
          maxExtensionSlots++;
          checkTime = addHours(checkTime, 1);
        }
      }

      // Convert UTC times back to PT for client display
      const ptStartTime = toZonedTime(currentTime, TIME_ZONE);
      const ptEndTime = toZonedTime(slotEndTime, TIME_ZONE);

      timeSlots.push({
        startTime: ptStartTime.toISOString(),
        endTime: ptEndTime.toISOString(),
        isAvailable,
        maxExtensionSlots
      });

      currentTime = slotEndTime;
    }

    return NextResponse.json(timeSlots);
  } catch (error) {
    console.error('Failed to fetch time slots:', error);
    return NextResponse.json(
      { error: 'Failed to fetch time slots' },
      { status: 500 }
    );
  }
} 