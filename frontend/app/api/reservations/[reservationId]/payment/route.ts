import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import prisma from '@/lib/prisma';

interface ParticipantStatusWithUser {
  id: string;
  hasPaid: boolean;
  isGoing: boolean;
  updatedAt: Date;
  userId: string;
  reservationId: string;
  user: {
    name: string | null;
    email: string;
  };
}

interface PaymentStatusResponse {
  userId: string;
  name: string | null;
  email: string;
  hasPaid: boolean;
  isGoing: boolean;
}

export async function GET(
  request: Request,
  context: { params: Promise<{ reservationId: string }> }
) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { reservationId } = await context.params;

    // Get the reservation to check ownership
    const reservation = await prisma.reservation.findUnique({
      where: { id: reservationId },
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

    // Get all participant statuses for this reservation
    const participantStatuses = await (prisma as any).ParticipantStatus.findMany({
      where: {
        reservationId: reservationId,
      },
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    });

    // Format the response
    const formattedStatuses: PaymentStatusResponse[] = participantStatuses.map((status: ParticipantStatusWithUser) => ({
      userId: status.userId,
      name: status.user.name,
      email: status.user.email,
      hasPaid: status.hasPaid,
      isGoing: status.isGoing,
    }));

    return NextResponse.json(formattedStatuses);
  } catch (error) {
    console.error('Error fetching payment statuses:', error);
    return NextResponse.json(
      { error: 'Failed to fetch payment statuses' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  context: { params: Promise<{ reservationId: string }> }
) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { reservationId } = await context.params;
    const { userId, hasPaid } = await request.json();

    // Get the reservation to check ownership
    const reservation = await prisma.reservation.findUnique({
      where: { id: reservationId },
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

    // Only allow the owner to update payment status
    if (reservation.owner.email !== session.user.email) {
      return NextResponse.json(
        { error: 'Only the reservation owner can update payment status' },
        { status: 403 }
      );
    }

    // Update the payment status
    const updatedStatus = await (prisma as any).ParticipantStatus.update({
      where: {
        userId_reservationId: {
          userId: userId,
          reservationId: reservationId,
        },
      },
      data: {
        hasPaid: hasPaid,
      },
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    });

    const response: PaymentStatusResponse = {
      userId: updatedStatus.userId,
      name: updatedStatus.user.name,
      email: updatedStatus.user.email,
      hasPaid: updatedStatus.hasPaid,
      isGoing: updatedStatus.isGoing,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error updating payment status:', error);
    return NextResponse.json(
      { error: 'Failed to update payment status' },
      { status: 500 }
    );
  }
} 