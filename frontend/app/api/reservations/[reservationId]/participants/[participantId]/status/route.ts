import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import prisma from '@/lib/prisma';
import { User } from '@prisma/client';
import { NextRequest } from 'next/server';

export async function PUT(
  request: NextRequest,
  { params }: { params: { reservationId: string; participantId: string } }
) {
  try {
    const session = await getServerSession();
    const { reservationId, participantId } = params;

    console.log('Status update request:', {
      reservationId,
      participantId,
      userEmail: session?.user?.email
    });

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { type, value } = await request.json();

    if (!type || !['isGoing', 'hasPaid'].includes(type)) {
      return NextResponse.json(
        { error: 'Invalid status type' },
        { status: 400 }
      );
    }

    if (typeof value !== 'boolean') {
      return NextResponse.json(
        { error: 'Status value must be a boolean' },
        { status: 400 }
      );
    }

    // Get the user making the request
    const requestingUser = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!requestingUser) {
      console.error('Requesting user not found:', session.user.email);
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Verify the user is authorized to update this status
    if (requestingUser.id !== participantId) {
      console.error('User not authorized:', {
        requestingUserId: requestingUser.id,
        targetUserId: participantId
      });
      return NextResponse.json(
        { error: 'You can only update your own status' },
        { status: 403 }
      );
    }

    // Get the reservation
    const reservation = await prisma.reservation.findUnique({
      where: { id: reservationId },
      include: {
        participants: {
          include: {
            user: true
          }
        }
      }
    });

    if (!reservation) {
      console.error('Reservation not found:', reservationId);
      return NextResponse.json(
        { error: 'Reservation not found' },
        { status: 404 }
      );
    }

    // Verify the user is a participant
    const isParticipant = reservation.participants.some(
      (p: { user: { id: string } }) => p.user.id === participantId
    );

    if (!isParticipant) {
      console.error('User is not a participant:', {
        userId: participantId,
        reservationId
      });
      return NextResponse.json(
        { error: 'User is not a participant in this reservation' },
        { status: 403 }
      );
    }

    // Update the participant status
    await prisma.participantStatus.update({
      where: {
        userId_reservationId: {
          userId: participantId,
          reservationId: reservationId
        }
      },
      data: {
        [type]: value
      }
    });

    // Get the updated reservation
    const updatedReservation = await prisma.reservation.findUnique({
      where: { id: reservationId },
      include: {
        participants: {
          include: {
            user: {
              select: {
                name: true,
                email: true,
                image: true,
              }
            }
          }
        }
      }
    });

    console.log('Status updated successfully:', {
      reservationId,
      participantId,
      type,
      value
    });

    return NextResponse.json(updatedReservation);
  } catch (error) {
    console.error('Failed to update participant status:', error);
    return NextResponse.json(
      { error: 'Failed to update participant status' },
      { status: 500 }
    );
  }
} 