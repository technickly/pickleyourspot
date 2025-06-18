import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/lib/prisma';

interface User {
  id: string;
  name: string | null;
  email: string;
  image: string | null;
}

interface ParticipantStatus {
  userId: string;
  hasPaid: boolean;
  isGoing: boolean;
  user: User;
}

export async function GET(
  request: Request,
  context: { params: Promise<{ reservationId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    const { reservationId } = await context.params;

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const reservation = await prisma.reservation.findUnique({
      where: { id: reservationId },
      include: {
        court: true,
        owner: true,
        participants: {
          include: {
            user: true,
          },
        },
        messages: {
          include: {
            user: true,
          },
          orderBy: {
            createdAt: 'asc',
          },
        },
      },
    });

    if (!reservation) {
      return NextResponse.json(
        { error: 'Reservation not found' },
        { status: 404 }
      );
    }

    // Check if user is owner or participant
    const isOwner = reservation.owner.email === session.user.email;
    const isParticipant = reservation.participants.some(
      (p) => p.user.email === session.user.email
    );

    if (!isOwner && !isParticipant) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Add isOwner flag to the response
    const response = {
      ...reservation,
      isOwner,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching reservation:', error);
    return NextResponse.json(
      { error: 'Failed to fetch reservation' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { reservationId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const reservation = await prisma.reservation.findUnique({
      where: { id: params.reservationId },
      include: { 
        owner: true,
        court: true
      },
    });

    if (!reservation) {
      return new NextResponse('Reservation not found', { status: 404 });
    }

    // Check if user is owner
    if (reservation.owner.email !== session.user.email) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const body = await request.json();
    const { 
      description, 
      paymentInfo, 
      startTime, 
      endTime, 
      password,
      passwordRequired 
    } = body;

    // Validate time slots if provided
    if (startTime && endTime) {
      const newStartTime = new Date(startTime);
      const newEndTime = new Date(endTime);

      if (newStartTime >= newEndTime) {
        return new NextResponse('End time must be after start time', { status: 400 });
      }

      // Check for overlapping reservations
      const overlappingReservation = await prisma.reservation.findFirst({
        where: {
          courtId: reservation.courtId,
          id: { not: reservation.id },
          OR: [
            {
              AND: [
                { startTime: { lte: newStartTime } },
                { endTime: { gt: newStartTime } }
              ]
            },
            {
              AND: [
                { startTime: { lt: newEndTime } },
                { endTime: { gte: newEndTime } }
              ]
            }
          ]
        }
      });

      if (overlappingReservation) {
        return new NextResponse('Time slot overlaps with another reservation', { status: 400 });
      }
    }

    // Update the reservation
    const updatedReservation = await prisma.reservation.update({
      where: { id: params.reservationId },
      data: {
        description: description !== undefined ? description : undefined,
        paymentInfo: paymentInfo !== undefined ? paymentInfo : undefined,
        startTime: startTime ? new Date(startTime) : undefined,
        endTime: endTime ? new Date(endTime) : undefined,
        password: passwordRequired ? (password || null) : null,
        passwordRequired: passwordRequired !== undefined ? passwordRequired : undefined,
      },
      include: {
        court: true,
        owner: true,
        participants: {
          include: {
            user: true,
          },
        },
        messages: {
          include: {
            user: true,
          },
          orderBy: {
            createdAt: 'asc',
          },
        },
      },
    });

    return NextResponse.json(updatedReservation);
  } catch (error) {
    console.error('Error updating reservation:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
} 