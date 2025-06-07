import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import prisma from '@/lib/prisma';
import { authOptions } from '../../../auth/[...nextauth]/auth';

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

    const { email } = await request.json();

    // Find the user by email first
    const userToAdd = await prisma.user.findUnique({
      where: { email }
    });

    if (!userToAdd) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Verify the user is the owner of the reservation
    const reservation = await prisma.reservation.findUnique({
      where: { id: await params.reservationId },
      include: {
        owner: true,
        participants: {
          include: {
            user: true
          }
        },
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
        { error: 'Only the reservation owner can add participants' },
        { status: 403 }
      );
    }

    // Check if user is already a participant
    const isAlreadyParticipant = reservation.participants.some(
      (p: { user: { email: string } }) => p.user.email === email
    );

    if (isAlreadyParticipant) {
      return NextResponse.json(
        { error: 'User is already a participant' },
        { status: 400 }
      );
    }

    // Create the participant status
    const participantStatus = await prisma.participantStatus.create({
      data: {
        userId: userToAdd.id,
        reservationId: await params.reservationId,
        isGoing: true,
        hasPaid: false,
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

    return NextResponse.json({
      id: participantStatus.id,
      hasPaid: participantStatus.hasPaid,
      isGoing: participantStatus.isGoing,
      name: participantStatus.user.name,
      email: participantStatus.user.email,
      image: participantStatus.user.image,
    });
  } catch (error) {
    console.error('Failed to add participant:', error);
    return NextResponse.json(
      { error: 'Failed to add participant' },
      { status: 500 }
    );
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
      where: { id: await params.reservationId },
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
        reservationId: await params.reservationId,
      },
    });

    // Get updated participants list
    const updatedParticipants = await prisma.participantStatus.findMany({
      where: {
        reservationId: await params.reservationId,
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