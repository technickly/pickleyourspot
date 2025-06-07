import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import prisma from '@/lib/prisma';

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
    const { userId, type, value } = await request.json();

    // Verify the reservation exists and the user has permission to update it
    const reservation = await prisma.reservation.findUnique({
      where: { id: reservationId },
      include: {
        owner: {
          select: {
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

    // Only allow the owner or the participant themselves to update their status
    const isOwner = reservation.owner.email === session.user.email;
    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true },
    });

    const isParticipant = session.user.email === targetUser?.email;

    if (!isOwner && !isParticipant) {
      return NextResponse.json(
        { error: 'Not authorized to update this status' },
        { status: 403 }
      );
    }

    // Update the participant status
    const updatedStatus = await prisma.participantStatus.update({
      where: {
        userId_reservationId: {
          userId,
          reservationId,
        },
      },
      data: {
        ...(type === 'payment' ? { hasPaid: value } : { isGoing: value }),
      },
    });

    return NextResponse.json(updatedStatus);
  } catch (error) {
    console.error('Error updating participant status:', error);
    return NextResponse.json(
      { error: 'Failed to update participant status' },
      { status: 500 }
    );
  }
} 