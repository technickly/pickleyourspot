import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import prisma from '@/lib/prisma';
import { authOptions } from '@/app/api/auth/[...nextauth]/auth';

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

interface JoinRequestBody {
  isGoing: boolean;
  hasPaid: boolean;
}

export async function POST(
  request: Request,
  context: { params: Promise<{ reservationId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    const { reservationId } = await context.params;
    const { isGoing, hasPaid } = await request.json() as JoinRequestBody;

    // Find the reservation
    const reservation = await prisma.reservation.findUnique({
      where: { id: reservationId },
      include: {
        participants: {
          include: {
            user: true,
          },
        },
      },
    });

    if (!reservation) {
      return new Response(JSON.stringify({ error: 'Reservation not found' }), { status: 404 });
    }

    // Check if user is already a participant
    const existingParticipant = reservation.participants.find(
      (p) => p.user.id === session.user.id
    );

    if (existingParticipant) {
      return new Response(JSON.stringify({ error: 'Already a participant' }), { status: 400 });
    }

    // Create participant status
    const participantStatus = await prisma.participantStatus.create({
      data: {
        userId: session.user.id,
        reservationId,
        isGoing,
        hasPaid,
      },
      include: {
        user: {
          select: {
            name: true,
            email: true,
            image: true,
          },
        },
      },
    });

    return new Response(JSON.stringify(participantStatus));
  } catch (error) {
    console.error('Error joining reservation:', error);
    return new Response(JSON.stringify({ error: 'Failed to join reservation' }), { status: 500 });
  }
} 