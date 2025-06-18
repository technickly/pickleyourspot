import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import prisma from '@/lib/prisma';
import { User } from '@prisma/client';

export async function PUT(
  request: Request,
  { params }: { params: { reservationId: string; participantId: string } }
) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { type, value } = await request.json();
    if (type !== 'isGoing' && type !== 'hasPaid') {
      return NextResponse.json(
        { error: 'Invalid status type' },
        { status: 400 }
      );
    }

    // Get the user
    const user = await prisma.user.findUnique({
      where: { email: params.participantId },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Verify that the requesting user is the same as the target user
    if (user.email !== session.user.email) {
      return NextResponse.json(
        { error: 'You can only update your own status' },
        { status: 403 }
      );
    }

    // Get the reservation
    const reservation = await prisma.reservation.findUnique({
      where: { id: params.reservationId },
      include: { participants: true },
    });

    if (!reservation) {
      return NextResponse.json(
        { error: 'Reservation not found' },
        { status: 404 }
      );
    }

    // Verify that the user is a participant
    const isParticipant = reservation.participants.some((p: User) => p.id === user.id);
    if (!isParticipant) {
      return NextResponse.json(
        { error: 'User is not a participant in this reservation' },
        { status: 403 }
      );
    }

    if (type === 'isGoing') {
      if (value) {
        // Add user to participants if not already there
        if (!isParticipant) {
          await prisma.reservation.update({
            where: { id: params.reservationId },
            data: {
              participants: {
                connect: { id: user.id },
              },
            },
          });
        }
      } else {
        // Remove user from participants
        await prisma.reservation.update({
          where: { id: params.reservationId },
          data: {
            participants: {
              disconnect: { id: user.id },
            },
          },
        });
      }
    } else if (type === 'hasPaid') {
      // Update user's hasPaid status
      await prisma.user.update({
        where: { id: user.id },
        data: {
          hasPaid: value,
        },
      });
    }

    // Return updated reservation with participants
    const updatedReservation = await prisma.reservation.findUnique({
      where: { id: params.reservationId },
      include: {
        participants: true,
      },
    });

    return NextResponse.json(updatedReservation);
  } catch (error) {
    console.error('Error updating participant status:', error);
    return NextResponse.json(
      { error: 'Failed to update participant status' },
      { status: 500 }
    );
  }
} 