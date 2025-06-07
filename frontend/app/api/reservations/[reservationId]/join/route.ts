import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import prisma from '@/lib/prisma';

interface ParticipantStatusType {
  id: string;
  userId: string;
  reservationId: string;
  hasPaid: boolean;
  isGoing: boolean;
  userEmail: string;
  userName: string | null;
  userImage: string | null;
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
      (p: ParticipantStatusType) => p.userEmail === session.user.email
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
          create: {
            userId: user.id,
            userEmail: user.email,
            userName: user.name,
            userImage: user.image,
            hasPaid: false,
            isGoing: true
          }
        }
      },
      include: {
        court: true,
        owner: true,
        participants: true
      }
    });

    // Transform the response to match the expected format
    const transformedReservation = {
      id: updatedReservation.id,
      name: updatedReservation.name,
      startTime: updatedReservation.startTime,
      endTime: updatedReservation.endTime,
      description: updatedReservation.description,
      paymentRequired: updatedReservation.paymentRequired,
      paymentInfo: updatedReservation.paymentInfo,
      shortUrl: updatedReservation.shortUrl,
      court: {
        name: updatedReservation.court.name,
        description: updatedReservation.court.description,
        imageUrl: updatedReservation.court.imageUrl,
      },
      owner: {
        name: updatedReservation.owner.name,
        email: updatedReservation.owner.email,
        image: updatedReservation.owner.image,
      },
      participants: updatedReservation.participants.map((participant: ParticipantStatusType) => ({
        name: participant.userName,
        email: participant.userEmail,
        hasPaid: participant.hasPaid,
        isGoing: participant.isGoing,
      })),
    };

    return NextResponse.json(transformedReservation);
  } catch (error) {
    console.error('Error joining reservation:', error);
    return NextResponse.json(
      { error: 'Failed to join reservation' },
      { status: 500 }
    );
  }
} 