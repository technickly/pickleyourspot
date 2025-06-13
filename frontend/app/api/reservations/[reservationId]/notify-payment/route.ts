import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/auth';
import prisma from '@/lib/prisma';

export async function POST(
  request: Request,
  { params }: { params: { reservationId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Fetch the reservation with owner details
    const reservation = await prisma.reservation.findUnique({
      where: { id: params.reservationId },
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
      return NextResponse.json(
        { error: 'Reservation not found' },
        { status: 404 }
      );
    }

    // Verify the user is a participant
    const isParticipant = reservation.participants.some(
      (p: { user: { email: string } }) => p.user.email === session.user?.email
    );

    if (!isParticipant) {
      return NextResponse.json(
        { error: 'Not authorized to send payment notifications for this reservation' },
        { status: 403 }
      );
    }

    // Create a notification record
    await prisma.notification.create({
      data: {
        type: 'PAYMENT_SENT',
        userId: reservation.owner.id,
        title: 'Payment Notification',
        message: `${session.user.email} has sent payment for the reservation "${reservation.name}"`,
        reservationId: reservation.id,
      },
    });

    // In a real application, you might want to:
    // 1. Send an email to the owner
    // 2. Send a push notification
    // 3. Create a notification in your notification system
    // 4. Update the payment status automatically

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error sending payment notification:', error);
    return NextResponse.json(
      { error: 'Failed to send payment notification' },
      { status: 500 }
    );
  }
} 