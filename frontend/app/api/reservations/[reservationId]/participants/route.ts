import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import prisma from '@/lib/prisma';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

interface ParticipantStatus {
  id: string;
  hasPaid: boolean;
  isGoing: boolean;
  user: {
    name: string | null;
    email: string;
    image: string | null;
  };
}

export async function POST(
  request: Request,
  { params }: { params: { reservationId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const { userId } = await request.json();
    if (!userId) {
      return new NextResponse('User ID is required', { status: 400 });
    }

    // Get the reservation ID from params
    const { reservationId } = params;

    // Check if the user making the request is the reservation owner
    const reservation = await prisma.reservation.findUnique({
      where: { id: reservationId },
      include: {
        owner: true
      }
    });

    if (!reservation) {
      return new NextResponse('Reservation not found', { status: 404 });
    }

    if (reservation.owner.email !== session.user.email) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    // Check if the participant already exists
    const existingParticipant = await prisma.participantStatus.findUnique({
      where: {
        userId_reservationId: {
          userId,
          reservationId
        }
      }
    });

    if (existingParticipant) {
      return new NextResponse('User is already a participant', { status: 400 });
    }

    // Add the participant with default values
    const participant = await prisma.participantStatus.create({
      data: {
        userId,
        reservationId,
        isGoing: true,
        hasPaid: false
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true
          }
        }
      }
    });

    return NextResponse.json(participant);
  } catch (error) {
    console.error('Error adding participant:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
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

    const { searchParams } = request.nextUrl;
    const email = searchParams.get('email');

    if (!email) {
      return NextResponse.json(
        { error: 'Participant email is required' },
        { status: 400 }
      );
    }

    // Verify the user is the owner of the reservation
    const reservation = await prisma.reservation.findUnique({
      where: { id: params.reservationId },
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

    if (reservation.owner.email !== session.user.email) {
      return NextResponse.json(
        { error: 'Only the reservation owner can remove participants' },
        { status: 403 }
      );
    }

    // Find the user to remove
    const userToRemove = await prisma.user.findUnique({
      where: { email }
    });

    if (!userToRemove) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Remove the participant status
    await prisma.participantStatus.deleteMany({
      where: {
        userId: userToRemove.id,
        reservationId: params.reservationId,
      },
    });

    // Get updated participants list
    const updatedParticipants = await prisma.participantStatus.findMany({
      where: {
        reservationId: params.reservationId,
      },
      include: {
        user: {
          select: {
            name: true,
            email: true,
            image: true,
          }
        }
      }
    });

    return NextResponse.json(
      updatedParticipants.map((p: ParticipantStatus) => ({
        name: p.user.name,
        email: p.user.email,
        image: p.user.image,
        hasPaid: p.hasPaid,
        isGoing: p.isGoing,
      }))
    );
  } catch (error) {
    console.error('Failed to remove participant:', error);
    return NextResponse.json(
      { error: 'Failed to remove participant' },
      { status: 500 }
    );
  }
}

export async function GET(
  request: Request,
  { params }: { params: { reservationId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const reservation = await prisma.reservation.findUnique({
      where: { id: params.reservationId },
      include: {
        participants: {
          include: {
            user: {
              select: {
                name: true,
                email: true,
              },
            },
          },
        },
      },
    });

    if (!reservation) {
      return NextResponse.json({ error: 'Reservation not found' }, { status: 404 });
    }

    // Check if user is authorized to view participants
    const isOwner = reservation.ownerEmail === session.user.email;
    const isParticipant = reservation.participants.some(
      (p: { user: { email: string } }) => p.user.email === session.user.email
    );

    if (!isOwner && !isParticipant) {
      return NextResponse.json({ error: 'Not authorized to view participants' }, { status: 403 });
    }

    return NextResponse.json(reservation.participants);
  } catch (error) {
    console.error('Error fetching participants:', error);
    return NextResponse.json(
      { error: 'Failed to fetch participants' },
      { status: 500 }
    );
  }
} 