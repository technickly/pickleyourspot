import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import prisma from '@/lib/prisma';
import { authOptions } from '@/app/api/auth/[...nextauth]/auth';

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
        court: {
          select: {
            name: true,
            description: true,
            imageUrl: true,
          },
        },
        owner: {
          select: {
            name: true,
            email: true,
            image: true,
          },
        },
        participants: {
          select: {
            name: true,
            email: true,
            image: true,
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

    // Check if user has access to view this reservation
    const isOwner = reservation.owner.email === session.user.email;
    const isParticipant = reservation.participants.some(
      (p) => p.email === session.user.email
    );

    if (!isOwner && !isParticipant) {
      return NextResponse.json(
        { error: 'Not authorized to view this reservation' },
        { status: 403 }
      );
    }

    return NextResponse.json(reservation);
  } catch (error) {
    console.error('Failed to fetch reservation:', error);
    return NextResponse.json(
      { error: 'Failed to fetch reservation' },
      { status: 500 }
    );
  }
}

export async function PUT(
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

    // Check if the user is the owner
    const existingReservation = await prisma.reservation.findUnique({
      where: { id: reservationId },
      include: { owner: true },
    });

    if (!existingReservation) {
      return NextResponse.json(
        { error: 'Reservation not found' },
        { status: 404 }
      );
    }

    if (existingReservation.owner.email !== session.user.email) {
      return NextResponse.json(
        { error: 'Only the reservation owner can update the reservation' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const {
      name,
      startTime,
      endTime,
      description,
      paymentRequired,
      paymentInfo,
    } = body;

    // Validate required fields
    if (!name || !startTime || !endTime) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate payment info if required
    if (paymentRequired && !paymentInfo?.trim()) {
      return NextResponse.json(
        { error: 'Payment information is required when payment is required' },
        { status: 400 }
      );
    }

    // Check for overlapping reservations
    const overlappingReservations = await prisma.reservation.findMany({
      where: {
        id: { not: reservationId }, // Exclude current reservation
        courtId: existingReservation.courtId,
        OR: [
          {
            AND: [
              { startTime: { lte: new Date(startTime) } },
              { endTime: { gt: new Date(startTime) } },
            ],
          },
          {
            AND: [
              { startTime: { lt: new Date(endTime) } },
              { endTime: { gte: new Date(endTime) } },
            ],
          },
        ],
      },
    });

    if (overlappingReservations.length > 0) {
      return NextResponse.json(
        { error: 'This time slot overlaps with another reservation' },
        { status: 400 }
      );
    }

    // Update the reservation
    const updatedReservation = await prisma.reservation.update({
      where: { id: reservationId },
      data: {
        name,
        startTime: new Date(startTime),
        endTime: new Date(endTime),
        description: description?.trim(),
        paymentRequired,
        paymentInfo: paymentInfo?.trim(),
      },
      include: {
        court: {
          select: {
            name: true,
            description: true,
          },
        },
        owner: {
          select: {
            name: true,
            email: true,
          },
        },
        participants: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json(updatedReservation);
  } catch (error) {
    console.error('Failed to update reservation:', error);
    return NextResponse.json(
      { error: 'Failed to update reservation' },
      { status: 500 }
    );
  }
} 