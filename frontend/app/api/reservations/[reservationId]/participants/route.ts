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
    const { reservationId } = params;
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { participants } = await request.json();

    if (!Array.isArray(participants) || participants.length === 0) {
      return NextResponse.json(
        { error: 'At least one participant email is required' },
        { status: 400 }
      );
    }

    // Verify the user is the owner of the reservation
    const reservation = await prisma.reservation.findUnique({
      where: { id: reservationId },
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

    // Process each participant
    const addedParticipants = [];
    for (const email of participants) {
      if (!email) continue;

      // Find or create the user
      let userToAdd = await prisma.user.findUnique({
        where: { email }
      });

      if (!userToAdd) {
        userToAdd = await prisma.user.create({
          data: {
            email,
            name: email.split('@')[0], // Use the part before @ as a default name
          },
        });
      }

      // Check if user is already a participant
      const isAlreadyParticipant = reservation.participants.some(
        (p: { user: { email: string } }) => p.user.email === email
      );

      if (!isAlreadyParticipant) {
        // Create the participant status
        const participantStatus = await prisma.participantStatus.create({
          data: {
            userId: userToAdd.id,
            reservationId: reservationId,
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

        addedParticipants.push({
          id: participantStatus.id,
          hasPaid: participantStatus.hasPaid,
          isGoing: participantStatus.isGoing,
          name: participantStatus.user.name,
          email: participantStatus.user.email,
          image: participantStatus.user.image,
        });
      }
    }

    // Get updated reservation with all participants
    const updatedReservation = await prisma.reservation.findUnique({
      where: { id: reservationId },
      include: {
        participants: {
          include: {
            user: {
              select: {
                name: true,
                email: true,
                image: true,
              }
            }
          }
        },
      },
    });

    return NextResponse.json(updatedReservation);
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