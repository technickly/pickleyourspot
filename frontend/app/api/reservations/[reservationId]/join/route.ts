import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import prisma from '@/lib/prisma';

interface ParticipantStatusType {
  id: string;
  userId: string;
  reservationId: string;
  hasPaid: boolean;
  isGoing: boolean;
  user: {
    email: string;
    name: string | null;
    image: string | null;
  };
}

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
    const { password, isGoing, hasPaid } = await request.json();

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
          include: {
            user: {
              select: {
                email: true,
                name: true,
                image: true,
              },
            },
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
      (p: ParticipantStatusType) => p.user.email === session.user.email
    );

    if (isParticipant) {
      return NextResponse.json(
        { error: 'Already a participant' },
        { status: 400 }
      );
    }

    // Verify password if required
    if (reservation.passwordRequired) {
      if (!password) {
        return NextResponse.json(
          { error: 'Password is required' },
          { status: 400 }
        );
      }

      if (password !== reservation.password) {
        return NextResponse.json(
          { error: 'Invalid password' },
          { status: 401 }
        );
      }
    }

    // Create participant status
    const participantStatus = await prisma.participantStatus.create({
      data: {
        userId: user.id,
        reservationId: reservation.id,
        isGoing: isGoing ?? true,
        hasPaid: hasPaid ?? false,
      },
      include: {
        user: {
          select: {
            email: true,
            name: true,
            image: true,
          },
        },
      },
    });

    // Return updated reservation
    const updatedReservation = await prisma.reservation.findUnique({
      where: { id: reservationId },
      include: {
        court: true,
        owner: true,
        participants: {
          include: {
            user: {
              select: {
                email: true,
                name: true,
                image: true,
              },
            },
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