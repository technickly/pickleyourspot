import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/auth';
import prisma from '@/lib/prisma';

interface Participant {
  user: {
    email: string;
    name: string | null;
  };
}

export async function POST(
  request: Request,
  { params }: { params: { reservationId: string } }
) {
  try {
    // Get the current user's session
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    // Ensure reservationId is provided
    const { reservationId } = params;
    if (!reservationId) {
      return new NextResponse('Reservation ID is required', { status: 400 });
    }

    // Fetch the reservation with owner details
    const reservation = await prisma.reservation.findUnique({
      where: { id: reservationId },
      include: {
        owner: true,
        participants: {
          include: {
            user: true,
          },
        },
      },
    });

    if (!reservation) {
      return new NextResponse('Reservation not found', { status: 404 });
    }

    // Find the current user in the participants
    const currentParticipant = reservation.participants.find(
      (p: Participant) => p.user.email === session.user.email
    );

    if (!currentParticipant) {
      return new NextResponse('User is not a participant in this reservation', { status: 403 });
    }

    try {
      // Create a notification record
      await prisma.notification.create({
        data: {
          type: 'PAYMENT_SENT',
          userId: reservation.owner.id,
          message: `${currentParticipant.user.name || currentParticipant.user.email} has marked their payment as sent for "${reservation.name}"`,
          reservationId: reservation.id,
          read: false,
        },
      });

      return NextResponse.json({ message: 'Payment notification sent successfully' });
    } catch (error) {
      console.error('Error creating notification:', error);
      return new NextResponse('Failed to create notification', { status: 500 });
    }
  } catch (error) {
    console.error('Error sending payment notification:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
} 