import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import prisma from '@/lib/prisma';
import { authOptions } from '../../../auth/[...nextauth]/auth';

type RouteContext = {
  params: {
    reservationId: string;
  };
};

export async function POST(
  request: NextRequest,
  { params }: RouteContext
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { email } = await request.json();

    // Verify the user is the owner of the reservation
    const reservation = await prisma.reservation.findUnique({
      where: { id: params.reservationId },
      include: {
        owner: true,
        participants: true,
      },
    });

    if (!reservation) {
      return NextResponse.json(
        { error: 'Reservation not found' },
        { status: 404 }
      );
    }

    if (reservation.owner.email !== session.user.email) {
      return NextResponse.json(
        { error: 'Only the reservation owner can add participants' },
        { status: 403 }
      );
    }

    // Check if user is already a participant
    const isAlreadyParticipant = reservation.participants.some(
      (p) => p.email === email
    );

    if (isAlreadyParticipant) {
      return NextResponse.json(
        { error: 'User is already a participant' },
        { status: 400 }
      );
    }

    // Add the participant
    const updatedReservation = await prisma.reservation.update({
      where: { id: params.reservationId },
      data: {
        participants: {
          connect: { email },
        },
      },
      include: {
        participants: {
          select: {
            name: true,
            email: true,
            image: true,
          },
        },
      },
    });

    return NextResponse.json(updatedReservation.participants);
  } catch (error) {
    console.error('Failed to add participant:', error);
    return NextResponse.json(
      { error: 'Failed to add participant' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: RouteContext
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = request.nextUrl;
    const email = searchParams.get('email');

    if (!email) {
      return NextResponse.json(
        { error: 'Participant email is required' },
        { status: 400 }
      );
    }

    // Verify the user is the owner of the reservation
    const reservation = await prisma.reservation.findUnique({
      where: { id: params.reservationId },
      include: {
        owner: true,
      },
    });

    if (!reservation) {
      return NextResponse.json(
        { error: 'Reservation not found' },
        { status: 404 }
      );
    }

    if (reservation.owner.email !== session.user.email) {
      return NextResponse.json(
        { error: 'Only the reservation owner can remove participants' },
        { status: 403 }
      );
    }

    // Remove the participant
    const updatedReservation = await prisma.reservation.update({
      where: { id: params.reservationId },
      data: {
        participants: {
          disconnect: { email },
        },
      },
      include: {
        participants: {
          select: {
            name: true,
            email: true,
            image: true,
          },
        },
      },
    });

    return NextResponse.json(updatedReservation.participants);
  } catch (error) {
    console.error('Failed to remove participant:', error);
    return NextResponse.json(
      { error: 'Failed to remove participant' },
      { status: 500 }
    );
  }
} 