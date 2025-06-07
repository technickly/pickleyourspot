import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import prisma from '@/lib/prisma';

export async function POST(
  request: Request,
  context: { params: Promise<{ reservationId: string }> }
) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { reservationId } = await context.params;

    // Find the user
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if the reservation exists
    const reservation = await prisma.reservation.findUnique({
      where: { id: reservationId },
      include: {
        participants: {
          select: {
            id: true,
            email: true,
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

    // Check if user is already a participant
    const isParticipant = reservation.participants.some(
      (p) => p.email === session.user.email
    );

    if (isParticipant) {
      return NextResponse.json(
        { error: 'Already a participant' },
        { status: 400 }
      );
    }

    // Add user as a participant
    const updatedReservation = await prisma.reservation.update({
      where: { id: reservationId },
      data: {
        participants: {
          connect: { id: user.id },
        },
      },
      include: {
        court: {
          select: {
            name: true,
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
    console.error('Error joining reservation:', error);
    return NextResponse.json(
      { error: 'Failed to join reservation' },
      { status: 500 }
    );
  }
} 