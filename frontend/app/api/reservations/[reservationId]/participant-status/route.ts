import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/auth';
import prisma from '@/lib/prisma';
import { z } from 'zod';

interface Participant {
  id: string;
  user: {
    id: string;
    email: string;
  };
}

const updateStatusSchema = z.object({
  userId: z.string().min(1, 'User ID is required'),
  type: z.enum(['payment', 'attendance']),
  value: z.boolean(),
});

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ reservationId: string }> }
) {
  try {
    const { reservationId } = await params;
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validatedData = updateStatusSchema.parse(body);
    const { userId, type, value } = validatedData;

    // Fetch the reservation and check permissions
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
      return NextResponse.json(
        { error: 'Reservation not found' },
        { status: 404 }
      );
    }

    // Only allow the owner or the participant themselves to update their status
    const isOwner = reservation.owner.email === session.user.email;
    const participant = reservation.participants.find(
      (p: Participant) => p.user.id === userId
    );

    if (!participant) {
      return NextResponse.json(
        { error: 'Participant not found' },
        { status: 404 }
      );
    }

    if (!isOwner && participant.user.email !== session.user.email) {
      return NextResponse.json(
        { error: 'Unauthorized to update this participant\'s status' },
        { status: 403 }
      );
    }

    // Update the participant status
    const updatedParticipant = await prisma.participantStatus.update({
      where: {
        userId_reservationId: {
          userId: userId,
          reservationId: reservationId,
        },
      },
      data: {
        ...(type === 'payment' ? { hasPaid: value } : { isGoing: value }),
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
      },
    });

    return NextResponse.json({
      id: updatedParticipant.id,
      userId: updatedParticipant.userId,
      hasPaid: updatedParticipant.hasPaid,
      isGoing: updatedParticipant.isGoing,
      name: updatedParticipant.user.name,
      email: updatedParticipant.user.email,
      image: updatedParticipant.user.image,
    });
  } catch (error: unknown) {
    console.error('Error updating participant status:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }

    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to update participant status' },
      { status: 500 }
    );
  }
} 